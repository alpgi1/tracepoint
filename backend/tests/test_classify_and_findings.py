from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.classify.fewshot import nearest_examples, query_terms
from tracepoint.classify.gap import run_gap_classification, select_targets
from tracepoint.classify.segment import run_segmentation
from tracepoint.classify.validation import prepare_sample
from tracepoint.core.runs import start_run
from tracepoint.core.settings import Settings
from tracepoint.db.models import (
    AuditEvent,
    Finding,
    FindingEvidence,
    FindingLink,
    TaxonomyLevel2,
    VerbatimClassification,
    VerbatimSegment,
)
from tracepoint.findings.extract import extract_findings
from tracepoint.findings.report import render_findings
from tracepoint.llm.gateway import FakeProvider, LlmGateway


def test_query_terms_and_fewshot(engine, ingested):
    assert "range" in query_terms("I wish the electric range was better in winter")
    with Session(engine) as session:
        examples = nearest_examples(
            session, "G60", "the electric range is not good enough in winter", k=5
        )
        assert 1 <= len(examples) <= 5
        text, labels = examples[0]
        assert labels and len(labels[0]) == 3


def test_gap_classification_with_fake_provider(engine, ingested):
    def responder(kw):
        if "nonsense-theme" in kw["user"]:
            return {
                "is_product_feedback": True,
                "labels": [
                    {
                        "feedback_type": "Wants",
                        "level2": "Built-in espresso machine",
                        "level3": "Customer request: function",
                        "confidence": 0.4,
                        "rationale": "wish",
                        "new_theme": {
                            "name": "Built-in espresso machine",
                            "closest_existing": "Cupholder",
                            "reason": "no theme",
                        },
                    }
                ],
                "note": None,
            }
        return {
            "is_product_feedback": True,
            "labels": [
                {
                    "feedback_type": "Likes",
                    "level2": "Drivetrain",
                    "level3": "Like: function",
                    "confidence": 0.8,
                    "rationale": "praise",
                    "new_theme": None,
                }
            ],
            "note": None,
        }

    provider = FakeProvider(responder)
    with Session(engine) as session, start_run(session, "test.classify") as run:
        targets = select_targets(session, "F70", limit=3)
        assert len(targets) == 3
        gw = LlmGateway(session, provider, run.id, Settings())
        stats = run_gap_classification(session, run, "F70", gw, limit=3)
        assert stats["classified"] == 3 and stats["labels_added"] >= 1
        rows = session.scalars(
            select(VerbatimClassification).where(VerbatimClassification.origin == "llm")
        ).all()
        assert rows and all(r.model_id == "fake-model" and r.confidence is not None for r in rows)
        events = session.scalar(
            select(func.count())
            .select_from(AuditEvent)
            .where(AuditEvent.action == "classification.llm_added")
        )
        assert events >= 3
        # second run finds no new targets (already labelled) and makes no provider calls
        assert select_targets(session, "F70", limit=3) != targets
        # proposal path: craft a verbatim text that triggers the new-theme branch
        v = select_targets(session, "F70", limit=1)[0]
        v.text = v.text + " nonsense-theme"
        session.flush()
        before = len(provider.calls)
        stats2 = run_gap_classification(session, run, "F70", gw, limit=1)
        assert len(provider.calls) == before + 1 and stats2.get("proposals") == 1
        proposed = session.scalars(
            select(TaxonomyLevel2).where(TaxonomyLevel2.status == "proposed")
        ).all()
        assert proposed and proposed[0].name == "Built-in espresso machine"
        prop_rows = session.scalars(
            select(VerbatimClassification).where(VerbatimClassification.level2_id == proposed[0].id)
        ).all()
        assert prop_rows and prop_rows[0].status == "proposed"


def test_segmentation_with_fake_provider(engine, ingested):
    provider = FakeProvider(
        lambda kw: {
            "segments": [
                {
                    "text": "Customer stated the seats are hard.",
                    "is_product_feedback": True,
                    "reason": "product",
                },
                {
                    "text": "Writer advised a dealer visit.",
                    "is_product_feedback": False,
                    "reason": "process",
                },
            ]
        }
    )
    with Session(engine) as session, start_run(session, "test.segment") as run:
        gw = LlmGateway(session, provider, run.id, Settings())
        stats = run_segmentation(session, run, "G60", gw, limit=2)
        assert stats["segmented"] == 2 and stats["segments"] == 4 and stats["product_segments"] == 2
        segs = session.scalars(select(VerbatimSegment)).all()
        assert len(segs) == 4


def test_prepare_validation_sample(engine, ingested, tmp_path, monkeypatch):
    from tracepoint.classify import validation

    monkeypatch.setattr(validation, "sample_path", lambda v: tmp_path / f"blind_{v}.yaml")
    with Session(engine) as session:
        out = prepare_sample(session, "G70", n=60, seed=1)
        assert 55 <= out["sampled"] <= 80 and (tmp_path / "blind_G70.yaml").exists()


def test_findings_extraction_is_deterministic_and_linked(engine, ingested):
    with Session(engine) as session:
        with start_run(session, "test.findings") as run:
            stats = extract_findings(session, run, "G60", "US")
        assert (
            stats["voice_of_customer"] > 10
            and stats["quantitative_metrics"] > 5
            and stats["portfolio_offering"] >= 1
        )
        assert stats["links"] > 0 and stats["created"] == stats["findings"]
        rng = session.get(Finding, "FND-G60-US-VOC-electric_range")
        assert (
            rng is not None
            and rng.kind in ("recurring_complaint", "unmet_need")
            and rng.evidence_level in ("A", "B")
        )
        refs = session.scalars(
            select(FindingEvidence.evidence_ref).where(FindingEvidence.finding_id == rng.id)
        ).all()
        example = next(r for r in refs if r.startswith("vclass:"))
        assert session.get(VerbatimClassification, example.split(":", 1)[1]) is not None
        voice = session.get(Finding, "FND-G60-US-VOC-voice_control_speech_recognition")
        if voice is not None:
            links = session.scalars(
                select(FindingLink).where(FindingLink.from_finding_id == voice.id)
            ).all()
            assert any(x.to_finding_id.endswith("voice_recognition") for x in links)
        # second extraction: nothing changes, versions stay at 1, no duplicate evidence
        with start_run(session, "test.findings.again") as run2:
            stats2 = extract_findings(session, run2, "G60", "US")
        assert (
            stats2["created"] == 0
            and stats2["updated"] == 0
            and stats2["unchanged"] == stats["findings"]
        )
        assert session.get(Finding, rng.id).version == 1
        dup = session.execute(
            select(FindingEvidence.finding_id, FindingEvidence.evidence_ref, func.count())
            .group_by(FindingEvidence.finding_id, FindingEvidence.evidence_ref)
            .having(func.count() > 1)
        ).all()
        assert dup == []
        md = render_findings(session, "G60", "US")
        assert "FND-G60-US-VOC-electric_range" in md

from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.core.runs import start_run
from tracepoint.db.models import AuditEvent, Requirement, RequirementEffort
from tracepoint.effort.cpm import (
    Change,
    Engine,
    backtest,
    draw,
    estimate,
    load_anchors,
    load_model,
    sensitivity,
)
from tracepoint.effort.store import (
    estimate_all,
    horizon_flags,
    list_efforts,
    load_profiles,
    portfolio_scan,
    scenarios,
)


@pytest.fixture(scope="module")
def cfg():
    return load_model()


def _c(subsystem: str, own: float, layer: str = "K2", **kw) -> Change:
    return Change(subsystem=subsystem, own_impact=own, layer=layer, **kw)


def test_backtest_reproduces_the_published_numbers(cfg):
    # scope 'matrix' with seed 42 is the setting of the effort-metrics pitch
    result = backtest(cfg, load_anchors(), scope="matrix")
    assert result["hits"] == result["anchors"] == 8
    base = {r["id"]: round(r["effort_raw"], 1) for r in result["rows"]}
    assert base == {
        "g30-lci-colours-wheels": 0.8,
        "g30-lci-lights-bumper": 5.7,
        "g30-lci-os7": 4.2,
        "g30-lci-545e": 9.4,
        "g68-lwb": 25.2,
        "gen6-battery-7-series": 49.0,
        "i4-lci-2025-range": 11.5,
        "ix3-lwb-china": 25.2,
        "fridge-console": 6.0,
        "front-seat-ventilation": 5.4,
    }
    battery = next(r for r in result["rows"] if r["id"] == "gen6-battery-7-series")
    assert battery["k3_rule"] and battery["score_stable_pct"] == pytest.approx(67, abs=1)
    assert (battery["p5"], battery["p95"]) == pytest.approx((39.7, 56.3), abs=0.05)
    # varying every input (certification, carryover, reference impact, own impacts too) keeps 8/8
    assert backtest(cfg, load_anchors(), scope="all", n=500)["hits"] == 8


def test_combination_counts_shared_work_once(cfg):
    eng = Engine.for_vehicle(cfg, "G60")
    a, b = _c("software_hmi", 0.1), _c("interior_console", 0.1)
    ea, eb, both = (estimate(eng, x).effort for x in ([a], [b], [a, b]))
    assert max(ea, eb) < both < ea + eb
    # the same change twice is not twice the effort
    assert estimate(eng, [a, a]).effort < 2 * ea
    # the certification add-on is applied once per package
    body = _c("body_structure", 0.4)
    one, two = estimate(eng, [body]), estimate(eng, [body, _c("powertrain", 0.4)])
    assert one.certification and two.certification
    assert two.effort < one.effort + estimate(eng, [_c("powertrain", 0.4)]).effort


def test_small_changes_propagate_less_and_k0_not_at_all(cfg):
    eng = Engine.for_vehicle(cfg, "G60")
    big, small = estimate(eng, [_c("powertrain", 0.3)]), estimate(eng, [_c("powertrain", 0.03)])
    own = 14 * 0.03
    assert small.effort - own < 0.15 * (big.effort - 14 * 0.3)
    k0 = estimate(eng, [_c("software_hmi", 0.02, "K0")])
    assert k0.effort == pytest.approx(10 * 0.02) and len(k0.subsystems) == 1


def test_rules_are_enforced(cfg):
    g60, f70 = Engine.for_vehicle(cfg, "G60"), Engine.for_vehicle(cfg, "F70")
    with pytest.raises(ValueError, match="must be K3"):
        estimate(g60, [_c("hv_battery", 1.0, "K2")])
    with pytest.raises(ValueError, match="K0 is configuration only"):
        estimate(g60, [_c("seats", 0.3, "K0")])
    with pytest.raises(ValueError, match="not present on F70"):
        estimate(f70, [_c("hv_battery", 0.3)])
    assert sum(f70.base.weights.values()) == pytest.approx(100)
    k3 = estimate(g60, [_c("hv_battery", 1.0, "K3")])
    assert k3.decision == "new generation" and k3.platform_change
    # carryover of the same change is cheaper and not a platform change
    carried = estimate(g60, [_c("hv_battery", 0.3, carryover=True)])
    assert carried.decision == "adapt" and not carried.certification
    sens = sensitivity(g60, [_c("seats", 0.3)], draw(g60, 200))
    assert sens["p5"] < estimate(g60, [_c("seats", 0.3)]).effort < sens["p95"]


def test_horizon_flags():
    assert horizon_flags("H1", "change", "new generation", 100)[0]["level"] == "conflict"
    assert horizon_flags("H1", "change", "major revision", 100)[0]["level"] == "warning"
    assert horizon_flags("H2", "change", "adapt", 100)[0]["rule"] == "48"
    assert horizon_flags("H2", "preserve", "no change", 100) == []
    assert horizon_flags("H1", "change", "adapt", 70)[0]["rule"] == "51"


def test_profiles_cover_every_requirement_file():
    import yaml

    from tracepoint.requirements.store import requirements_dir

    req_ids = {
        r["id"]
        for p in requirements_dir().glob("*.yaml")
        for r in yaml.safe_load(p.read_text())["requirements"]
    }
    profile_ids = {p.requirement for f in load_profiles() for p in f.profiles}
    assert profile_ids == req_ids


def test_estimate_run_is_versioned_and_audited(engine, ingested):
    from tracepoint.classify.gap import import_gap_file
    from tracepoint.findings.extract import extract_findings
    from tracepoint.requirements.store import import_all

    with Session(engine) as session:
        for code in ("F70", "G60", "G70"):  # the committed gap labels, as `ingest all` does
            with start_run(session, f"test.classify.import.{code}") as run:
                import_gap_file(session, run, code)
        with start_run(session, "test.findings") as run:
            for v, m in (("G60", "US"), ("F70", "EU"), ("G70", "US")):
                extract_findings(session, run, v, m)
        with start_run(session, "test.req") as run:
            import_all(session, run)
        with start_run(session, "test.effort") as run:
            first = estimate_all(session, run, runs=200)
        with start_run(session, "test.effort") as run:
            second = estimate_all(session, run, runs=200)
        assert first["created"] + first["updated"] == 57 and second["unchanged"] == 57
        assert not set(first["missing_profiles"]) & {"REQ-G60-US-IC-01", "REQ-F70-EU-ID-01"}

        battery = session.get(RequirementEffort, "REQ-G60-US-PR-03")
        assert (battery.decision, battery.layer) == ("new generation", "K3")
        assert session.get(RequirementEffort, "REQ-G70-US-QN-01").kind == "no_vehicle_change"
        events = session.scalars(
            select(AuditEvent.action).where(
                AuditEvent.entity_id == "REQ-G60-US-PR-03", AuditEvent.action.like("effort.%")
            )
        ).all()
        assert events and events[0] in ("effort.estimated", "effort.updated")

        rows = list_efforts(session, "G60", "US")
        assert len(rows) == 20 and not any(r["stale"] for r in rows)
        h1, h2, both = scenarios(session, "G60", "US", runs=200)
        assert h1["effort_pct"] < h1["sum_of_single_pct"]
        assert h2["decision"] == "new generation" and both["effort_pct"] > h1["effort_pct"]

        lumbar = portfolio_scan(session, "F70", ["Lordosenstütze", "Lumbar support"])
        assert lumbar["level"] == 2 and "G60" in lumbar["vehicles"]
        acc = portfolio_scan(session, "G60", ["Driving Assistant Plus"])
        assert acc["level"] == 1 and acc["own_variants"]["total"] == 10
        session.rollback()


def test_analysis_takes_the_effort_of_an_existing_requirement_from_its_profile(engine, ingested):
    """Runs after the estimate test above, which fills requirement_effort."""
    from tracepoint.agent.analysis import Recommendation, SituationAnalysis, effort_of_proposals

    def rec(title, horizon):
        return Recommendation(
            title=title,
            proposal="p",
            horizon=horizon,
            rationale="r",
            evidence_refs=["REQ-G60-US-IC-01"],
            related_requirement="REQ-G60-US-IC-01",
            changes_vehicle=True,
            effort_changes=None,
        )

    analysis = SituationAnalysis(
        headline="h",
        summary="s",
        data_coverage="d",
        insights=[],
        recommendations=[rec("seats", "H1"), rec("seats again", "H1"), rec("seats later", "H2")],
        assumptions_and_gaps=[],
    )
    with Session(engine) as session:
        stored_pct = session.get(RequirementEffort, "REQ-G60-US-IC-01").effort_pct
        effort, faults = effort_of_proposals(session, "G60", "US", analysis)
        # the id comes from the model: a requirement of another scope lends no profile
        foreign, foreign_faults = effort_of_proposals(session, "G70", "US", analysis)
        # a requirement the product manager rejected is not quietly proposed again
        session.get(Requirement, "REQ-G60-US-IC-01").status = "rejected"
        session.flush()
        _, after_rejection = effort_of_proposals(session, "G60", "US", analysis)
        session.rollback()
    first, _, later = effort["recommendations"]
    assert first["effort_pct"] == stored_pct and "REQ-G60-US-IC-01" in first["source"]
    assert faults == []
    # the same requirement proposed twice is one change in the package
    h1 = next(p for p in effort["packages"] if p["horizon"] == "H1")
    assert h1["proposals"] == 2 and h1["effort_pct"] == stored_pct
    # judged against the proposal's horizon, not the requirement's
    assert [f["rule"] for f in later["flags"]] == ["48"]
    assert all(r["status"] == "missing" for r in foreign["recommendations"])
    assert "belongs to G60 US, not G70 US" in foreign_faults[0]
    assert foreign["packages"][0]["not_counted"] == ["seats", "seats again"]
    assert any("rejected by the product manager at gate G2" in f for f in after_rejection)


def test_package_of_requirements_and_free_changes(engine, ingested):
    """Runs after the estimate test above, which fills requirement_effort."""
    from tracepoint.effort.store import estimate_package

    seats, hmi = "REQ-G60-US-IC-01", "REQ-G60-US-ID-01"
    extra = Change(subsystem="software_hmi", own_impact=0.1, layer="K1")
    with Session(engine) as session:
        pkg = estimate_package(session, "G60", "US", [seats, hmi, seats], [extra])
        with pytest.raises(ValueError, match="no effort estimate for REQ-G60-US-IC-01"):
            estimate_package(session, "G70", "US", [seats])
    assert [i["requirement"] for i in pkg["items"]] == [seats, hmi, None]  # named twice: once
    assert pkg["combined"]["effort_pct"] < pkg["sum_of_single_pct"]
    assert pkg["combined"]["decision"] == "adapt" and pkg["combined"]["subsystems"]


def test_reference_changes_are_the_scale_for_a_new_change():
    from tracepoint.agent.analysis import _size_check
    from tracepoint.effort.store import reference_changes

    refs = reference_changes()
    seats = refs["seats"]
    assert [r["own_impact"] for r in seats] == sorted(r["own_impact"] for r in seats)
    assert refs["software_hmi"][-1]["source"] == "BMW decision"  # the OS 7 release at 0.4
    low, high = seats[0]["own_impact"], seats[-1]["own_impact"]
    inside, no_problem = _size_check(Change(subsystem="seats", own_impact=high, layer="K1"))
    assert no_problem is None and inside["nearest_below"]["own_impact"] == high
    assert "above every reference" in _size_check(_c("seats", high + 0.2))[1]
    assert "below every reference" in _size_check(_c("seats", low / 5))[1]
    # one reference is no scale: not held against the change, but said in the report
    info, problem = _size_check(_c("paint_color", 0.9))
    assert problem is None and info["references"] == 1

"""Requirement store (Phase 4): import authored requirement files, record PM decisions (gate G2).

Requirements are written as files, ``config/requirements/<vehicle>_<market>.yaml``, by the
requirement agent (offline by the assistant until the LLM API is available, D-060). The import
validates them against the findings, derives the evidence level, upserts with versioning and an
audit event per change. PM decisions are appended to ``config/decisions/requirements.jsonl`` and
replayed after every import, so a rebuilt database keeps them (D-057).
"""

from __future__ import annotations

import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.core.settings import get_settings
from tracepoint.db.models import Finding, Requirement, RequirementFinding, Run

Market = Literal["EU", "US", "CN", "RoW"]
DECISIONS = {"approve": "approved", "reject": "rejected", "defer": "deferred"}
_LEVELS = "ABCD"


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Criterion(_Strict):
    market: Market | Literal["ALL"]
    metric: str
    target: str
    method: str
    basis: Literal["evidence", "assumption"]


class FindingRef(_Strict):
    id: str
    role: Literal["primary", "supporting", "context"] = "primary"


class RequirementSpec(_Strict):
    id: str
    domain: str
    title: str = Field(max_length=200)
    statement: str
    recommend: bool
    recommend_rationale: str
    horizon: Literal["H1", "H2"]
    horizon_rationale: str
    markets: list[Market] = Field(min_length=1)
    findings: list[FindingRef] = Field(min_length=1)
    criteria: list[Criterion] = Field(min_length=1)
    assumptions: list[str] = []
    uncertainties: list[str] = []


class Exclusion(_Strict):
    finding: str
    reason: str


class RequirementFile(_Strict):
    vehicle: str
    market: Market
    author: str
    requirements: list[RequirementSpec]
    excluded: list[Exclusion] = []


def requirements_dir() -> Path:
    return get_settings().config_dir / "requirements"


def decisions_file() -> Path:
    return get_settings().config_dir / "decisions" / "requirements.jsonl"


def _domains() -> set[str]:
    data = yaml.safe_load((get_settings().config_dir / "taxonomy" / "domains.yaml").read_text())
    return set(data["domains"])


def _content(r: Requirement | RequirementSpec, findings: list[dict[str, str]]) -> dict[str, Any]:
    domain = r.domain_key if isinstance(r, Requirement) else r.domain
    keys = (
        "title",
        "statement",
        "recommend",
        "recommend_rationale",
        "horizon",
        "horizon_rationale",
        "markets",
        "assumptions",
        "uncertainties",
    )
    out = {k: getattr(r, k) for k in keys}
    out["domain"] = domain
    out["criteria"] = (
        r.criteria if isinstance(r, Requirement) else [c.model_dump() for c in r.criteria]
    )
    out["findings"] = findings
    return out


def import_requirement_file(session: Session, run: Run, path: Path) -> dict[str, Any]:
    spec = RequirementFile.model_validate(yaml.safe_load(path.read_text(encoding="utf-8")))
    prefix = f"REQ-{spec.vehicle}-{spec.market}-"
    domains = _domains()
    errors = []
    ids = [r.id for r in spec.requirements]
    errors += [f"duplicate id {i}" for i, n in Counter(ids).items() if n > 1]
    referenced = {f.id for r in spec.requirements for f in r.findings} | {
        e.finding for e in spec.excluded
    }
    found = {f.id: f for f in session.scalars(select(Finding).where(Finding.id.in_(referenced)))}
    for r in spec.requirements:
        if not r.id.startswith(prefix):
            errors.append(f"{r.id}: id must start with {prefix}")
        if r.domain not in domains:
            errors.append(f"{r.id}: unknown domain {r.domain}")
        for f in r.findings:
            if f.id not in found:
                errors.append(f"{r.id}: unknown finding {f.id}")
            elif found[f.id].status == "withdrawn":
                errors.append(f"{r.id}: finding {f.id} is withdrawn")
    errors += [
        f"excluded: unknown finding {e.finding}" for e in spec.excluded if e.finding not in found
    ]
    if errors:
        raise ValueError(f"{path.name}: " + "; ".join(errors))

    stats: Counter = Counter()
    for r in spec.requirements:
        links = [{"id": f.id, "role": f.role} for f in r.findings]
        levels = [found[f.id].evidence_level or "D" for f in r.findings if f.role != "context"]
        level = min(levels or ["D"], key=_LEVELS.index)
        payload = _content(r, links)
        existing = session.get(Requirement, r.id)
        if existing is None:
            req = Requirement(
                id=r.id,
                vehicle_code=spec.vehicle,
                market_code=spec.market,
                domain_key=r.domain,
                evidence_level=level,
                status="proposed",
                version=1,
                created_by=spec.author,
                created_run_id=run.id,
                updated_run_id=run.id,
                **{k: v for k, v in payload.items() if k not in ("domain", "findings")},
            )
            session.add(req)
            record_event(
                session,
                actor_type="agent",
                actor_id=spec.author,
                action="requirement.created",
                entity_type="requirement",
                entity_id=r.id,
                run_id=run.id,
                after={**payload, "evidence_level": level},
                rationale=r.recommend_rationale,
            )
            stats["created"] += 1
        else:
            req = existing
            before = _content(req, [{"id": x.finding_id, "role": x.role} for x in req.findings])
            if before == payload and req.evidence_level == level and req.status != "withdrawn":
                stats["unchanged"] += 1
                continue
            for k, v in payload.items():
                if k not in ("domain", "findings"):
                    setattr(req, k, v)
            req.domain_key, req.evidence_level = r.domain, level
            prev_status, req.status = (
                req.status,
                "proposed",
            )  # a changed text needs a new G2 decision
            req.version += 1
            req.updated_run_id = run.id
            session.execute(
                delete(RequirementFinding).where(RequirementFinding.requirement_id == req.id)
            )
            session.expire(req, ["findings"])
            record_event(
                session,
                actor_type="agent",
                actor_id=spec.author,
                action="requirement.updated",
                entity_type="requirement",
                entity_id=r.id,
                run_id=run.id,
                before={**before, "status": prev_status},
                after={**payload, "evidence_level": level, "version": req.version},
                rationale="Requirement file changed; status reset to proposed for G2",
            )
            stats["updated"] += 1
        session.flush()
        req.findings.extend(RequirementFinding(finding_id=f["id"], role=f["role"]) for f in links)
    stale = session.scalars(
        select(Requirement).where(
            Requirement.vehicle_code == spec.vehicle,
            Requirement.market_code == spec.market,
            Requirement.status != "withdrawn",
            Requirement.id.notin_(ids),
        )
    ).all()
    for req in stale:
        record_event(
            session,
            actor_type="agent",
            actor_id=spec.author,
            action="requirement.withdrawn",
            entity_type="requirement",
            entity_id=req.id,
            run_id=run.id,
            before={"status": req.status},
            after={"status": "withdrawn"},
            rationale="No longer in the requirement file",
        )
        req.status, req.version = "withdrawn", req.version + 1
        stats["withdrawn"] += 1
    if spec.excluded:
        record_event(
            session,
            actor_type="agent",
            actor_id=spec.author,
            action="requirements.candidates_excluded",
            entity_type="scope",
            entity_id=f"{spec.vehicle}:{spec.market}",
            run_id=run.id,
            after={"excluded": [e.model_dump() for e in spec.excluded]},
            rationale="Scope filter: findings that do not become a requirement",
        )
    session.flush()
    stats["requirements"] = len(spec.requirements)
    stats["excluded"] = len(spec.excluded)
    return dict(stats)


def _apply(
    session: Session,
    req: Requirement,
    decision: str,
    actor: str,
    note: str,
    run_id: str | None,
    replayed: bool,
) -> None:
    before = {"status": req.status, "version": req.version}
    req.status = DECISIONS[decision]
    record_event(
        session,
        actor_type="human" if actor.startswith("human:") else "agent",
        actor_id=actor,
        action="requirement.decided",
        entity_type="requirement",
        entity_id=req.id,
        run_id=run_id,
        before=before,
        after={"status": req.status, "version": req.version, "replayed": replayed},
        rationale=note,
    )


def decide(
    session: Session,
    requirement_id: str,
    decision: str,
    *,
    actor: str,
    note: str,
    run_id: str | None = None,
    path: Path | None = None,
) -> Requirement:
    """Gate G2: approve / reject / defer one version of a requirement and persist the decision."""
    if decision not in DECISIONS:
        raise ValueError(f"decision must be one of {sorted(DECISIONS)}")
    if not note.strip():
        raise ValueError("a decision needs a rationale")
    req = session.get(Requirement, requirement_id)
    if req is None or req.status == "withdrawn":
        raise ValueError(f"unknown or withdrawn requirement {requirement_id}")
    _apply(session, req, decision, actor, note, run_id, replayed=False)
    path = path or decisions_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    line = {
        "id": req.id,
        "version": req.version,
        "decision": decision,
        "actor": actor,
        "note": note,
        "ts": datetime.now(UTC).isoformat(timespec="seconds"),
    }
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(line, ensure_ascii=False) + "\n")
    session.flush()
    return req


def replay_decisions(session: Session, run: Run, path: Path | None = None) -> dict[str, int]:
    """Re-apply the committed decisions; a decision only holds for the version it was made on."""
    path = path or decisions_file()
    stats: Counter = Counter()
    if not path.exists():
        return {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        if not raw.strip():
            continue
        d = json.loads(raw)
        req = session.get(Requirement, d["id"])
        if req is None or req.version != d["version"]:
            stats["stale"] += 1  # the requirement changed since; it needs a new decision
        elif req.status != DECISIONS[d["decision"]]:
            _apply(session, req, d["decision"], d["actor"], d["note"], run.id, replayed=True)
            stats["applied"] += 1
        else:
            stats["unchanged"] += 1
    session.flush()
    return dict(stats)


def import_all(session: Session, run: Run) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for path in sorted(requirements_dir().glob("*.yaml")):
        out[path.stem] = import_requirement_file(session, run, path)
    out["decisions"] = replay_decisions(session, run)
    return out

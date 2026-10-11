"""Effort estimates of the requirements (rules 41-52): profiles, portfolio scan, horizon checks.

Change profiles are authored per requirement in ``config/effort/requirements/<vehicle>_<market>.yaml``
(offline by the assistant until the agent runs, same pattern as D-060) and kept apart from the
requirement files, so that correcting an effort input never creates a new requirement version
or invalidates a G2 decision. The estimate run validates the profiles against the requirements
and the CPM rules, scans the option-list catalogues for each change (rule 43), estimates the
effort with its P5-P95 range (rule 51) and the affected subsystems (rule 52), checks the result
against the requirement's horizon and stores it in ``requirement_effort`` with an audit event
per change.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import Field, model_validator
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.db.models import (
    EquipmentAvailability,
    EquipmentItem,
    Requirement,
    RequirementEffort,
    Run,
    VehicleVariant,
)
from tracepoint.effort.cpm import (
    Change,
    Engine,
    JitterScope,
    ModelConfig,
    Samples,
    _Strict,
    config_dir,
    draw,
    estimate,
    load_model,
    model_hash,
    sensitivity,
)

Kind = Literal["change", "preserve", "no_vehicle_change"]
_STATUS_RANK = {"standard": 0, "optional": 1, "no_cost_option": 1, "not_available": 2}


class Profile(_Strict):
    requirement: str
    kind: Kind = "change"
    changes: list[Change] = []
    note: str | None = None

    @model_validator(mode="after")
    def _check(self) -> Profile:
        if self.kind == "change" and not self.changes:
            raise ValueError(f"{self.requirement}: kind 'change' needs at least one change")
        if self.kind != "change" and (self.changes or not self.note):
            raise ValueError(f"{self.requirement}: kind '{self.kind}' takes a note and no changes")
        return self


class ProfileFile(_Strict):
    vehicle: str
    market: str
    author: str
    profiles: list[Profile] = Field(min_length=1)


def profiles_dir() -> Path:
    return config_dir() / "requirements"


def load_profiles(directory: Path | None = None) -> list[ProfileFile]:
    return [
        ProfileFile.model_validate(yaml.safe_load(p.read_text(encoding="utf-8")))
        for p in sorted((directory or profiles_dir()).glob("*.yaml"))
    ]


# ---- portfolio scan (rule 43, v0.2 rule 22) -----------------------------------------------------


def portfolio_scan(session: Session, vehicle: str, terms: list[str]) -> dict[str, Any] | None:
    """Best catalogue status per vehicle for items whose name matches one of the terms, and the
    portfolio level: 0 standard on this vehicle, 1 optional on this vehicle, 2 offered on another
    BMW series (carry over), 3 not in any catalogue (new for BMW)."""
    if not terms:
        return None
    match = or_(
        *[
            EquipmentItem.name_de.ilike(f"%{t}%") | EquipmentItem.name_en.ilike(f"%{t}%")
            for t in terms
        ]
    )
    rows = session.execute(
        select(
            EquipmentItem.vehicle_code,
            EquipmentItem.name_en,
            EquipmentAvailability.status,
            EquipmentAvailability.variant_id,
        )
        .join(EquipmentAvailability, EquipmentAvailability.equipment_item_id == EquipmentItem.id)
        .where(match)
    ).all()
    best: dict[str, tuple[int, str, str]] = {}
    per_variant: dict[str, int] = {}  # best rank per variant of this vehicle
    for v, name, status, variant in rows:
        rank = _STATUS_RANK.get(status, 2)
        if v not in best or rank < best[v][0]:
            best[v] = (rank, status, name)
        if v == vehicle:
            per_variant[variant] = min(rank, per_variant.get(variant, 2))
    own = best.get(vehicle)
    others = {v: b for v, b in best.items() if v != vehicle and b[0] < 2}
    if own and own[0] == 0:
        level = 0
    elif own and own[0] == 1:
        level = 1
    elif others:
        level = 2
    else:
        level = 3
    n_variants = session.scalar(
        select(func.count())
        .select_from(VehicleVariant)
        .where(VehicleVariant.vehicle_code == vehicle)
    )
    return {
        "terms": terms,
        "level": level,
        "vehicles": {v: {"status": b[1], "item": b[2]} for v, b in sorted(best.items())},
        "own_variants": {
            "standard": sum(r == 0 for r in per_variant.values()),
            "optional": sum(r == 1 for r in per_variant.values()),
            "total": n_variants or 0,
        },
    }


def _portfolio_flags(c: Change, scan: dict[str, Any] | None, vehicle: str) -> list[dict[str, str]]:
    if scan is None:
        return []
    found = ", ".join(f"{v} {x['status']}" for v, x in scan["vehicles"].items()) or "nothing"
    own = scan["own_variants"]
    spread = (
        f"standard on {own['standard']}, optional on {own['optional']} of {own['total']} "
        f"{vehicle} variants"
    )
    if scan["level"] == 2 and not c.carryover:
        return [
            _flag(
                "warning",
                "43",
                f"{c.subsystem}: catalogue shows {found}; the change could carry over "
                "(carryover: true) instead of a new development",
            )
        ]
    if scan["level"] == 3 and c.carryover:
        return [
            _flag(
                "warning",
                "43",
                f"{c.subsystem}: carryover is claimed but no catalogue item matches "
                f"{scan['terms']}; cite the source of the carryover",
            )
        ]
    if scan["level"] in (0, 1) and c.layer != "K0":
        status = "standard" if scan["level"] == 0 else "optional"
        return [
            _flag(
                "info",
                "43",
                f"{c.subsystem}: already {status} on {vehicle} ({spread}); check whether only "
                "configuration (K0) is needed",
            )
        ]
    return []


def _flag(level: str, rule: str, text: str) -> dict[str, str]:
    return {"level": level, "rule": rule, "text": text}


def horizon_flags(horizon: str, kind: str, decision: str, stable: float) -> list[dict[str, str]]:
    """Rules 47 / 48 / 51: does the estimated class fit the requirement's horizon?"""
    out = []
    if kind != "change":
        return out
    if horizon == "H1" and decision == "new generation":
        out.append(
            _flag(
                "conflict",
                "47",
                "H1 but the estimate needs a new generation; move to H2 (successor) or split",
            )
        )
    elif horizon == "H1" and decision == "major revision":
        out.append(
            _flag("warning", "47", "H1 but the estimate is beyond a normal LCI (major revision)")
        )
    elif horizon == "H2" and decision == "adapt":
        out.append(
            _flag(
                "info",
                "48",
                "H2 but the estimate fits a life-cycle impulse; could be pulled forward to H1",
            )
        )
    if stable < 90:
        out.append(
            _flag(
                "warning",
                "51",
                f"borderline: only {stable:.0f} % of the sensitivity runs keep the decision; "
                "show the PM both options",
            )
        )
    return out


# ---- estimate run -------------------------------------------------------------------------------


def _content(e: RequirementEffort) -> dict[str, Any]:
    keys = (
        "requirement_version",
        "kind",
        "effort_pct",
        "p5",
        "p95",
        "decision",
        "decision_stable_pct",
        "layer",
        "size",
        "certification",
        "changes",
        "subsystems",
        "portfolio",
        "flags",
        "note",
        "model_hash",
    )
    return {k: getattr(e, k) for k in keys}


class _Engines:
    """One engine and one shared set of sensitivity samples per vehicle (common random numbers,
    so differences between requirements are not sampling noise)."""

    def __init__(self, cfg: ModelConfig, runs: int, scope: JitterScope, seed: int) -> None:
        self.cfg, self.runs, self.scope, self.seed = cfg, runs, scope, seed
        self._cache: dict[str, tuple[Engine, Samples]] = {}

    def get(self, vehicle: str) -> tuple[Engine, Samples]:
        if vehicle not in self._cache:
            eng = Engine.for_vehicle(self.cfg, vehicle)
            self._cache[vehicle] = (eng, draw(eng, self.runs, 0.5, self.scope, self.seed))
        return self._cache[vehicle]


def evaluate(
    engine: Engine, samples: Samples, changes: list[Change], kind: str = "change"
) -> dict[str, Any]:
    est = estimate(engine, changes)
    sens = sensitivity(engine, changes, samples)
    return {**est.as_dict(), **sens, "kind": kind}


def engine_and_samples(
    vehicle: str, *, runs: int = 2000, scope: JitterScope = "all", seed: int = 42
) -> tuple[Engine, Samples]:
    """Engine of one vehicle with the sensitivity samples of the configured model."""
    return _Engines(load_model(), runs, scope, seed).get(vehicle)


def evaluate_changes(
    session: Session,
    engine: Engine,
    samples: Samples,
    vehicle: str,
    changes: list[Change],
    horizon: str,
    kind: str = "change",
) -> dict[str, Any]:
    """Estimate with sensitivity, plus the catalogue scan of every change (rule 43) and the
    flags against the horizon. Raises ValueError on a change that breaks a rule."""
    res = evaluate(engine, samples, changes, kind)
    scans = []
    flags: list[dict[str, str]] = []
    for c in changes:
        scan = portfolio_scan(session, vehicle, c.portfolio_terms)
        if scan:
            scans.append({"subsystem": c.subsystem, **scan})
        flags += _portfolio_flags(c, scan, vehicle)
    flags += horizon_flags(horizon, kind, res["decision"], res["decision_stable_pct"])
    return {**res, "portfolio": scans, "flags": flags}


def estimate_all(
    session: Session,
    run: Run,
    *,
    directory: Path | None = None,
    runs: int = 2000,
    scope: JitterScope = "all",
    seed: int = 42,
) -> dict[str, Any]:
    cfg = load_model()
    mhash = model_hash(cfg)
    engines = _Engines(cfg, runs, scope, seed)
    files = load_profiles(directory)
    stats: dict[str, Any] = {"created": 0, "updated": 0, "unchanged": 0, "model_hash": mhash}

    errors: list[str] = []
    seen: set[str] = set()
    plan: list[tuple[ProfileFile, Profile, Requirement]] = []
    for f in files:
        engine, _ = engines.get(f.vehicle)
        for p in f.profiles:
            if p.requirement in seen:
                errors.append(f"duplicate profile {p.requirement}")
            seen.add(p.requirement)
            req = session.get(Requirement, p.requirement)
            if req is None or req.status == "withdrawn":
                errors.append(f"{p.requirement}: unknown or withdrawn requirement")
                continue
            if (req.vehicle_code, req.market_code) != (f.vehicle, f.market):
                errors.append(f"{p.requirement}: belongs to {req.vehicle_code} {req.market_code}")
            errors += [f"{p.requirement}: {e}" for c in p.changes for e in engine.check_change(c)]
            plan.append((f, p, req))
    if errors:
        raise ValueError("effort profiles: " + "; ".join(errors))

    active = session.scalars(select(Requirement).where(Requirement.status != "withdrawn")).all()
    stats["missing_profiles"] = sorted(r.id for r in active if r.id not in seen)

    for f, p, req in plan:
        engine, samples = engines.get(f.vehicle)
        res = evaluate_changes(session, engine, samples, f.vehicle, p.changes, req.horizon, p.kind)
        scans, flags = res["portfolio"], res["flags"]
        values = {
            "requirement_version": req.version,
            "kind": p.kind,
            "effort_pct": res["effort_pct"],
            "p5": res["p5"],
            "p95": res["p95"],
            "decision": res["decision"],
            "decision_stable_pct": res["decision_stable_pct"],
            "layer": res["layer"],
            "size": res["size"],
            "certification": res["certification_add_on"],
            "changes": [c.model_dump() for c in p.changes],
            "subsystems": res["subsystems"],
            "portfolio": scans,
            "flags": flags,
            "note": p.note,
            "model_hash": mhash,
        }
        row = session.get(RequirementEffort, req.id)
        if row is None:
            row = RequirementEffort(requirement_id=req.id, created_run_id=run.id, **values)
            session.add(row)
            action, before = "effort.estimated", None
            stats["created"] += 1
        else:
            before = _content(row)
            for k, v in values.items():
                setattr(row, k, v)
            if _content(row) == before:
                stats["unchanged"] += 1
                continue
            action = "effort.updated"
            stats["updated"] += 1
        row.updated_run_id = run.id
        session.flush()
        record_event(
            session,
            actor_type="system",
            actor_id="effort-engine",
            action=action,
            entity_type="requirement",
            entity_id=req.id,
            run_id=run.id,
            before=before,
            after=_content(row),
            rationale=f"CPM effort model {mhash}, profile by {f.author}",
        )
    stats["flags"] = {
        level: sum(
            1
            for row in session.scalars(select(RequirementEffort))
            for fl in row.flags
            if fl["level"] == level
        )
        for level in ("conflict", "warning", "info")
    }
    return stats


# ---- read side ----------------------------------------------------------------------------------


def list_efforts(
    session: Session, vehicle: str | None = None, market: str | None = None
) -> list[dict[str, Any]]:
    stmt = select(Requirement, RequirementEffort).join(
        RequirementEffort, RequirementEffort.requirement_id == Requirement.id
    )
    if vehicle:
        stmt = stmt.where(Requirement.vehicle_code == vehicle)
    if market:
        stmt = stmt.where(Requirement.market_code == market)
    stmt = stmt.where(Requirement.status != "withdrawn")
    out = []
    for r, e in session.execute(stmt.order_by(Requirement.id)):
        out.append(
            {
                "id": r.id,
                "vehicle": r.vehicle_code,
                "market": r.market_code,
                "title": r.title,
                "horizon": r.horizon,
                "recommend": r.recommend,
                "status": r.status,
                **_content(e),
                "stale": e.requirement_version != r.version,
            }
        )
    return out


def estimate_package(
    session: Session,
    vehicle: str,
    market: str | None = None,
    requirement_ids: list[str] | None = None,
    changes: list[Change] | None = None,
) -> dict[str, Any]:
    """Effort of a hand-picked package: stored requirement profiles and free changes, each on its
    own and all combined per subsystem (rule 45; a requirement named twice counts once). Nothing
    is stored. Raises ValueError for a requirement outside the vehicle and market, or without an
    estimate, and for a change that breaks a rule of the model."""
    engine, samples = engine_and_samples(vehicle)
    stored = {r["id"]: r for r in list_efforts(session, vehicle, market)}
    ids = list(dict.fromkeys(requirement_ids or []))
    unknown = [i for i in ids if i not in stored]
    if unknown:
        scope = f"{vehicle} {market}" if market else vehicle
        raise ValueError(
            f"no effort estimate for {', '.join(unknown)} among the requirements of {scope}"
        )
    keys = ("effort_pct", "p5", "p95", "decision", "decision_stable_pct", "layer", "size")
    items: list[dict[str, Any]] = [
        {
            "requirement": i,
            "title": stored[i]["title"],
            "horizon": stored[i]["horizon"],
            **{k: stored[i][k] for k in keys},
            "certification_add_on": stored[i]["certification"],
            "subsystems": stored[i]["subsystems"],
            "changes": stored[i]["changes"],
        }
        for i in ids
    ]
    combined = [Change.model_validate(c) for i in ids for c in stored[i]["changes"]]
    for change in changes or []:
        res = evaluate(engine, samples, [change])
        items.append(
            {
                "requirement": None,
                **{k: res[k] for k in keys},
                "certification_add_on": res["certification_add_on"],
                "subsystems": res["subsystems"],
                "changes": [change.model_dump()],
            }
        )
        combined.append(change)
    cfg = load_model()
    return {
        "vehicle": vehicle,
        "market": market,
        "items": items,
        "sum_of_single_pct": round(sum(i["effort_pct"] for i in items), 2),
        "combined": evaluate(engine, samples, combined),
        "model_hash": model_hash(cfg),
        "basis": cfg.status,
    }


SCENARIOS = (
    ("H1", "Evolve the current model (H1 requirements in one life-cycle impulse)", {"H1"}),
    ("H2", "Successor generation (H2 requirements)", {"H2"}),
    ("ALL", "Everything on the current model (H1 + H2 in one impulse)", {"H1", "H2"}),
)


def scenarios(
    session: Session,
    vehicle: str,
    market: str | None = None,
    *,
    runs: int = 2000,
    scope: JitterScope = "all",
    seed: int = 42,
) -> list[dict[str, Any]]:
    """Variations (master plan, Phase 5): combine the changes of all recommended, not rejected
    requirements per horizon with rule 45, so shared work is counted once."""
    rows = [
        r
        for r in list_efforts(session, vehicle, market)
        if r["recommend"] and r["status"] != "rejected"
    ]
    engine, samples = _Engines(load_model(), runs, scope, seed).get(vehicle)
    out = []
    for key, label, horizons in SCENARIOS:
        sel = [r for r in rows if r["horizon"] in horizons]
        changes = [Change.model_validate(c) for r in sel for c in r["changes"]]
        res = evaluate(engine, samples, changes)
        out.append(
            {
                "scenario": key,
                "label": label,
                "requirements": len(sel),
                "with_changes": sum(1 for r in sel if r["changes"]),
                "sum_of_single_pct": round(sum(r["effort_pct"] for r in sel), 2),
                **res,
                "subsystems": res["subsystems"][:6],
            }
        )
    return out

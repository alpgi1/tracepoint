"""Change Prediction Method (CPM) effort engine (Clarkson, Simons, Eckert 2004), pure Python.

The formula is fixed in code; every input (subsystem weights W, link likelihoods L and impacts I,
the certification add-on, the carryover factor, the thresholds) lives in
``config/effort/model.yaml`` and is an assumption until BMW engineering calibrates it (rule 50).

For one change of subsystem ``s`` with its own impact ``i_s``::

    scale          = min(1, i_s / propagation_reference_impact)
    path risk      = scale * product of the likelihoods along the path * impact of the last link
    risk(s -> j)   = 1 - prod over simple paths of at most ``max_path_length`` (1 - path risk)
    effort %       = W_s * i_s + sum_j risk(s -> j) * W_j      (+ certification add-on)

Several changes of one requirement or scenario are combined per subsystem with
``1 - prod(1 - risk)`` so that shared work (the same software release, the same E/E change) is
counted once (rule 45); the certification add-on is applied once per package. The output is a
share of a new vehicle generation (new vehicle = 100), never money (rule 49).

``scale`` is an addition to the published CPM: its likelihoods describe a change of the usual
size of a module change, so a calibration of 3 % of a subsystem would otherwise propagate as far
as a redesign of 40 %. Changes at or above the reference impact propagate unscaled, so the
back-test anchors (all >= 0.3) are not affected.
"""

from __future__ import annotations

import hashlib
import json
import random
from dataclasses import dataclass, field, replace
from functools import cache
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator

Layer = Literal["K0", "K1", "K2", "K3"]
Decision = Literal["no change", "adapt", "major revision", "new generation"]
LAYERS = ("K0", "K1", "K2", "K3")


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ---- configuration ------------------------------------------------------------------------------


class Subsystem(_Strict):
    key: str
    name: str
    weight: float = Field(ge=0)
    basis: str


class Link(_Strict):
    source: str = Field(alias="from")
    target: str = Field(alias="to")
    likelihood: float = Field(ge=0, le=1)
    impact: float = Field(ge=0, le=1)
    why: str


class Certification(_Strict):
    add_on: float = Field(ge=0)
    trigger_subsystems: list[str]
    min_own_impact: float = Field(ge=0, le=1)


class PlatformRule(_Strict):
    subsystems: list[str]
    min_own_impact: float = Field(ge=0, le=1)


class Thresholds(_Strict):
    major_revision: float
    new_generation: float


class VehicleProfile(_Strict):
    platform: str
    absent: list[str] = []
    note: str | None = None


class ModelConfig(_Strict):
    version: int
    status: str
    subsystems: list[Subsystem]
    links: list[Link]
    certification: Certification
    carryover_factor: float = Field(ge=0, le=1)
    propagation_reference_impact: float = Field(gt=0, le=1)
    platform_rule: PlatformRule
    thresholds: Thresholds
    k0_max_own_impact: float = Field(ge=0, le=1)
    max_path_length: int = Field(ge=1, le=5)
    sizes: dict[str, float]
    vehicles: dict[str, VehicleProfile]

    @model_validator(mode="after")
    def _check(self) -> ModelConfig:
        keys = [s.key for s in self.subsystems]
        known = set(keys)
        errors = [f"duplicate subsystem {k}" for k in known if keys.count(k) > 1]
        pairs = [(lk.source, lk.target) for lk in self.links]
        errors += [f"duplicate link {p}" for p in set(pairs) if pairs.count(p) > 1]
        errors += [f"link to itself {p}" for p in pairs if p[0] == p[1]]
        referenced = {k for p in pairs for k in p}
        referenced |= set(self.certification.trigger_subsystems) | set(
            self.platform_rule.subsystems
        )
        referenced |= {k for v in self.vehicles.values() for k in v.absent}
        errors += [f"unknown subsystem {k}" for k in sorted(referenced - known)]
        if abs(sum(s.weight for s in self.subsystems) - 100) > 1e-6:
            errors.append("subsystem weights must sum to 100")
        if self.thresholds.major_revision >= self.thresholds.new_generation:
            errors.append("thresholds: major_revision must be below new_generation")
        if errors:
            raise ValueError("; ".join(errors))
        return self


class Change(_Strict):
    """One engineering change: the subsystem it starts in and how much of it is redone."""

    subsystem: str
    own_impact: float = Field(ge=0, le=1, description="Share of the subsystem's design redone")
    layer: Layer = Field(description="K0 configuration, K1 add-on, K2 module, K3 platform")
    carryover: bool = Field(
        False, description="Exists elsewhere in the portfolio or the platform is prepared for it"
    )
    why: str = ""
    portfolio_terms: list[str] = Field(
        [], description="Catalogue search terms for the portfolio scan (rule 43)"
    )


def config_dir() -> Path:
    from tracepoint.core.settings import get_settings

    return get_settings().config_dir / "effort"


def load_model(path: Path | None = None) -> ModelConfig:
    path = path or config_dir() / "model.yaml"
    return ModelConfig.model_validate(yaml.safe_load(path.read_text(encoding="utf-8")))


def model_hash(cfg: ModelConfig) -> str:
    raw = json.dumps(cfg.model_dump(by_alias=True), sort_keys=True).encode()
    return hashlib.sha256(raw).hexdigest()[:12]


# ---- numeric model ------------------------------------------------------------------------------


@dataclass(frozen=True)
class Params:
    """The numbers the formula uses; ``jitter`` returns a perturbed copy."""

    weights: dict[str, float]
    links: dict[tuple[str, str], tuple[float, float]]
    cert_add: float
    carryover_factor: float
    ref_impact: float
    own_scale: float = 1.0  # sensitivity on the authored own impacts


@dataclass(frozen=True)
class Engine:
    cfg: ModelConfig
    vehicle: str | None
    base: Params
    names: dict[str, str] = field(default_factory=dict)

    @classmethod
    def for_vehicle(cls, cfg: ModelConfig, vehicle: str | None = None) -> Engine:
        """Weights renormalised to 100 without the subsystems the vehicle does not have."""
        absent = set(cfg.vehicles[vehicle].absent) if vehicle in cfg.vehicles else set()
        w = {s.key: s.weight for s in cfg.subsystems if s.key not in absent}
        z = sum(w.values())
        weights = {k: 100 * v / z for k, v in w.items()}
        links = {
            (lk.source, lk.target): (lk.likelihood, lk.impact)
            for lk in cfg.links
            if lk.source in weights and lk.target in weights
        }
        params = Params(
            weights,
            links,
            cfg.certification.add_on,
            cfg.carryover_factor,
            cfg.propagation_reference_impact,
        )
        return cls(cfg, vehicle, params, {s.key: s.name for s in cfg.subsystems})

    def check_change(self, c: Change) -> list[str]:
        """Rule violations of one authored change (empty = valid)."""
        errors = []
        if c.subsystem not in self.base.weights:
            known = c.subsystem in self.names
            errors.append(
                f"{c.subsystem}: not present on {self.vehicle} (new for this vehicle = new "
                "generation)"
                if known
                else f"unknown subsystem {c.subsystem}"
            )
            return errors
        if self.is_platform_change(c) and c.layer != "K3":
            errors.append(
                f"{c.subsystem} replaced at {c.own_impact:.0%} without carryover is a platform "
                f"change and must be K3 (rule 42), not {c.layer}"
            )
        if c.layer == "K0" and c.own_impact > self.cfg.k0_max_own_impact:
            errors.append(
                f"K0 is configuration only; own impact {c.own_impact} exceeds "
                f"{self.cfg.k0_max_own_impact}"
            )
        return errors

    def is_platform_change(self, c: Change) -> bool:
        rule = self.cfg.platform_rule
        return (
            c.subsystem in rule.subsystems
            and c.own_impact >= rule.min_own_impact
            and not c.carryover
        )

    def triggers_certification(self, c: Change) -> bool:
        cert = self.cfg.certification
        return (
            c.layer != "K0"
            and c.subsystem in cert.trigger_subsystems
            and c.own_impact >= cert.min_own_impact
            and not c.carryover
        )


@cache
def _paths(link_keys: frozenset[tuple[str, str]], src: str, maxlen: int) -> dict[str, tuple]:
    """All simple propagation paths from ``src`` of at most ``maxlen`` steps, by end node."""
    out: dict[str, list[tuple[str, ...]]] = {}
    succ: dict[str, list[str]] = {}
    for a, b in sorted(link_keys):
        succ.setdefault(a, []).append(b)

    def dfs(path: tuple[str, ...]) -> None:
        if len(path) - 1 == maxlen:
            return
        for b in succ.get(path[-1], []):
            if b in path:
                continue
            nxt = path + (b,)
            out.setdefault(b, []).append(nxt)
            dfs(nxt)

    dfs((src,))
    return {k: tuple(v) for k, v in out.items()}


def propagate(
    engine: Engine, c: Change, p: Params | None = None
) -> dict[str, tuple[float, tuple[str, ...] | None]]:
    """Risk per subsystem for one change, with the strongest path (rule 52)."""
    p = p or engine.base
    own = min(1.0, c.own_impact * p.own_scale)
    out: dict[str, tuple[float, tuple[str, ...] | None]] = {c.subsystem: (own, None)}
    if c.layer == "K0":  # configuration only: no propagation (rule 42)
        return out
    first = min(1.0, own / p.ref_impact) * (p.carryover_factor if c.carryover else 1.0)
    paths = _paths(frozenset(p.links), c.subsystem, engine.cfg.max_path_length)
    for target, plist in paths.items():
        keep = 1.0
        best, best_path = 0.0, None
        for path in plist:
            likelihood = first
            for a, b in zip(path, path[1:], strict=False):
                likelihood *= p.links[(a, b)][0]
            risk = likelihood * p.links[(path[-2], path[-1])][1]
            keep *= 1 - risk
            if risk > best:
                best, best_path = risk, path
        out[target] = (1 - keep, best_path)
    return out


@dataclass
class Estimate:
    effort: float
    layer: Layer
    decision: Decision
    size: str
    certification: bool
    platform_change: bool
    subsystems: list[dict[str, Any]]

    def as_dict(self) -> dict[str, Any]:
        return {
            "effort_pct": round(self.effort, 2),
            "layer": self.layer,
            "decision": self.decision,
            "size": self.size,
            "certification_add_on": self.certification,
            "platform_change": self.platform_change,
            "subsystems": self.subsystems,
        }


def _score(engine: Engine, changes: list[Change], p: Params) -> tuple[float, bool, dict]:
    keep: dict[str, float] = {}
    best: dict[str, tuple[float, tuple[str, ...] | None]] = {}
    for c in changes:
        for j, (risk, path) in propagate(engine, c, p).items():
            keep[j] = keep.get(j, 1.0) * (1 - risk)
            if j not in best or risk > best[j][0]:
                best[j] = (risk, path)
    cert = any(engine.triggers_certification(c) for c in changes)
    effort = sum((1 - k) * p.weights[j] for j, k in keep.items()) + (p.cert_add if cert else 0)
    return effort, cert, {j: (1 - keep[j], best[j][1]) for j in keep}


def decide(engine: Engine, effort: float, changes: list[Change]) -> Decision:
    """Rule 47: thresholds on the score, and any K3 change without carryover means a new
    generation regardless of the score."""
    if not changes:
        return "no change"
    if any(c.layer == "K3" and not c.carryover for c in changes):
        return "new generation"
    return score_class(engine, effort)


def score_class(engine: Engine, effort: float) -> Decision:
    t = engine.cfg.thresholds
    if effort < t.major_revision:
        return "adapt"
    return "major revision" if effort < t.new_generation else "new generation"


def size(engine: Engine, effort: float, changes: list[Change]) -> str:
    if not changes:
        return "-"
    for label, upper in sorted(engine.cfg.sizes.items(), key=lambda kv: kv[1]):
        if effort < upper:
            return label
    return "XL"


def estimate(engine: Engine, changes: list[Change]) -> Estimate:
    errors = [e for c in changes for e in engine.check_change(c)]
    if errors:
        raise ValueError("; ".join(errors))
    effort, cert, risks = _score(engine, changes, engine.base)
    rows = [
        {
            "subsystem": j,
            "name": engine.names[j],
            "risk": round(r, 4),
            "effort_pct": round(r * engine.base.weights[j], 2),
            "path": [engine.names[n] for n in path] if path else None,
        }
        for j, (r, path) in risks.items()
        if r * engine.base.weights[j] >= 0.005
    ]
    rows.sort(key=lambda x: -x["effort_pct"])
    layer = max((c.layer for c in changes), key=LAYERS.index, default="K0")
    return Estimate(
        effort=effort,
        layer=layer,
        decision=decide(engine, effort, changes),
        size=size(engine, effort, changes),
        certification=cert,
        platform_change=any(engine.is_platform_change(c) for c in changes),
        subsystems=rows,
    )


# ---- sensitivity (rule 51) ----------------------------------------------------------------------

JitterScope = Literal["matrix", "all"]
_SCOPES = {
    "matrix": "W, L, I",
    "all": "W, L, I, certification add-on, carryover factor, reference impact, own impacts",
}


def jitter(p: Params, rng: random.Random, spread: float, scope: JitterScope) -> Params:
    """Scale every W, L, I by a factor in [1 - spread, 1 + spread]; renormalise W to 100 and clip
    L and I to 1. Scope ``all`` also varies the certification add-on, the carryover factor, the
    propagation reference impact and the authored own impacts (one common factor per run)."""
    lo, hi = 1 - spread, 1 + spread
    w = {k: v * rng.uniform(lo, hi) for k, v in p.weights.items()}
    z = sum(w.values())
    w = {k: 100 * v / z for k, v in w.items()}
    links = {
        k: (min(1.0, li * rng.uniform(lo, hi)), min(1.0, im * rng.uniform(lo, hi)))
        for k, (li, im) in p.links.items()
    }
    out = replace(p, weights=w, links=links)
    if scope == "all":
        out = replace(
            out,
            cert_add=p.cert_add * rng.uniform(lo, hi),
            carryover_factor=min(1.0, p.carryover_factor * rng.uniform(lo, hi)),
            own_scale=rng.uniform(lo, hi),
            ref_impact=min(1.0, p.ref_impact * rng.uniform(lo, hi)),
        )
    return out


@dataclass
class Samples:
    params: list[Params]
    scope: JitterScope
    spread: float
    seed: int


def draw(
    engine: Engine, n: int = 2000, spread: float = 0.5, scope: JitterScope = "all", seed: int = 42
) -> Samples:
    rng = random.Random(seed)
    return Samples([jitter(engine.base, rng, spread, scope) for _ in range(n)], scope, spread, seed)


def sensitivity(engine: Engine, changes: list[Change], samples: Samples) -> dict[str, Any]:
    """P5 / P95 of the effort and the share of runs that keep the decision of the base case."""
    if not changes:
        return {"p5": 0.0, "p95": 0.0, "decision_stable_pct": 100.0, "score_stable_pct": 100.0}
    base_effort, _, _ = _score(engine, changes, engine.base)
    base_decision = decide(engine, base_effort, changes)
    base_score = score_class(engine, base_effort)
    vals = sorted(_score(engine, changes, p)[0] for p in samples.params)
    n = len(vals)
    return {
        "p5": round(vals[n // 20], 2),
        "p95": round(vals[-(n // 20)], 2),
        "decision_stable_pct": round(
            100 * sum(decide(engine, v, changes) == base_decision for v in vals) / n, 1
        ),
        "score_stable_pct": round(
            100 * sum(score_class(engine, v) == base_score for v in vals) / n, 1
        ),
    }


# ---- back-test ----------------------------------------------------------------------------------


class Anchor(_Strict):
    id: str
    name: str
    vehicle: str | None = None
    changes: list[Change] = Field(min_length=1)
    actual: Literal["adapt", "major revision", "new generation"]
    evidence: str
    source: str
    independent: bool = True


class AnchorFile(_Strict):
    anchors: list[Anchor]
    proposals: list[Anchor] = []


def load_anchors(path: Path | None = None) -> AnchorFile:
    path = path or config_dir() / "anchors.yaml"
    return AnchorFile.model_validate(yaml.safe_load(path.read_text(encoding="utf-8")))


def backtest(
    cfg: ModelConfig,
    anchors: AnchorFile,
    *,
    n: int = 2000,
    spread: float = 0.5,
    scope: JitterScope = "all",
    seed: int = 42,
) -> dict[str, Any]:
    """Classify the documented BMW decisions with the same engine and the same inputs."""
    rows = []
    engines: dict[str | None, tuple[Engine, Samples]] = {}
    for a in anchors.anchors + anchors.proposals:
        if a.vehicle not in engines:
            eng = Engine.for_vehicle(cfg, a.vehicle)
            engines[a.vehicle] = (eng, draw(eng, n, spread, scope, seed))
        eng, samples = engines[a.vehicle]
        est = estimate(eng, a.changes)
        sens = sensitivity(eng, a.changes, samples)
        is_anchor = a in anchors.anchors
        rows.append(
            {
                "id": a.id,
                "name": a.name,
                "anchor": is_anchor,
                "independent": a.independent,
                **est.as_dict(),
                "effort_raw": est.effort,
                **sens,
                "actual": a.actual if is_anchor else None,
                "ok": (est.decision == a.actual) if is_anchor else None,
                "k3_rule": est.decision != score_class(eng, est.effort),
            }
        )
    hits = [r for r in rows if r["anchor"] and r["ok"]]
    return {
        "rows": rows,
        "hits": len(hits),
        "anchors": len(anchors.anchors),
        "independent_hits": sum(r["independent"] for r in hits),
        "independent_anchors": sum(a.independent for a in anchors.anchors),
        "runs": n,
        "spread": spread,
        "scope": scope,
        "seed": seed,
        "model_hash": model_hash(cfg),
    }


def render_backtest(result: dict[str, Any]) -> str:
    lines = [
        f"{'Change':46} {'base':>6} {'P5':>6} {'P95':>6}  {'decision':16} {'K3':3} "
        f"{'actual':16} {'stable%':>7}  ok"
    ]
    for r in result["rows"]:
        lines.append(
            f"{r['name'][:46]:46} {r['effort_raw']:6.1f} {r['p5']:6.1f} {r['p95']:6.1f}  "
            f"{r['decision']:16} {'*' if r['k3_rule'] else '':3} {r['actual'] or '':16} "
            f"{r['score_stable_pct']:7.0f}  "
            f"{'' if r['ok'] is None else ('OK' if r['ok'] else 'FAIL')}"
        )
    lines.append("")
    lines.append(
        f"Back-test: {result['hits']}/{result['anchors']} BMW decisions classified correctly "
        f"({result['independent_hits']}/{result['independent_anchors']} independent). "
        f"Sensitivity: {result['runs']} runs, +-{result['spread']:.0%}, scope '{result['scope']}' "
        f"({_SCOPES[result['scope']]}), "
        f"model {result['model_hash']}. K3 * = decided by the platform rule, not the score; "
        "stable% = share of runs with the same score class."
    )
    return "\n".join(lines)

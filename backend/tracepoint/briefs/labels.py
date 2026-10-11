"""The product manager's vocabulary (D-100).

The evidence store, the effort engine and the agents speak in codes: ``K2``, ``major revision``,
``metric_gap``, ``change_now_regional``, ``not_fetched``, rule ``47``. A product manager reads
words. This module holds every code a screen or a brief shows with the words that stand in for it,
in one place, so the API, the briefs and the screens say the same thing. ``GET /glossary`` serves
it. The texts are English without dashes, as the frontend's forbidden list asks of every line on
screen.
"""

from __future__ import annotations

from typing import Any

import yaml

from tracepoint.core.settings import get_settings
from tracepoint.effort.cpm import load_model
from tracepoint.effort.subsystems import subsystem_names

# The markets as the map names them (reports/overview.py takes its names from here).
MARKET = {
    "EU": "European Union",
    "US": "United States",
    "CN": "China",
    "RoW": "Rest of world",
    "Global": "Worldwide",
    "ALL": "All markets",
}

HORIZON = {
    "H1": "Now, within the current generation (model year update, software, equipment, packages)",
    "H2": "Next generation, about 2030",
}
HORIZON_SHORT = {"H1": "Now (H1)", "H2": "Next generation (H2)"}


def _pct(value: float) -> str:
    return f"{value:g} %"


def effort_decisions() -> dict[str, str]:
    """The class of an effort estimate, with the thresholds of the model the engine computes with."""
    t = load_model().thresholds
    return {
        "no change": "No change on the vehicle",
        "adapt": f"Adaptation, below {_pct(t.major_revision)} of a new vehicle generation",
        "major revision": f"Major revision, {t.major_revision:g} to {_pct(t.new_generation)} of a "
        "new vehicle generation",
        "new generation": f"New generation, {_pct(t.new_generation)} or more, or a platform change "
        "without carryover",
    }


def sizes() -> dict[str, str]:
    """The size classes of an estimate, from the model's bounds (XS below the first, and so on)."""
    bounds = sorted(load_model().sizes.items(), key=lambda kv: kv[1])
    out = {"-": "no change"}
    lower = None
    for key, upper in bounds:
        out[key] = f"below {_pct(upper)}" if lower is None else f"{lower:g} to {_pct(upper)}"
        lower = upper
    out["XL"] = f"{_pct(lower)} or more" if lower is not None else "any"
    return out


LAYER = {
    "K0": "configuration: content, packages or existing hardware switched on",
    "K1": "add-on on existing interfaces",
    "K2": "module change",
    "K3": "platform change",
}
LAYER_SHORT = {
    "K0": "configuration",
    "K1": "add-on",
    "K2": "module change",
    "K3": "platform change",
}
EFFORT_STATUS = {
    "estimated": "estimated",
    "no_vehicle_change": "no change on the vehicle",
    "missing": "not estimated, no usable change profile",
    "invalid": "not estimated, the change profile breaks a rule of the effort model",
}
BORDERLINE_BELOW = 90.0  # rule 51: a class kept in fewer sensitivity runs is borderline

# Requirement gate G2 states.
STATUS = {
    "proposed": "awaiting decision",
    "approved": "approved",
    "rejected": "rejected",
    "deferred": "deferred",
    "withdrawn": "withdrawn",
}

# Evidence level of a finding or a requirement (config/findings/findings.yaml).
EVIDENCE_LEVEL = {
    "A": "strong: several source types, many customer rows and a weak study score agree",
    "B": "solid: ten customer rows or more, or a study result",
    "C": "thin: five to nine customer rows, or a catalogue check",
    "D": "assumption: no finding behind it",
}
# Strength of an external or market statement, a different scale from A to D.
SOURCE_LEVEL = {
    "strong": "three or more independent sources",
    "medium": "two independent sources",
    "weak": "one source",
}
VERIFICATION = {
    "confirmed": "figures found on the source page",
    "computed": "computed from an official data service",
    "on_page": "figures on the source page, but not in one passage",
    "partial": "some figures not found on the source page",
    "not_found": "figures not found on the source page",
    "not_checkable": "nothing on the source page to check against",
    "not_fetched": "source page could not be read",
}
VERIFIED = frozenset({"confirmed", "computed"})
TRUST = {1: "low", 2: "medium", 3: "medium to high", 4: "high"}
BASIS = {"evidence": "measured or reported", "assumption": "forecast or judgement"}
EXTERNAL_KIND = {
    "market_share": "market share",
    "market_context": "market context",
    "consumer_pull": "consumer survey",
    "infrastructure": "infrastructure",
    "owner_voice": "owner voice",
    "expert_test": "expert test",
    "quality_index": "quality index",
    "competitor_move": "competitor move",
    "bmw_offer": "BMW offer",
    "official_spec": "official specification",
    "regulation_context": "regulation",
}

FINDING_KIND = {
    "recurring_complaint": "recurring complaint",
    "unmet_need": "unmet need",
    "strength": "strength to keep",
    "metric_gap": "weak study score",
    "metric_strength": "strong study score",
    "equipment_gap": "catalogue gap",
    "competitor_advantage": "competitor advantage",
    "trend": "trend",
    "context": "market context",
}

# The insights of a situation analysis, grouped as a product manager asks about them.
INSIGHT_GROUP = {
    "recurring_complaint": "problems",
    "unmet_need": "wishes",
    "metric_gap": "study",
    "equipment_gap": "offer",
    "context": "context",
    "strength": "strengths",
}
INSIGHT_GROUPS = [
    ("problems", "What customers complain about"),
    ("wishes", "What customers miss"),
    ("study", "Where study scores are weak"),
    ("offer", "Where the offer falls short"),
    ("context", "Market context"),
    ("strengths", "What customers value and should be kept"),
]

# The proposals of a situation analysis, grouped by what they ask of the vehicle.
PROPOSAL_GROUPS = [
    ("now", "Change now, within the current generation (H1)"),
    ("next", "Change with the next generation (H2)"),
    ("keep", "Keep as it is, or act outside the vehicle"),
]

# The decisions of a series analysis (agent/series.py), in the order a product manager reads them.
SERIES_DECISION = {
    "change_now_all_markets": "Change now, all markets",
    "change_now_regional": "Change now, regional",
    "next_generation": "Next generation",
    "keep": "Keep",
    "no_action": "No action",
}
SERIES_DECISION_EXPLAIN = {
    "change_now_all_markets": "within the current generation, for every region",
    "change_now_regional": "within the current generation, only where the evidence asks for it",
    "next_generation": "too large for the current generation; plan it for the successor",
    "keep": "a strength to protect in any change",
    "no_action": "the evidence does not carry a change",
}
REGION_WEIGHT = {
    "strong": "strong signal",
    "moderate": "moderate signal",
    "weak": "weak signal",
    "none": "no signal",
}
CONFIDENCE = {"high": "high confidence", "medium": "medium confidence", "low": "low confidence"}

# Checks of the effort engine and of the analyses: rule number or name, in a few words.
FLAG_LEVEL = {"conflict": "conflict", "warning": "check", "info": "note"}
FLAG_RULE = {
    "43": "catalogue scan",
    "47": "class beyond the horizon",
    "48": "small enough for now",
    "51": "borderline estimate",
    "63": "estimate on an older version",
    "scope": "outside this scope",
    "G2": "already decided at gate G2",
    "map": "change and evidence sit in different subsystems",
    "size": "size against similar changes",
    "horizon": "horizon and decision disagree",
}

REFERENCE_KIND = {
    "finding": ("finding", "findings"),
    "verbatim": ("customer verbatim", "customer verbatims"),
    "metric": ("study score", "study scores"),
    "equipment": ("catalogue item", "catalogue items"),
    "sales": ("sales figure", "sales figures"),
    "spec": ("technical figure", "technical figures"),
    "external": ("external source", "external sources"),
    "document": ("document page", "document pages"),
    "market": ("market statement", "market statements"),
    "requirement": ("requirement", "requirements"),
    "aggregate": ("count", "counts"),
    "unknown": ("other reference", "other references"),
}


def domain_names() -> dict[str, str]:
    path = get_settings().config_dir / "taxonomy" / "domains.yaml"
    domains = yaml.safe_load(path.read_text(encoding="utf-8"))["domains"]
    return {key: value["name"] for key, value in domains.items()}


def glossary() -> dict[str, Any]:
    """Every vocabulary of this module, for ``GET /glossary``."""
    return {
        "markets": MARKET,
        "horizons": HORIZON,
        "effortDecisions": effort_decisions(),
        "layers": LAYER,
        "sizes": sizes(),
        "effortStatus": EFFORT_STATUS,
        "borderlineBelowPercent": BORDERLINE_BELOW,
        "requirementStatus": STATUS,
        "evidenceLevels": EVIDENCE_LEVEL,
        "sourceLevels": SOURCE_LEVEL,
        "verification": VERIFICATION,
        "verified": sorted(VERIFIED),
        "trust": {str(k): v for k, v in TRUST.items()},
        "basis": BASIS,
        "externalKinds": EXTERNAL_KIND,
        "findingKinds": FINDING_KIND,
        "insightGroups": dict(INSIGHT_GROUPS),
        "proposalGroups": dict(PROPOSAL_GROUPS),
        "seriesDecisions": {
            k: {"label": v, "explain": SERIES_DECISION_EXPLAIN[k]}
            for k, v in SERIES_DECISION.items()
        },
        "regionWeights": REGION_WEIGHT,
        "confidence": CONFIDENCE,
        "flagLevels": FLAG_LEVEL,
        "flagRules": FLAG_RULE,
        "referenceKinds": {
            k: {"one": one, "many": many} for k, (one, many) in REFERENCE_KIND.items()
        },
        "subsystems": subsystem_names(),
        "domains": domain_names(),
    }

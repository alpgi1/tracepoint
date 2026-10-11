"""The twelve CPM subsystems as a view on the evidence (decisions D-073 to D-076).

Customers speak in themes and domains; effort propagates in subsystems. This module joins the two
with the authored mapping ``config/cpm/theme_subsystem_map.yaml``: which classification rows fall
in each subsystem, which themes customers like and criticise there, and what the market and
competitor evidence of ``config/cpm/market_context.yaml`` says about it. The subsystems, their
weights and the subsystems a vehicle does not have come from the effort model the engine computes
with (``config/effort/model.yaml``), so the screens and the estimates rest on one file.

The output has the shape of ``frontend/lib/content/cpm-types.ts``, the contract of
``GET /cpm/{vehicle}``; ``frontend/scripts/build-cpm.py`` builds the same content from the
workbooks, and the tests hold the two equal. It also feeds the context pack and the tools of the
agents. The mapping, the weights and the links are assumptions, not calibrated (effort rule 50).
"""

from __future__ import annotations

from collections import Counter
from datetime import UTC, date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.db.models import (
    ExternalEvidence,
    Finding,
    RequirementFinding,
    TaxonomyLevel2,
    Verbatim,
    VerbatimClassification,
)
from tracepoint.effort.cpm import Engine, load_model, model_hash
from tracepoint.findings.config import load_config as load_finding_rules

Labels = Literal["given", "all"]
COMPLAINT_FIELDS = {"Defect": "defects", "Difficult to Use": "difficultToUse", "Wants": "wants"}
MAX_THEMES = 6
MAX_QUOTES = 2
QUOTE_MIN, QUOTE_MAX, QUOTE_CUT = 40, 240, 300
SURVEY_SOURCE = "Source C"  # survey answers that repeat the question; used when nothing else exists
METHOD = {
    "name": "Change Prediction Method",
    "reference": "Clarkson, Simons, Eckert (2004), Predicting Change Propagation in Complex "
    "Design, Journal of Mechanical Design 126(5)",
    "url": "https://oro.open.ac.uk/18626",
    "engine": "backend/tracepoint/effort/cpm.py",
    "modelSource": "config/effort/model.yaml",
}


class _Source(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    url: str
    date: date
    type: Literal["primary", "secondary"]


class MarketRow(BaseModel):
    """One market or competitor statement (rules 31 to 36 of the team's rule set)."""

    model_config = ConfigDict(extra="forbid")
    market: str
    subsystem: str
    kind: Literal["market", "competitor"]
    statement: str
    source: _Source
    level: Literal["strong", "medium", "weak"]
    basis: Literal["evidence", "assumption"]
    note: str | None = None
    contradiction: dict[Literal["for", "against"], str] | None = None


def cpm_dir() -> Path:
    from tracepoint.core.settings import get_settings

    return get_settings().config_dir / "cpm"


def _read(name: str) -> Any:
    return yaml.safe_load((cpm_dir() / name).read_text(encoding="utf-8"))


def subsystem_names() -> dict[str, str]:
    """Key → name of the twelve subsystems, in the model's order."""
    return {s.key: s.name for s in load_model().subsystems}


@lru_cache(maxsize=4)
def _theme_map(mtime: float) -> tuple[dict[str, str], tuple[str, ...]]:
    data = _read("theme_subsystem_map.yaml")
    known = set(subsystem_names())
    themes: dict[str, str] = {}
    for key, names in data["map"].items():
        if key not in known:
            raise ValueError(f"theme_subsystem_map.yaml: unknown subsystem {key}")
        for name in names or []:
            if name in themes:
                raise ValueError(f"theme_subsystem_map.yaml: {name!r} is mapped twice")
            themes[name] = key
    unassigned = tuple(data.get("unassigned") or [])
    if set(unassigned) & set(themes):
        raise ValueError("theme_subsystem_map.yaml: a theme is both mapped and unassigned")
    return themes, unassigned


def load_theme_map() -> tuple[dict[str, str], tuple[str, ...]]:
    """(level-2 theme name → subsystem key, themes that belong to no subsystem)."""
    return _theme_map((cpm_dir() / "theme_subsystem_map.yaml").stat().st_mtime)


def theme_subsystem(theme: str | None) -> str | None:
    return load_theme_map()[0].get(theme) if theme else None


def load_market_rows(market: str | None = None) -> list[dict[str, Any]]:
    """Market and competitor evidence rows, each with a stable id (its position among the rows
    of the same market and subsystem; new rows are appended) and an evidence reference."""
    known = set(subsystem_names())
    seen: Counter = Counter()
    out = []
    for raw in _read("market_context.yaml")["rows"]:
        row = MarketRow.model_validate(raw)
        if row.subsystem not in known:
            raise ValueError(f"market_context.yaml: unknown subsystem {row.subsystem}")
        seen[row.market, row.subsystem] += 1
        rid = f"MKT-{row.market}-{row.subsystem}-{seen[row.market, row.subsystem]}"
        if market and row.market != market:
            continue
        out.append(
            {
                "id": rid,
                "evidence_ref": f"market:{rid}",
                "market": row.market,
                "subsystem": row.subsystem,
                "kind": row.kind,
                "statement": row.statement,
                "source": {**row.source.model_dump(), "date": row.source.date.isoformat()},
                "level": row.level,
                "basis": row.basis,
                "note": row.note,
                "contradiction": row.contradiction,
            }
        )
    return out


_LEVEL_RANK = {"strong": 0, "medium": 1, "weak": 2}


def external_rows(
    session: Session,
    market: str,
    vehicle: str | None = None,
    *,
    subsystem: str | None = None,
    topic: str | None = None,
    kind: str | None = None,
) -> list[dict[str, Any]]:
    """External evidence for a market (the team's source lists, loaded by ``ingest external``):
    the rows of the market and the worldwide ones, without rows about another vehicle and
    without rows that bear only on subsystems the vehicle does not have. Rows about the vehicle
    come first, then by evidence level and trust; the official specification tables (one row
    per model year and drive) come last, so that they do not crowd out the rest."""
    profile = load_model().vehicles.get(vehicle) if vehicle else None
    absent = set(profile.absent) if profile else set()
    out = []
    for e in session.scalars(select(ExternalEvidence)):
        if not {market, "Global"} & set(e.regions):
            continue
        if vehicle and e.vehicles and vehicle not in e.vehicles:
            continue
        if e.subsystems and not set(e.subsystems) - absent:
            continue
        if (subsystem and subsystem not in e.subsystems) or (topic and topic != e.topic):
            continue
        if kind and kind != e.kind:
            continue
        out.append(
            {
                "id": e.id,
                "evidence_ref": f"external:{e.id}",
                "kind": e.kind,
                "statement": e.statement,
                "regions": e.regions,
                "subsystems": e.subsystems,
                "vehicles": e.vehicles,
                "topic": e.topic,
                "level": e.level,
                "sources_agreeing": e.sources_agreeing,
                "basis": e.basis,
                "trust": e.trust,
                "verification": e.verification,
                "source": {
                    "title": e.locator["title"],
                    "origin": e.locator["origin"],
                    "url": e.locator["url"],
                    "date": e.published,
                    "type": e.locator["source_type"],
                },
                "contradiction": {k: e.contradiction[k] for k in ("for", "against")}
                if e.contradiction
                else None,
            }
        )
    out.sort(
        key=lambda r: (
            r["kind"] == "official_spec",
            vehicle not in r["vehicles"],
            _LEVEL_RANK[r["level"]],
            -r["trust"],
            r["id"],
        )
    )
    return out


def external_summary(rows: list[dict[str, Any]], vehicle: str) -> dict[str, Any]:
    """What the external evidence of a scope holds, for the context pack."""
    per: Counter = Counter(k for r in rows for k in r["subsystems"])
    return {
        "rows": len(rows),
        "about_this_vehicle": sum(vehicle in r["vehicles"] for r in rows),
        "worldwide_only": sum(r["regions"] == ["Global"] for r in rows),
        "not_confirmed_on_the_page": sum(
            r["verification"] not in ("confirmed", "computed") for r in rows
        ),
        "by_subsystem": dict(per.most_common()),
        "topics": sorted({r["topic"] for r in rows if r["topic"]}),
    }


def model_catalogue() -> dict[str, Any]:
    """The effort model as the screens read it (``CpmCatalogue``, served by ``GET /effort/model``):
    method, the subsystems with weight, basis, certification trigger and links, the mapping
    summary, and which subsystems each vehicle does not have."""
    from tracepoint.core.settings import get_settings

    cfg = load_model()
    themes, unassigned = load_theme_map()
    domains = yaml.safe_load(
        (get_settings().config_dir / "taxonomy" / "domains.yaml").read_text(encoding="utf-8")
    )["domains"]
    return {
        "generatedAt": datetime.now(UTC).date().isoformat(),
        "method": {
            **METHOD,
            "modelVersion": cfg.version,
            "basis": cfg.status,
            "thresholds": {
                "adaptBelowPercent": cfg.thresholds.major_revision,
                "newGenerationFromPercent": cfg.thresholds.new_generation,
            },
            "certificationAddOnPercent": cfg.certification.add_on,
        },
        "subsystems": [
            {
                "key": s.key,
                "name": s.name,
                "weight": s.weight,
                "basis": s.basis,
                "certificationTrigger": s.key in cfg.certification.trigger_subsystems,
                "links": [
                    {"to": k.target, "likelihood": k.likelihood, "impact": k.impact, "why": k.why}
                    for k in cfg.links
                    if k.source == s.key
                ],
            }
            for s in cfg.subsystems
        ],
        "mapping": {
            "source": "config/cpm/theme_subsystem_map.yaml, the team's assignment of every "
            "level-2 theme to one subsystem (assumption)",
            "themes": len(themes),
            "unassigned": sorted(unassigned),
        },
        "marketContextSource": "config/cpm/market_context.yaml (rules 31 to 36 of the team's "
        "rule set v0.2)",
        "narrationSource": "suggestion and summary per block are template text derived from the "
        "counts and config/findings/findings.yaml (strength and unmet-need rules); basis "
        "'derived' until the backend's agent writes them",
        "domains": {k: v["name"] for k, v in domains.items()},
        "vehicles": {
            code: {"platform": v.platform, "absent": list(v.absent), "note": v.note}
            for code, v in cfg.vehicles.items()
        },
        "modelHash": model_hash(cfg),
    }


def _pick_quotes(cands: list[Verbatim]) -> list[dict[str, Any]]:
    """Two verbatims per theme and polarity: one per verbatim, sources other than the survey
    first, texts of a readable length, in the order of their ids (as the frontend build does)."""
    unique = list({v.id: v for v in sorted(cands, key=lambda v: v.id)}.values())
    preferred = [
        v
        for v in unique
        if v.source_label != SURVEY_SOURCE and QUOTE_MIN <= v.char_len <= QUOTE_MAX
    ]
    return [
        {
            "id": v.id,
            "evidenceRef": f"verbatim:{v.id}",
            "text": v.text if v.char_len <= QUOTE_CUT else v.text[:QUOTE_CUT] + " …",
            "source": v.source_label,
            "powertrain": v.powertrain,
            "country": v.country_code,
        }
        for v in (preferred or [v for v in unique if v.text])[:MAX_QUOTES]
    ]


def _join(names: list[str]) -> str:
    return "".join(names) if len(names) <= 1 else ", ".join(names[:-1]) + " and " + names[-1]


def liked_narration(
    liked: list[dict[str, Any]], likes: int, rows: int, n_themes: int, rules: dict[str, Any]
) -> dict[str, str] | None:
    """Template text from the counts and the strength rule of the finding configuration; the
    same sentences as ``frontend/scripts/build-cpm.py``."""
    if rows == 0:
        return None
    min_rows, min_share = rules["min_strength_rows"], rules["min_strength_share"]
    strengths = [
        t for t in liked if t["likes"] >= min_rows and t["likes"] / t["rows"] >= min_share
    ][:3]
    rule = f"at least {min_rows} likes and {min_share:.0%} of its rows"
    if strengths:
        share = min(t["likes"] / t["rows"] for t in strengths)
        share_text = (
            f"{share:.0%} of its rows are likes"
            if len(strengths) == 1
            else f"{share:.0%} or more of their rows are likes"
        )
        suggestion = (
            f"Keep {_join([t['theme'] for t in strengths])}: {share_text} (strength rule: {rule})."
        )
    elif likes == 0:
        suggestion = "No likes recorded in this subsystem; nothing is flagged to keep."
    else:
        suggestion = (
            f"No theme meets the strength rule ({rule}), so nothing in this subsystem is "
            "flagged to keep."
        )
    parts = [f"{likes:,} likes in {rows:,} rows across {n_themes} theme{'s'[: n_themes != 1]}."]
    if liked:
        first = liked[0]
        lead = f"{first['theme']} leads with {first['likes']:,} likes of {first['rows']:,} rows"
        rest = [f"{t['theme']} ({t['likes']:,} of {t['rows']:,})" for t in liked[1:3]]
        parts.append(lead + (", then " + _join(rest) if rest else "") + ".")
    return {"suggestion": suggestion, "summary": " ".join(parts), "basis": "derived"}


def criticised_narration(
    criticised: list[dict[str, Any]],
    complaints: int,
    rows: int,
    totals: dict[str, int],
    rules: dict[str, Any],
) -> dict[str, str] | None:
    """Template text from the counts and the unmet-need rule of the finding configuration."""
    if rows == 0:
        return None
    if not criticised:
        return {
            "suggestion": "No complaints recorded in this subsystem.",
            "summary": f"{rows:,} rows, none of them a complaint.",
            "basis": "derived",
        }
    first = criticised[0]
    kinds = {
        "defects": first["defects"],
        "difficult to use": first["difficultToUse"],
        "wants": first["wants"],
    }
    dominant = max(kinds, key=lambda k: kinds[k])
    unmet = first["wants"] / first["complaints"] >= rules["unmet_need_wants_share"]
    kind = "an unmet need" if unmet else "a recurring complaint"
    suggestion = (
        f"Address {first['theme']} first: {first['complaints']:,} complaints of "
        f"{first['rows']:,} rows, mostly {dominant} ({kind})."
    )
    top = criticised[:3]
    share = sum(t["complaints"] for t in top) / complaints
    summary = (
        f"{complaints:,} complaints in {rows:,} rows: {totals['defects']:,} defects, "
        f"{totals['difficultToUse']:,} difficult to use, {totals['wants']:,} wants. "
        f"{_join([f'{t["theme"]} ({t["complaints"]:,})' for t in top])} "
        f"carr{'ies' if len(top) == 1 else 'y'} {share:.0%} of them."
    )
    return {"suggestion": suggestion, "summary": summary, "basis": "derived"}


def subsystem_view(
    session: Session,
    vehicle: str,
    market: str,
    country: str | None = None,
    *,
    labels: Labels = "given",
    subsystem: str | None = None,
) -> dict[str, Any]:
    """Per subsystem present on the vehicle: weight, classification rows, likes, complaints, the
    liked and the criticised block (derived narration, six themes with two verbatims each) and
    the market rows (``CpmView``).

    ``labels`` is the counting basis: ``given`` counts the labels of the workbooks only, as the
    committed baselines and the frontend content do; ``all`` adds the assistant's gap labels
    (D-056), as the baseline builder and the context pack do. ``subsystem`` keeps the totals of
    every subsystem and returns the quotes of that one only."""
    cfg = load_model()
    engine = Engine.for_vehicle(cfg, vehicle)
    profile = cfg.vehicles.get(vehicle)
    absent = list(profile.absent) if profile else []
    themes, _ = load_theme_map()
    rules = load_finding_rules().voc
    stmt = (
        select(Verbatim, VerbatimClassification.feedback_type, TaxonomyLevel2)
        .join(VerbatimClassification, VerbatimClassification.verbatim_id == Verbatim.id)
        .join(TaxonomyLevel2, TaxonomyLevel2.id == VerbatimClassification.level2_id)
        .where(
            Verbatim.vehicle_code == vehicle,
            Verbatim.market_code == market,
            VerbatimClassification.status == "canonical",
        )
    )
    if country:
        stmt = stmt.where(Verbatim.country_code == country)
    if labels == "given":
        stmt = stmt.where(VerbatimClassification.origin == "given")
    scope = [Verbatim.vehicle_code == vehicle, Verbatim.market_code == market]
    if country:
        scope.append(Verbatim.country_code == country)
    verbatims = session.scalar(select(func.count()).select_from(Verbatim).where(*scope))
    per: dict[str, dict[str, dict[str, Any]]] = {s: {} for s in engine.base.weights}
    absent_rows = dict.fromkeys(absent, 0)
    rows = unassigned = 0
    for v, ftype, theme in session.execute(stmt):
        rows += 1
        key = themes.get(theme.name)
        if key is None:
            unassigned += 1
            continue
        if key in absent_rows:
            absent_rows[key] += 1
            continue
        t = per[key].setdefault(
            theme.name,
            {
                "theme": theme.name,
                "domain": theme.domain_key or "general",
                "rows": 0,
                "likes": 0,
                "complaints": 0,
                "defects": 0,
                "difficultToUse": 0,
                "wants": 0,
                "_liked": [],
                "_criticised": [],
            },
        )
        t["rows"] += 1
        if ftype == "Likes":
            t["likes"] += 1
            t["_liked"].append(v)
        elif ftype in COMPLAINT_FIELDS:
            t["complaints"] += 1
            t[COMPLAINT_FIELDS[ftype]] += 1
            t["_criticised"].append(v)
    market_rows = load_market_rows(market)
    entries = []
    for key, by_theme in per.items():
        detail = subsystem is None or subsystem == key
        all_themes = list(by_theme.values())
        liked = sorted(
            (t for t in all_themes if t["likes"]), key=lambda t: (-t["likes"], t["theme"])
        )
        criticised = sorted(
            (t for t in all_themes if t["complaints"]), key=lambda t: (-t["complaints"], t["theme"])
        )
        liked, criticised = liked[:MAX_THEMES], criticised[:MAX_THEMES]
        sub_rows = sum(t["rows"] for t in all_themes)
        likes = sum(t["likes"] for t in all_themes)
        complaints = sum(t["complaints"] for t in all_themes)
        totals = {k: sum(t[k] for t in all_themes) for k in COMPLAINT_FIELDS.values()}
        weight = engine.base.weights[key]  # renormalised to 100 over the subsystems present
        entries.append(
            {
                "key": key,
                "weight": round(weight, 1),
                "rows": sub_rows,
                "likes": likes,
                "complaints": complaints,
                "themes": len(by_theme),
                "liked": {
                    "narration": liked_narration(liked, likes, sub_rows, len(by_theme), rules),
                    "themes": [
                        {
                            **{k: t[k] for k in ("theme", "domain", "rows", "likes")},
                            "quotes": _pick_quotes(t["_liked"]) if detail else [],
                        }
                        for t in liked
                    ],
                },
                "criticised": {
                    "narration": criticised_narration(
                        criticised, complaints, sub_rows, totals, rules
                    ),
                    "themes": [
                        {
                            **{
                                k: t[k]
                                for k in (
                                    "theme",
                                    "domain",
                                    "rows",
                                    "complaints",
                                    "defects",
                                    "difficultToUse",
                                    "wants",
                                )
                            },
                            "quotes": _pick_quotes(t["_criticised"]) if detail else [],
                        }
                        for t in criticised
                    ],
                },
                "market": [r for r in market_rows if r["subsystem"] == key],
            }
        )
    basis = (
        "labels given in the feedback workbook"
        if labels == "given"
        else "labels given in the workbook plus the assistant's gap labels (D-056)"
    )
    return {
        "vehicle": vehicle,
        "market": market,
        "country": country,
        "verbatims": verbatims,
        "platform": profile.platform if profile else None,
        "absent": [{"key": k, "name": engine.names[k], "rows": absent_rows[k]} for k in absent],
        "absentNote": profile.note if profile else None,
        "rows": rows,
        "unassignedRows": unassigned,
        "rowsSource": f"classification rows with a canonical level-2 theme, {basis}; theme to "
        "subsystem by config/cpm/theme_subsystem_map.yaml (an assumption)"
        if rows
        else "no classified verbatims for this vehicle in this scope",
        "subsystems": entries,
    }


def summary_rows(view: dict[str, Any]) -> list[dict[str, Any]]:
    """One compact row per subsystem of a view, for prompts."""
    names = subsystem_names()
    return [
        {
            "subsystem": s["key"],
            "name": names[s["key"]],
            "weight": s["weight"],
            **{k: s[k] for k in ("rows", "likes", "complaints", "themes")},
            "top_criticised": [
                f"{t['theme']} ({t['complaints']})" for t in s["criticised"]["themes"][:3]
            ],
            "top_liked": [f"{t['theme']} ({t['likes']})" for t in s["liked"]["themes"][:2]],
        }
        for s in view["subsystems"]
    ]


def subsystems_of_refs(session: Session, refs: list[str]) -> dict[str, int]:
    """Subsystems the cited evidence sits in, with the number of references per subsystem:
    verbatims through their labels, findings and requirements through their themes, market rows
    and external evidence by their own subsystems. Study metrics, catalogue items and sales carry
    no theme."""
    themes, _ = load_theme_map()
    market = {r["evidence_ref"]: r["subsystem"] for r in load_market_rows()}
    verbatims = [r.split(":", 1)[1] for r in refs if r.startswith("verbatim:")]
    findings = [r for r in refs if r.startswith("FND-")]
    requirements = [r for r in refs if r.startswith("REQ-")]
    hits: Counter = Counter(market[r] for r in refs if r in market)
    external = [r.split(":", 1)[1] for r in refs if r.startswith("external:")]
    if external:
        for subsystems in session.scalars(
            select(ExternalEvidence.subsystems).where(ExternalEvidence.id.in_(external))
        ):
            hits.update(subsystems)
    if verbatims:
        labelled = session.execute(
            select(VerbatimClassification.verbatim_id, TaxonomyLevel2.name)
            .join(TaxonomyLevel2, TaxonomyLevel2.id == VerbatimClassification.level2_id)
            .where(
                VerbatimClassification.verbatim_id.in_(verbatims),
                VerbatimClassification.status == "canonical",
            )
        ).all()
        hits.update(s for _, s in {(vid, themes.get(name)) for vid, name in labelled} if s)
    by_requirement: dict[str, set[str]] = {}
    if requirements:
        for rid, fid in session.execute(
            select(RequirementFinding.requirement_id, RequirementFinding.finding_id).where(
                RequirementFinding.requirement_id.in_(requirements),
                RequirementFinding.role != "context",
            )
        ):
            by_requirement.setdefault(rid, set()).add(fid)
    wanted = set(findings) | {f for fs in by_requirement.values() for f in fs}
    finding_subsystem: dict[str, str] = {}
    if wanted:
        for fid, name in session.execute(
            select(Finding.id, TaxonomyLevel2.name)
            .join(TaxonomyLevel2, TaxonomyLevel2.id == Finding.theme_level2_id)
            .where(Finding.id.in_(wanted))
        ):
            if name in themes:
                finding_subsystem[fid] = themes[name]
    hits.update(finding_subsystem[f] for f in findings if f in finding_subsystem)
    for fids in by_requirement.values():
        hits.update({finding_subsystem[f] for f in fids if f in finding_subsystem})
    names = subsystem_names()
    return {k: hits[k] for k in names if hits[k]}

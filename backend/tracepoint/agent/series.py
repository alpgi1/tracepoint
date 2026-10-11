"""Analysis of one series across its regions: what to change, for whom, and when.

The situation analysis (``analysis.py``) looks at one vehicle in one market. A product manager
decides for a series: whether a change is worth making for every market, for one region only, or
not before the next generation. This module

* puts the regions side by side in one comparison pack, computed without a model and per 100
  verbatims, so that a region with 3,600 verbatims and one with 200 can be compared;
* lets the analyst answer the same questions for every topic (where do customers raise it, do
  the study scores agree, what does the market of the region show, what does the car offer
  today, how large is the fix) and decide: all markets now, one region now, next generation,
  keep, or no action;
* checks the answer: every topic names every region, a regional decision cites evidence from
  that region, and effort comes from the CPM engine, never from the model.

Nothing here reaches outside. The agent reads the evidence store through the tools; the external
sources were fetched and checked before (``ingest/external.py``).
"""

from __future__ import annotations

import re
from collections import Counter
from types import SimpleNamespace
from typing import Any, Literal

from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.agent.analysis import (
    MAX_CHANGES,
    MAX_REFS,
    ProposedChange,
    effort_brief,
    effort_of_proposals,
    effort_text,
    package_lines,
    warnings_of,
)
from tracepoint.agent.loop import collect_refs, run_agent
from tracepoint.core.audit import record_event
from tracepoint.db.models import (
    Country,
    ExternalEvidence,
    Finding,
    Market,
    Requirement,
    Run,
    SalesVolume,
    StudyMetric,
    TaxonomyLevel2,
    Vehicle,
    Verbatim,
    VerbatimClassification,
)
from tracepoint.effort.store import engine_and_samples
from tracepoint.effort.subsystems import (
    external_rows,
    subsystem_names,
    subsystems_of_refs,
    theme_subsystem,
)
from tracepoint.llm.gateway import LlmGateway
from tracepoint.reports.baseline import COMPLAINT_TYPES, LIKE_TYPE

PACK_VERSION = "series-pack-v1"
PROMPT_VERSION = "series-analysis-v1"
ACTOR = "agent:series-analyst"

REMAINDER = "RoW"  # not a market but what is left over: its countries stand on their own
MIN_COUNTRY_VERBATIMS = 50  # from here a country of the remainder is a region
TOP_THEMES = 10  # per region, into the comparison
MIN_THEME_ROWS = 3
MAX_EXTERNAL = 14  # market rows per region in the pack; the tool returns the rest
MAX_TOPICS = 10
MAX_BULLETS = 6
# what sets a region apart: a study attribute a quarter of the ranking weaker or stronger than
# in the other regions, a complaint theme at twice the rate of any other region
APART_RANK_GAP = 0.25
APART_WEAK = 1 / 3  # "weaker here" also has to be weak here: in the weakest third
APART_RATE_FACTOR = 2.0
APART_MIN_ROWS = 5
APART_ITEMS = 6
MUST_COVER = 3  # per region and kind, the largest differences an answer has to deal with


# --------------------------------------------------------------------------------------------
# The comparison pack (no model)
# --------------------------------------------------------------------------------------------


def series_regions(session: Session, vehicle_code: str) -> list[dict[str, Any]]:
    """The regions in which a series holds evidence, largest sales first: one per market, and
    for the remainder market one per country with enough verbatims."""
    lead = session.get(Vehicle, vehicle_code)
    if lead is None:
        raise ValueError(f"unknown vehicle {vehicle_code}")
    members = [
        v.code for v in session.scalars(select(Vehicle).where(Vehicle.series == lead.series))
    ]
    verbatims: Counter = Counter()
    for vehicle, market, country, n in session.execute(
        select(Verbatim.vehicle_code, Verbatim.market_code, Verbatim.country_code, func.count())
        .where(Verbatim.vehicle_code.in_(members))
        .group_by(Verbatim.vehicle_code, Verbatim.market_code, Verbatim.country_code)
    ):
        verbatims[vehicle, market, country] = n
    studied = set(
        session.execute(
            select(StudyMetric.vehicle_code, StudyMetric.market_code)
            .where(StudyMetric.vehicle_code.in_(members))
            .distinct()
        ).all()
    )
    sales = {
        (r.market_code, r.year): r
        for r in session.scalars(select(SalesVolume).where(SalesVolume.vehicle_code.in_(members)))
    }
    names = {m.code: m.name for m in session.scalars(select(Market))}
    names |= {c.code: c.name for c in session.scalars(select(Country))}
    regions = []
    for vehicle, market in sorted({(v, m) for v, m, _ in verbatims} | studied):
        by_country = {c: n for (v, m, c), n in verbatims.items() if (v, m) == (vehicle, market)}
        if market == REMAINDER:
            picks = [(c, c) for c, n in by_country.items() if n >= MIN_COUNTRY_VERBATIMS]
        else:
            picks = [(market, None)]
        for label, country in picks:
            actual, plan = sales.get((market, 2025)), sales.get((market, 2030))
            regions.append(
                {
                    "label": label,
                    "name": names.get(label, label),
                    "vehicle": vehicle,
                    "market": market,
                    "country": country,
                    "verbatims": by_country[country] if country else sum(by_country.values()),
                    "countries": {country: by_country[country]} if country else by_country,
                    "sales_2025": actual.units if actual else None,
                    "sales_2030": plan.units if plan else None,
                    "sales_ref": f"sales:{actual.id}" if actual else None,
                    "sales_of": f"whole {market} market" if country else None,
                }
            )
    regions.sort(key=lambda r: (r["country"] is not None, -(r["sales_2025"] or 0), r["label"]))
    return regions


def _customer_rows(session: Session, region: dict[str, Any]) -> tuple[Counter, Counter]:
    """(complaint rows, like rows) per level-2 theme of a region, on the baseline's counting
    basis: every classification row with a theme, the assistant's gap labels included."""
    stmt = (
        select(TaxonomyLevel2.name, VerbatimClassification.feedback_type, func.count())
        .join(Verbatim, Verbatim.id == VerbatimClassification.verbatim_id)
        .join(TaxonomyLevel2, TaxonomyLevel2.id == VerbatimClassification.level2_id)
        .where(Verbatim.vehicle_code == region["vehicle"], Verbatim.market_code == region["market"])
        .group_by(TaxonomyLevel2.name, VerbatimClassification.feedback_type)
    )
    if region["country"]:
        stmt = stmt.where(Verbatim.country_code == region["country"])
    complaints: Counter = Counter()
    likes: Counter = Counter()
    for theme, kind, n in session.execute(stmt):
        if kind in COMPLAINT_TYPES:
            complaints[theme] += n
        elif kind == LIKE_TYPE:
            likes[theme] += n
    return complaints, likes


def _per_100(n: int, verbatims: int) -> float | None:
    return round(100 * n / verbatims, 1) if verbatims else None


def _external_for(
    session: Session, region: dict[str, Any], markets: set[str]
) -> list[dict[str, Any]]:
    """What the pack shows of a region's external evidence: every row about the vehicle, then
    the confirmed rows that hold for this region and for no other region of the series (what
    makes it different), then the confirmed rows more than one institution supports. Worldwide
    rows, unconfirmed rows and the EPA tables stay with the tool."""
    if region["country"]:
        return []  # the lists hold nothing for single countries of the remainder
    rows = [
        r
        for r in external_rows(session, region["market"], region["vehicle"])
        if region["market"] in r["regions"] and r["kind"] != "official_spec"
    ]
    confirmed = [r for r in rows if r["verification"] in ("confirmed", "computed")]
    about = [r for r in rows if region["vehicle"] in r["vehicles"]]
    only_here = [
        r
        for r in confirmed
        if r not in about and not set(r["regions"]) & (markets - {region["market"]})
    ]
    shared = [r for r in confirmed if r not in about + only_here and r["level"] != "weak"]
    picked = (about + only_here + shared)[: len(about) + MAX_EXTERNAL]
    return [
        {
            k: r[k]
            for k in (
                "evidence_ref",
                "kind",
                "statement",
                "subsystems",
                "topic",
                "level",
                "basis",
                "verification",
                "contradiction",
            )
        }
        | {
            "about_vehicle": r in about,
            "only_this_region": r in only_here,
            "source": r["source"]["origin"],
            "date": r["source"]["date"],
        }
        for r in picked
    ]


def _nth(n: int) -> str:
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def _position(cell: dict[str, Any]) -> str:
    """Where an attribute stands among the attributes of its region, in words that cannot be
    read the wrong way round."""
    return f"{_nth(cell['rank_from_bottom'])} weakest of {cell['of']}"


def _apart(
    regions: list[dict[str, Any]], themes: list[dict[str, Any]], study: list[dict[str, Any]]
) -> dict[str, dict[str, list[Any]]]:
    """What sets each region apart from the others: study attributes that are weak there (in
    the weakest third) and clearly weaker than elsewhere, attributes clearly stronger there,
    complaint themes raised there at twice the rate of any other region, and market topics
    stored for that region alone. Each item carries the reference an answer has to cite to
    count as having dealt with it. A regional decision starts from a difference; this is where
    the differences are."""
    out: dict[str, dict[str, list[Any]]] = {}
    with_text = [r["label"] for r in regions if r["verbatims"]]
    for r in regions:
        label = r["label"]
        gaps = []
        for a in study:
            here = a["regions"].get(label)
            others = {k: c for k, c in a["regions"].items() if k != label}
            if not here or not others:
                continue
            share = here["rank_from_bottom"] / here["of"]
            elsewhere = sum(c["rank_from_bottom"] / c["of"] for c in others.values()) / len(others)
            text = (
                f"{a['attribute']}: {_position(here)} (score {here['score']}) against "
                + ", ".join(f"{k} {_position(c)}" for k, c in others.items())
            )
            gaps.append((elsewhere - share, share, {"text": text, "ref": here["evidence_ref"]}))
        # the weakest first: what is at the bottom here and not elsewhere matters most
        weaker = [
            i
            for gap, share, i in sorted(gaps, key=lambda g: g[1])
            if gap >= APART_RANK_GAP and share <= APART_WEAK
        ]
        stronger = [i for gap, _, i in sorted(gaps, key=lambda g: g[0]) if gap <= -APART_RANK_GAP]
        raised = []
        for t in themes:
            here = t["regions"][label]
            rest = [t["regions"][k]["per_100"] for k in with_text if k != label]
            if here["rows"] < APART_MIN_ROWS or not rest:
                continue
            if here["per_100"] >= APART_RATE_FACTOR * max(rest):
                text = (
                    f"{t['theme']}: {here['per_100']} per 100 ({here['rows']} rows), highest "
                    f"elsewhere {max(rest)}"
                )
                raised.append((here["per_100"], {"text": text, "ref": here["finding"]}))
        raised.sort(key=lambda x: -x[0])
        topics = Counter(e["topic"] for e in r["external"] if e["only_this_region"] and e["topic"])
        out[label] = {
            "study_weaker_here": weaker[:APART_ITEMS],
            "study_stronger_here": stronger[:APART_ITEMS],
            "complaints_raised_here": [i for _, i in raised[:APART_ITEMS]],
            "market_topics_only_here": [f"{t} ({n} row{'s' * (n > 1)})" for t, n in topics.items()],
        }
    return out


def build_series_pack(session: Session, vehicle_code: str) -> dict[str, Any]:
    """The regions of a series side by side: customer rows per subsystem and theme, per 100
    verbatims; study scores with their rank inside each region; external evidence; sales."""
    lead = session.get(Vehicle, vehicle_code)
    regions = series_regions(session, vehicle_code)
    if not regions:
        raise ValueError(f"no evidence for the series of {vehicle_code}")
    labels = [r["label"] for r in regions]
    names = subsystem_names()
    rows = {r["label"]: _customer_rows(session, r) for r in regions}
    by_label = {r["label"]: r for r in regions}

    def cell(label: str, n: int) -> dict[str, Any]:
        return {"rows": n, "per_100": _per_100(n, by_label[label]["verbatims"])}

    for r in regions:
        complaints, likes = rows[r["label"]]
        r["complaint_rows"], r["like_rows"] = sum(complaints.values()), sum(likes.values())
        scopes = (Finding.vehicle_code == r["vehicle"], Finding.market_code == r["market"])
        r["findings"] = session.scalar(select(func.count()).select_from(Finding).where(*scopes))
        r["requirements"] = session.scalar(
            select(func.count())
            .select_from(Requirement)
            .where(Requirement.vehicle_code == r["vehicle"], Requirement.market_code == r["market"])
        )
        r["external"] = _external_for(session, r, {x["market"] for x in regions})

    # findings carry the reference of a theme in a market
    finding_of: dict[tuple[str, str, str], str] = {}
    for fid, vehicle, market, theme in session.execute(
        select(Finding.id, Finding.vehicle_code, Finding.market_code, TaxonomyLevel2.name)
        .join(TaxonomyLevel2, TaxonomyLevel2.id == Finding.theme_level2_id)
        .where(Finding.kind.in_(("recurring_complaint", "unmet_need")))
    ):
        finding_of.setdefault((vehicle, market, theme), fid)

    subsystems = []
    for key, name in names.items():
        cells = {}
        for label in labels:
            complaints, likes = rows[label]
            cells[label] = cell(
                label, sum(n for t, n in complaints.items() if theme_subsystem(t) == key)
            )
            cells[label]["likes"] = sum(n for t, n in likes.items() if theme_subsystem(t) == key)
        if any(c["rows"] or c["likes"] for c in cells.values()):
            subsystems.append({"subsystem": key, "name": name, "regions": cells})

    def top(index: int) -> list[str]:
        picked: dict[str, int] = {}
        for label in labels:
            for theme, n in rows[label][index].most_common(TOP_THEMES):
                if n >= MIN_THEME_ROWS:
                    picked[theme] = picked.get(theme, 0) + n
        return sorted(picked, key=lambda t: -sum(rows[label][index][t] for label in labels))

    themes = [
        {
            "theme": theme,
            "subsystem": theme_subsystem(theme),
            "regions": {
                label: cell(label, rows[label][0][theme])
                | {
                    "finding": finding_of.get(
                        (by_label[label]["vehicle"], by_label[label]["market"], theme)
                    )
                }
                for label in labels
            },
        }
        for theme in top(0)
    ]
    strengths = [
        {
            "theme": theme,
            "subsystem": theme_subsystem(theme),
            "regions": {label: cell(label, rows[label][1][theme]) for label in labels},
        }
        for theme in top(1)
    ]

    # study scores: the rank inside a region compares across studies, the score only inside one
    metrics: dict[str, dict[str, dict[str, Any]]] = {}
    for r in regions:
        if r["country"]:
            continue
        own = [
            m
            for m in session.scalars(
                select(StudyMetric).where(
                    StudyMetric.vehicle_code == r["vehicle"], StudyMetric.market_code == r["market"]
                )
            )
            if m.mean is not None
        ]
        r["study"] = own[0].study if own else None
        for rank, m in enumerate(sorted(own, key=lambda m: m.mean), 1):
            metrics.setdefault(m.attribute_key, {"attribute": m.attribute_raw})[r["label"]] = {
                "score": round(m.mean, 2),
                "scale": "1-10" if m.stat_kind == "mean" else "1-7",
                "rank_from_bottom": rank,
                "of": len(own),
                "evidence_ref": f"metric:{m.id}",
            }
    study = [
        {"key": key, "attribute": row.pop("attribute"), "regions": row}
        for key, row in metrics.items()
        if len(row) > 2  # the attribute and at least two regions
    ]
    study.sort(key=lambda a: min(c["rank_from_bottom"] / c["of"] for c in a["regions"].values()))

    return {
        "pack": PACK_VERSION,
        "series": lead.series,
        "lead_vehicle": lead.code,
        "vehicles": [
            {"code": v.code, "name": v.name, "notes": v.notes}
            for v in session.scalars(
                select(Vehicle).where(Vehicle.series == lead.series).order_by(Vehicle.code)
            )
        ],
        "regions": regions,
        "subsystems": subsystems,
        "complaint_themes": themes,
        "strength_themes": strengths,
        "study": study,
        "apart": _apart(regions, themes, study),
        "requirements": [
            {
                "id": q.id,
                "market": q.market_code,
                "title": q.title,
                "horizon": q.horizon,
                "status": q.status,
            }
            for q in session.scalars(
                select(Requirement)
                .where(
                    Requirement.vehicle_code.in_({r["vehicle"] for r in regions}),
                    Requirement.status != "withdrawn",
                )
                .order_by(Requirement.id)
            )
        ],
    }


def render_series_pack(pack: dict[str, Any]) -> str:
    """The pack as the model reads it."""
    regions = pack["regions"]
    labels = [r["label"] for r in regions]
    head = "| " + " | ".join(labels) + " |"
    rule = "|---" * (len(labels) + 1) + "|"

    def cells(row: dict[str, Any], extra: str = "") -> str:
        out = []
        for label in labels:
            c = row["regions"][label]
            if c["per_100"] is None:
                out.append("no text")
            else:
                text = f"{c['per_100']} ({c['rows']})"
                if extra == "likes":
                    text += f" / {c['likes']} likes"
                if extra == "finding" and c["finding"]:
                    text += f" `{c['finding']}`"
                out.append(text)
        return " | ".join(out)

    lines = [
        f"# Comparison pack – BMW {pack['series']} ({pack['pack']})",
        "",
        "Vehicles: "
        + "; ".join(f"{v['code']} {v['name']}" for v in pack["vehicles"])
        + ". Effort is computed on the "
        + pack["lead_vehicle"]
        + ".",
        "",
        "## Regions",
    ]
    for r in regions:
        scope = f"vehicle={r['vehicle']}, market={r['market']}" + (
            f", country={r['country']}" if r["country"] else ""
        )
        sales = (
            f"sales 2025 {r['sales_2025']:,}, plan 2030 {r['sales_2030']:,}"
            + (f" ({r['sales_of']})" if r["sales_of"] else "")
            + f" [{r['sales_ref']}]"
            if r["sales_2025"] is not None
            else "no sales figure"
        )
        if r["verbatims"]:
            split = ", ".join(
                f"{c} {n}" for c, n in sorted(r["countries"].items(), key=lambda x: -x[1])
            )
            text = (
                f"{r['verbatims']:,} verbatims ({split}), {r['complaint_rows']} complaint rows, "
                f"{r['like_rows']} like rows"
            )
        else:
            text = "no verbatims: judged from study scores and external rows"
        lines.append(
            f"- **{r['label']}** {r['name']} (tools: {scope}): {text}; "
            f"study {r.get('study') or 'none'}; {r['findings']} findings, "
            f"{r['requirements']} requirements; {sales}."
        )
    lines += [
        "",
        "## Complaints per subsystem: rows per 100 verbatims (rows) / likes",
        "| Subsystem " + head,
        rule,
    ]
    lines += [
        f"| {s['name']} `{s['subsystem']}` | {cells(s, 'likes')} |" for s in pack["subsystems"]
    ]
    lines += [
        "",
        "## Complaint themes: rows per 100 verbatims (rows) and the finding to cite",
        "| Theme (subsystem) " + head,
        rule,
    ]
    lines += [
        f"| {t['theme']} ({t['subsystem'] or 'none'}) | {cells(t, 'finding')} |"
        for t in pack["complaint_themes"]
    ]
    lines += [
        "",
        "## Liked themes: rows per 100 verbatims (rows)",
        "| Theme (subsystem) " + head,
        rule,
    ]
    lines += [
        f"| {t['theme']} ({t['subsystem'] or 'none'}) | {cells(t)} |"
        for t in pack["strength_themes"]
    ]
    studied = [r["label"] for r in regions if r.get("study")]
    lines += [
        "",
        "## Study scores: the score, and where the attribute stands among the attributes of "
        "that region ('3rd weakest of 37' is near the bottom, '35th weakest of 37' near the "
        "top). Compare scores only inside one study; across studies compare the position.",
        "Studies: "
        + ", ".join(f"{r['label']} {r['study']}" for r in regions if r.get("study"))
        + ".",
        "| Attribute | " + " | ".join(studied) + " |",
        "|---" * (len(studied) + 1) + "|",
    ]
    for a in pack["study"]:
        row = []
        for label in studied:
            c = a["regions"].get(label)
            row.append(f"{c['score']} ({_position(c)}) [{c['evidence_ref']}]" if c else "–")
        lines.append(f"| {a['attribute']} | " + " | ".join(row) + " |")
    lines += [
        "",
        "## What sets each region apart (computed from the tables above and the external rows)",
    ]
    for label in labels:
        apart = pack["apart"][label]
        lines.append(f"- **{label}**:" + ("" if any(apart.values()) else " nothing stands out."))
        for title, key in (
            ("study attributes weak here and clearly weaker than elsewhere", "study_weaker_here"),
            ("study attributes clearly stronger here than elsewhere", "study_stronger_here"),
            (
                "complaints raised here at twice the rate of any other region",
                "complaints_raised_here",
            ),
            ("market topics stored for this region alone", "market_topics_only_here"),
        ):
            if apart[key]:
                items = [i if isinstance(i, str) else i["text"] for i in apart[key]]
                lines.append(f"  - {title}: " + "; ".join(items) + ".")
    lines += ["", "## External evidence per region (more with get_external_evidence)"]
    for r in regions:
        if r["country"]:
            lines.append(f"- **{r['label']}**: nothing stored for this country alone.")
            continue
        lines.append(f"- **{r['label']}**:" + ("" if r["external"] else " none stored."))
        for e in r["external"]:
            lines.append(
                f"  - [{'about the ' + r['vehicle'] if e['about_vehicle'] else e['kind']}"
                f"{', this region only' if e['only_this_region'] else ''}, level "
                f"{e['level']}, {e['basis']}, {e['verification']}] {e['statement']} "
                f"({e['source']}, {e['date']}; {', '.join(e['subsystems']) or 'no subsystem'}) "
                f"[{e['evidence_ref']}]"
            )
            if e["contradiction"]:
                c = e["contradiction"]
                lines.append(f"    - contradiction, for: {c['for']} Against: {c['against']}")
    lines += ["", "## Requirements that exist (their stored change profiles give the effort)"]
    lines += [
        f"- `{q['id']}` ({q['market']}, {q['horizon']}, {q['status']}): {q['title']}"
        for q in pack["requirements"]
    ] or ["- None."]
    return "\n".join(lines)


# --------------------------------------------------------------------------------------------
# The answer
# --------------------------------------------------------------------------------------------

Decision = Literal[
    "change_now_all_markets", "change_now_regional", "next_generation", "keep", "no_action"
]
DECISION_TEXT = {
    "change_now_all_markets": "Change now, all markets",
    "change_now_regional": "Change now, regional",
    "next_generation": "Next generation",
    "keep": "Keep",
    "no_action": "No action",
}


class RegionSignal(BaseModel):
    region: str = Field(description="Region label of the pack, e.g. US")
    customers: str = Field(
        description="What customers of the region say, in one sentence with the count or rate "
        "or score; 'no customer text' or 'no signal' where that is the case"
    )
    market: str | None = Field(
        description="What the market, rivals or testers of the region show, in one sentence "
        "from external rows; null if no row bears on it"
    )
    weight: Literal["strong", "moderate", "weak", "none"] = Field(
        description="How much the topic matters in this region by the evidence"
    )


class Topic(BaseModel):
    title: str = Field(description="The topic in the customer's words, a few words")
    regions: list[RegionSignal] = Field(description="One entry per region of the pack")
    our_offer: str | None = Field(
        description="What the car offers today on this topic (catalogue, official figures, "
        "tests), one sentence; null if the store does not say"
    )
    rivals: str | None = Field(
        description="What rivals offer, one sentence from external rows only; null if the "
        "store holds nothing about rivals on this topic"
    )
    decision: Decision
    target_regions: list[str] = Field(
        description="Region labels the change is for; all of them for change_now_all_markets "
        "and next_generation, empty for keep and no_action"
    )
    action: str = Field(description="The solution in one or two sentences, customer-facing")
    why: str = Field(
        description="Why this decision and not the nearest alternative (all markets or one "
        "region, now or next generation), one or two sentences"
    )
    related_requirement: str | None = Field(
        description="Id of an existing requirement (REQ-…) that covers the action, or null"
    )
    effort_changes: list[ProposedChange] | None = Field(
        max_length=MAX_CHANGES,
        description="Change profile for the effort engine; null when related_requirement "
        "covers the action, and for keep and no_action",
    )
    confidence: Literal["high", "medium", "low"]
    evidence_refs: list[str] = Field(min_length=1, max_length=MAX_REFS)

    # what the effort engine asks of a proposal, read from the decision instead of asked twice
    @property
    def horizon(self) -> str:
        return "H2" if self.decision == "next_generation" else "H1"

    @property
    def changes_vehicle(self) -> bool:
        return self.decision not in ("keep", "no_action")


class RegionExpectation(BaseModel):
    region: str
    expects: list[str] = Field(
        max_length=MAX_BULLETS,
        description="What buyers of the region expect of this series, most important first, "
        "one short sentence each with its number",
    )
    evidence_refs: list[str] = Field(min_length=1, max_length=MAX_REFS)


class RegionalPack(BaseModel):
    region: str
    items: list[str] = Field(max_length=MAX_BULLETS)


class OptimumVersion(BaseModel):
    every_market: list[str] = Field(max_length=MAX_BULLETS, description="Changes for all")
    regional: list[RegionalPack] = Field(description="Only regions that get something of their own")
    next_generation: list[str] = Field(max_length=MAX_BULLETS)
    keep: list[str] = Field(max_length=MAX_BULLETS)


class SeriesAnalysis(BaseModel):
    headline: str = Field(description="One sentence")
    answer: str = Field(
        description="Three to five sentences: what to develop now and for whom, what to leave "
        "to the next generation, what to keep"
    )
    regions: list[RegionExpectation] = Field(description="One entry per region of the pack")
    topics: list[Topic] = Field(max_length=MAX_TOPICS, description="Most important first")
    optimum_version: OptimumVersion
    unknowns: list[str] = Field(
        max_length=MAX_BULLETS, description="What the stored evidence cannot answer"
    )


SYSTEM_PROMPT = """You are the series analyst of Tracepoint, a customer-requirements workbench for BMW product managers. You look at one BMW series across its regions and answer one question: what should be changed, for which regions, now or with the next generation. You work from the stored evidence only; you cannot look anything up outside it.

How to work
1. The user message holds the comparison pack: the regions side by side, customer rows per 100 verbatims so that a large and a small region can be compared, study scores, external evidence, sales. Read it first.
2. Pick the topics that decide something, at most ten, in the customer's words: "setting the climate", not "thermal subsystem". Several small themes that one piece of work would fix are one topic.
   Start from two sides: what is large in every region, and what sets one region apart (the section of that name in the pack). Go through every region's list there. A weakness that only one region shows, and that the market rows of that region confirm, is the first candidate for a regional change. Each of the first three weak study attributes and of the first three complaints raised there is dealt with: in a topic, or in that region's expectations with what follows from it, also if that is "watch, no change"; cite its reference there. An answer that passes one over is sent back.
3. For each topic answer these questions in this order. Drill down with the tools where the pack does not answer one.
   a. Where do customers raise it? Compare the rate per 100 verbatims and the rows, region by region. Fewer than ten rows in a region is a hint, not a finding.
   b. Do the study scores agree? Regions of one study can be compared by score; across studies compare the position ("3rd weakest of 37" is a weakness, "30th weakest of 37" a strength).
   c. What does the market of each region show: what is sold there, what buyers say they want, what rivals offer, what ratings or rules reward (get_external_evidence with the region's market and the subsystem or topic)? Does it point the same way as the customers, or the other way?
   d. What does the car offer today? get_equipment searches the German price list by a word of the item name (query: "Klima", "Sitzheizung", "Head-Up", "Parking"); the external rows about the vehicle and search_documents give the tests and reviews.
   e. What would fix it and how large is that change (the effort model below; get_requirements and get_effort for requirements that exist)?
   f. Decide.
4. Stop calling tools once another call would not change a decision. Then answer in the JSON schema.

The decision, one per topic
- change_now_all_markets: the need shows in two or more of the large regions, or the fix is one piece of software or hardware every market gets anyway.
- change_now_regional: the need is clearly stronger in the target regions than elsewhere (by customers, or by the market where a region has no customer text) and the fix can be offered there alone: software, equipment, a package, a regional variant. A regional variant has to be built and kept alive; say in why what makes the region worth it (its rate, its sales, what its market does).
- next_generation: the fix is a major revision or a new generation by the effort engine (a battery, a platform, the body), or the current car cannot carry it. If a small step can be taken before, make it a topic of its own. A next_generation topic whose change profile comes out as an adaptation is sent back: either it can be done now, or why names what the current car cannot carry, or the profile understates the change.
- keep: a strength to protect. Name what must not be lost when other topics change.
- no_action: the signal is weak, contradicted or outside the vehicle. Say what would change the call.
The change_now decisions are horizon H1, next_generation is H2. keep and no_action change nothing on the vehicle and carry no change profile.

Regions
- Every topic lists every region of the pack once, also where nothing shows. Write "no signal" or "no customer text for this region" there and set weight none.
- A regional decision cites evidence from each of its target regions; without it the answer is sent back. Evidence of a region is a verbatim, finding, study score, requirement or external row of that region.
- A region without verbatims is judged from its study scores and its market rows. Say so, and keep confidence at medium or below unless both agree.
- Tools take vehicle, market and country as each region line of the pack names them. Where a theme has no finding in a region, read the verbatims (get_verbatims_by_theme) and cite those. For the market side of a regional topic, read the rows of that region (get_external_evidence with its market and the topic or subsystem).
- Sales decide a tie between regions. They never make a need.

Evidence rules
- evidence_refs holds the references a topic or a region's expectations rest on, copied exactly as you received them: evidence_ref values (verbatim:…, metric:…, equipment:…, sales:…, document:…, market:…, external:…) and the ids of findings and requirements (FND-…, REQ-…). A reference you were not given is rejected. The text fields carry no reference ids.
- Every number comes from the pack or a tool result. Use no figure from memory.
- Customer rows in a small region carry less: five rows are not two hundred. Give the count with the rate.
- External rows carry a level (weak one institution, medium two, strong three or more), a basis (evidence or assumption) and a verification. A weak row, an assumption or a row that is not confirmed or computed never carries a decision alone. Report both sides of a contradiction. A row for the regions Global only describes no single market.
- Rows about the vehicle from testers, NHTSA or the EPA are third-party statements, not BMW customer feedback.

Rivals and our offer
- rivals holds only what external rows say about other makers. Name no rival, model or feature from memory. Where the store holds nothing on rivals for a topic, write null; a missing comparison is an unknown, list it there.
- our_offer comes from the catalogue (the German price list: what the model line offers, not what is standard in a region), official figures and tests.

Scope
- In scope: what customers require of the product. Out of scope: regulation as a requirement, engineering specifications, pricing and business case, dealer and finance topics.
- These are proposals. The product manager decides.

Effort
- Effort is the share of the development effort of a new vehicle generation, computed by the CPM engine. It is never money and every model input is an uncalibrated assumption. You write no effort figure.
- A topic that an existing requirement covers names it in related_requirement and leaves effort_changes null: the stored profile is used. Name only requirements listed in the pack.
- Any other topic that changes the vehicle gives effort_changes, at most eight entries, one per subsystem where the change starts: the subsystem key, own_impact (share of that subsystem's design redone, set by comparison with the reference changes in the user message, and the comparison named in why), the layer, carryover, why in one sentence, and portfolio_terms (catalogue search terms).
- Where a change starts is checked against the evidence you cite, and own_impact against the reference changes; a profile outside them is sent back.
- A change_now topic whose profile comes to a major revision or more is sent back: make it next_generation, or split off the small step.

Write plainly and briefly, in English: a product manager reads the whole answer in five minutes. One or two sentences per field, with the numbers that carry it. The text fields hold no reference ids and say nothing about ids, tools, searches, "the pack" or what was retrieved: the reader sees none of that. Where the store holds nothing, write null (our_offer, rivals, market) or "not stored". References go in evidence_refs only."""


# --------------------------------------------------------------------------------------------
# Checks, run, output
# --------------------------------------------------------------------------------------------


def regions_of_refs(
    session: Session, refs: list[str], regions: list[dict[str, Any]]
) -> dict[str, int]:
    """How many of the cited references belong to each region: verbatims by their country and
    market, findings, study scores and requirements by their market, external rows by the
    regions they hold for. Worldwide rows and the catalogue belong to no region."""
    of_market: dict[tuple[str, str], list[str]] = {}
    of_country = {r["country"]: r["label"] for r in regions if r["country"]}
    for r in regions:
        of_market.setdefault((r["vehicle"], r["market"]), []).append(r["label"])
    by_market: dict[str, list[str]] = {}
    for (_, market), labels in of_market.items():
        by_market.setdefault(market, []).extend(labels)
    hits: Counter = Counter()

    def ids(prefix: str) -> list[str]:
        return [r.split(":", 1)[1] for r in refs if r.startswith(prefix)]

    if found := ids("verbatim:"):
        for vehicle, market, country in session.execute(
            select(Verbatim.vehicle_code, Verbatim.market_code, Verbatim.country_code).where(
                Verbatim.id.in_(found)
            )
        ):
            if country in of_country:
                hits[of_country[country]] += 1
            elif market != REMAINDER:
                hits.update(of_market.get((vehicle, market), []))
    for model, found in (
        (Finding, [r for r in refs if r.startswith("FND-")]),
        (Requirement, [r for r in refs if r.startswith("REQ-")]),
        (StudyMetric, ids("metric:")),
    ):
        if found:
            for vehicle, market in session.execute(
                select(model.vehicle_code, model.market_code).where(model.id.in_(found))
            ):
                hits.update(of_market.get((vehicle, market), []))
    if found := ids("external:"):
        for held in session.scalars(
            select(ExternalEvidence.regions).where(ExternalEvidence.id.in_(found))
        ):
            for market in held:
                hits.update(by_market.get(market, []))
    return {r["label"]: hits[r["label"]] for r in regions if hits[r["label"]]}


_REF = (
    r"(?:\b(?:FND|REQ|EXT|MKT|MET|SAL)-[\w-]+"
    r"|\b(?:verbatim|metric|external|market|document|sales|equipment):[\w-]+)"
)
_ref_in_text = re.compile(_REF)
_working_notes = re.compile(
    r"\b(?:in|of|from) the pack\b|\bthe pack (?:shows|does|has|holds)\b|\bretriev\w*"
    r"|\bcatalogue search\b|\b(?:was|were|did) not return(?:ed)?\b|\btool call",
    re.I,
)
# a bracketed list of references, or a single one, with the space before it
_ref_span = re.compile(rf"\s*\[[^\]]*{_REF}[^\]]*\]|\s*{_REF}")


def _texts(node: Any) -> list[str]:
    """Every text field of an answer, without the reference lists."""
    if isinstance(node, dict):
        return [
            t
            for key, value in node.items()
            if key not in ("evidence_refs", "related_requirement", "effort_changes")
            for t in _texts(value)
        ]
    if isinstance(node, list):
        return [t for item in node for t in _texts(item)]
    return [node] if isinstance(node, str) else []


def wording_faults(answer: SeriesAnalysis) -> list[str]:
    """How an answer is written: asked of the model in the correction request, not reported to
    the product manager afterwards (the brief strips the ids, and a turn of phrase is not a
    fault of the analysis)."""
    texts = _texts(answer.model_dump())
    faults = []
    if any(_ref_in_text.search(t) for t in texts):
        faults.append(
            "Text fields hold reference ids. Move every id to evidence_refs and write the "
            "sentence without it."
        )
    if any(_working_notes.search(t) for t in texts):
        faults.append(
            "Text fields talk about the pack, tools, searches or what was retrieved. The reader "
            "sees none of that: say what the evidence shows, or that it is not stored."
        )
    return faults


def region_faults(session: Session, pack: dict[str, Any], answer: SeriesAnalysis) -> list[str]:
    """What an answer gets wrong about the regions; sent back to the model once, and reported
    if it stays."""
    labels = [r["label"] for r in pack["regions"]]
    faults = []
    in_topics = {ref for t in answer.topics for ref in t.evidence_refs}
    in_region = {e.region: set(e.evidence_refs) for e in answer.regions}
    passed_over = [
        f"{label}: {item['text']} [{item['ref']}]"
        for label, apart in pack["apart"].items()
        for key in ("study_weaker_here", "complaints_raised_here")
        for item in apart[key][:MUST_COVER]
        if item["ref"] and item["ref"] not in in_topics | in_region.get(label, set())
    ]
    if passed_over:
        faults.append(
            "What sets a region apart is passed over: "
            + "; ".join(passed_over)
            + ". Deal with each in a topic or in that region's expectations, say what follows "
            "from it (also if that is to watch it and change nothing), and cite its reference "
            "there."
        )
    if sorted(e.region for e in answer.regions) != sorted(labels):
        faults.append(f"regions must hold one entry for each of {', '.join(labels)}.")
    for t in answer.topics:
        if sorted(s.region for s in t.regions) != sorted(labels):
            faults.append(f'"{t.title}" must list each region once: {", ".join(labels)}.')
        unknown = sorted(set(t.target_regions) - set(labels))
        if unknown:
            faults.append(
                f'"{t.title}" targets {", ".join(unknown)}, which the pack does not have.'
            )
        if t.decision == "change_now_regional":
            if not t.target_regions or set(t.target_regions) >= set(labels):
                faults.append(
                    f'"{t.title}" is regional but targets '
                    + ("no region" if not t.target_regions else "every region")
                    + ". Name the regions it is for, or decide for all markets."
                )
            cited = regions_of_refs(session, t.evidence_refs, pack["regions"])
            bare = [r for r in t.target_regions if r in labels and not cited.get(r)]
            if bare:
                faults.append(
                    f'"{t.title}" is a change for {", ".join(bare)} but cites no evidence of '
                    f"{', '.join(bare)}. Cite a verbatim, finding, study score or external row "
                    "of that region, or change the decision."
                )
        if not t.changes_vehicle and t.effort_changes:
            faults.append(
                f'"{t.title}" is {t.decision} and carries a change profile. Remove the profile '
                "or decide for a change."
            )
    return faults


def pack_refs(pack: dict[str, Any]) -> set[str]:
    """Every reference the pack shows and the analyst may therefore cite."""
    refs = collect_refs(pack, set())
    refs |= {r["sales_ref"] for r in pack["regions"] if r["sales_ref"]}
    refs |= {
        c["finding"]
        for t in pack["complaint_themes"]
        for c in t["regions"].values()
        if c["finding"]
    }
    return refs


def _effort(
    session: Session, pack: dict[str, Any], answer: SeriesAnalysis
) -> tuple[dict[str, Any], list[str]]:
    """Effort of every topic by the CPM engine on the lead vehicle, with the engine's checks,
    and the one this analysis adds: a topic left to the next generation although its change is
    an adaptation of the current car."""
    lead = pack["lead_vehicle"]
    scopes = {(r["vehicle"], r["market"]) for r in pack["regions"]}
    effort, faults = effort_of_proposals(
        session,
        lead,
        pack["regions"][0]["market"],
        SimpleNamespace(recommendations=answer.topics),
        scopes=scopes,
    )
    for topic, row in zip(answer.topics, effort["recommendations"], strict=True):
        if topic.decision == "next_generation" and row.get("decision") == "adapt":
            text = (
                f"left to the next generation, but the change profile comes to "
                f"{row['effort_pct']} % of a new vehicle generation, an adaptation the current "
                "car could take"
            )
            row["flags"].append({"level": "warning", "rule": "horizon", "text": text})
            faults.append(
                f'"{topic.title}" is {text}. Decide for a change now, or name in why what the '
                "current car cannot carry, or correct the profile if it understates the change."
            )
    return effort, faults


def run_series_analysis(
    session: Session,
    run: Run,
    gateway: LlmGateway,
    vehicle: str,
    *,
    max_steps: int = 14,
    use_cache: bool = True,
) -> dict[str, Any]:
    pack = build_series_pack(session, vehicle)
    lead = pack["lead_vehicle"]
    user = (
        f"Analyse the BMW {pack['series']} across its regions: "
        + ", ".join(r["label"] for r in pack["regions"])
        + f".\n\n{render_series_pack(pack)}\n\n{effort_brief(engine_and_samples(lead)[0])}"
    )

    def check(answer: SeriesAnalysis) -> list[str]:
        return (
            wording_faults(answer)
            + region_faults(session, pack, answer)
            + _effort(session, pack, answer)[1]
        )

    result = run_agent(
        session,
        gateway,
        purpose="series_analysis",
        prompt_version=PROMPT_VERSION,
        system=SYSTEM_PROMPT,
        user=user,
        schema_model=SeriesAnalysis,
        schema_name="series_analysis",
        actor_id=ACTOR,
        seen_refs=pack_refs(pack),
        citation_keys=("evidence_refs", "related_requirement"),
        check=check,
        max_steps=max_steps,
        max_output_tokens=16000,
        use_cache=use_cache,
    )
    run.model_ids = {"reasoning": result.model}
    answer: SeriesAnalysis = result.parsed
    effort, effort_faults = _effort(session, pack, answer)
    open_faults = region_faults(session, pack, answer) + effort_faults
    out = {
        "run_id": run.id,
        "series": pack["series"],
        "lead_vehicle": lead,
        "prompt_version": PROMPT_VERSION,
        "pack_version": pack["pack"],
        "model": result.model,
        "regions": [
            {k: r[k] for k in r if k != "external"} | {"external_rows_in_pack": len(r["external"])}
            for r in pack["regions"]
        ],
        "analysis": answer.model_dump(),
        # computed from the references of each topic, not written by the model
        "topics": [
            {
                "horizon": t.horizon,
                "evidence_by_region": regions_of_refs(session, t.evidence_refs, pack["regions"]),
                "subsystems": subsystems_of_refs(session, t.evidence_refs),
            }
            for t in answer.topics
        ],
        "effort": effort | {"open_faults": open_faults},
        "citations": {"cited": len(result.cited_refs), "unknown": result.unknown_refs},
        "trace": {
            "steps": result.steps,
            "cached_steps": result.cached_steps,
            "hit_step_limit": result.hit_step_limit,
            "cost_usd": round(result.cost_usd, 4),
            "tool_calls": result.tool_calls,
            "llm_call_ids": result.llm_call_ids,
        },
    }
    record_event(
        session,
        actor_type="agent",
        actor_id=ACTOR,
        action="analysis.created",
        entity_type="analysis",
        entity_id=f"{lead}_regions",
        run_id=run.id,
        model_id=result.model,
        prompt_version=PROMPT_VERSION,
        after={
            "headline": answer.headline,
            "regions": [r["label"] for r in pack["regions"]],
            "decisions": dict(Counter(t.decision for t in answer.topics)),
            "cited_refs": result.cited_refs,
            "unknown_refs": result.unknown_refs,
            "effort_model": effort["model_hash"],
            "open_faults": open_faults,
            "steps": result.steps,
            "tool_calls": len(result.tool_calls),
            "cost_usd": out["trace"]["cost_usd"],
            "llm_call_ids": result.llm_call_ids,
        },
        rationale="Proposal for the product manager; nothing in the evidence store was changed",
    )
    return out


def render_series(out: dict[str, Any]) -> str:
    """The brief a product manager reads. References, change profiles and tool calls are in the
    JSON beside it."""
    a, effort = out["analysis"], out["effort"]
    labels = [r["label"] for r in out["regions"]]

    def clean(text: str | None) -> str:
        """A sentence without the reference ids a model sometimes leaves in it."""
        return _ref_span.sub("", text or "").strip()

    basis = " · ".join(
        f"{r['label']} " + (f"{r['verbatims']:,} verbatims" if r["verbatims"] else "no verbatims")
        for r in out["regions"]
    )
    sold = " · ".join(
        f"{r['label']} {r['sales_2025']:,}"
        for r in out["regions"]
        if r["sales_2025"] is not None and not r["country"]
    )
    lines = [
        f"# BMW {out['series']}: what to change, for whom, and when",
        "",
        f"**{clean(a['headline'])}**",
        "",
        clean(a["answer"]),
        "",
        f"Customer text: {basis}. Sales 2025: {sold}.",
        "",
        "## Decisions",
        "",
        "| # | Topic | Decision | For | Effort | Confidence |",
        "|---|---|---|---|---|---|",
    ]
    rows = list(zip(a["topics"], out["topics"], effort["recommendations"], strict=True))
    for n, (t, _, e) in enumerate(rows, 1):
        target = (
            "all" if set(t["target_regions"]) >= set(labels) else ", ".join(t["target_regions"])
        )
        lines.append(
            f"| {n} | {clean(t['title'])} | {DECISION_TEXT[t['decision']]} | {target or '–'} | "
            f"{effort_text(e)} | {t['confidence']} |"
        )
    lines += ["", *package_lines(effort)]
    for n, (t, computed, e) in enumerate(rows, 1):
        changes = t["decision"] not in ("keep", "no_action")
        regional = t["decision"] == "change_now_regional"
        lines += [
            "",
            f"## {n}. {clean(t['title'])}",
            "",
            f"**{DECISION_TEXT[t['decision']]}"
            + (f" ({', '.join(t['target_regions'])})" if regional else "")
            + f".** {clean(t['action'])}",
            "",
        ]
        shown = [s for s in t["regions"] if s["weight"] != "none"]
        quiet = [s["region"] for s in t["regions"] if s["weight"] == "none"]
        if changes:
            lines += ["| Region | Customers | Market and rivals | Weight |", "|---|---|---|---|"]
            lines += [
                f"| {s['region']} | {clean(s['customers'])} | {clean(s['market']) or '–'} | "
                f"{s['weight']} |"
                for s in shown
            ]
            if quiet:
                lines.append(f"| {', '.join(quiet)} | no signal | – | none |")
            lines.append("")
            if t["our_offer"]:
                lines.append(f"- The car today: {clean(t['our_offer'])}")
            lines.append(
                f"- Rivals: {clean(t['rivals']) or 'nothing stored on rivals for this topic.'}"
            )
        else:  # a strength or a topic left alone needs no table
            lines.append(
                "- Where: " + ", ".join(f"{s['region']} {s['weight']}" for s in shown) + "."
            )
        lines.append(f"- Why this way: {clean(t['why'])}")
        if e["status"] == "estimated":
            lines.append(
                f"- Effort: {e['effort_pct']} % of a new vehicle generation ({e['decision']}, "
                f"P5–P95 {e['p5']}–{e['p95']}), from the {e['source']}."
            )
        elif e["status"] != "no_vehicle_change":
            lines.append("- Effort: **not estimated** (no usable change profile).")
        lines += [f"- Check: {w}" for w in warnings_of(e)]
        by_region = ", ".join(f"{k} {v}" for k, v in computed["evidence_by_region"].items())
        lines.append(
            f"- Evidence: {len(t['evidence_refs'])} references"
            + (f" ({by_region})" if by_region else "")
        )
    lines += ["", "## What each region expects"]
    names = {r["label"]: r for r in out["regions"]}
    for x in a["regions"]:
        r = names.get(x["region"], {})
        about = f"{r['verbatims']:,} verbatims" if r.get("verbatims") else "no verbatims"
        lines += ["", f"**{x['region']}** ({r.get('name', '')}, {about})"]
        lines += [f"- {clean(b)}" for b in x["expects"]]
    o = a["optimum_version"]
    lines += ["", "## The optimum version", "", "Every market:"]
    lines += [f"- {clean(b)}" for b in o["every_market"]] or ["- Nothing."]
    for pack in o["regional"]:
        lines += ["", f"Only {pack['region']}:"] + [f"- {clean(b)}" for b in pack["items"]]
    lines += ["", "Next generation:"]
    lines += [f"- {clean(b)}" for b in o["next_generation"]] or ["- Nothing."]
    lines += ["", "Keep:"] + ([f"- {clean(b)}" for b in o["keep"]] or ["- Nothing."])
    lines += ["", "## What the data cannot answer"] + [f"- {clean(u)}" for u in a["unknowns"]]
    if effort["open_faults"]:
        lines += ["", "## Not settled by the checks"] + [f"- {f}" for f in effort["open_faults"]]
    unknown = out["citations"]["unknown"]
    lines += [
        "",
        "---",
        f"Run `{out['run_id']}` · {out['model']} · {out['prompt_version']} · "
        f"{out['citations']['cited']} references cited, {len(unknown)} not verified"
        + (f" ({', '.join(unknown)})" if unknown else "")
        + f" · {len(out['trace']['tool_calls'])} tool calls, all on the stored evidence. References, "
        "change profiles and tool calls are in the JSON file of the same name.",
    ]
    return "\n".join(lines) + "\n"

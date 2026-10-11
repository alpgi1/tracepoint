"""Situation analysis of one vehicle in one market or country, written by the analyst agent.

The agent starts from the context pack, drills down with the tools and answers in a fixed schema
in which every insight and recommendation cites its evidence. The analysis is a proposal for the
product manager: it reads the evidence store and changes nothing in it.

Effort is never a number the model writes. A recommendation names an existing requirement, whose
stored change profile is used, or carries a change profile of its own; the CPM engine
(``effort/cpm.py``) computes the effort from that, and a proposal whose effort does not fit its
horizon goes back to the model once.
"""

from __future__ import annotations

import re
from typing import Any, Literal

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.agent.context_pack import build_context_pack, render_markdown
from tracepoint.agent.loop import collect_refs, run_agent
from tracepoint.core.audit import record_event
from tracepoint.db.models import Country, Requirement, RequirementEffort, Run, Verbatim
from tracepoint.effort.cpm import (
    Change,
    Engine,
    estimate,
    load_anchors,
    load_model,
    model_hash,
)
from tracepoint.effort.store import (
    engine_and_samples,
    evaluate,
    evaluate_changes,
    horizon_flags,
    reference_changes,
)
from tracepoint.effort.subsystems import subsystem_names, subsystems_of_refs
from tracepoint.llm.gateway import LlmGateway

# v2: the loop's untrusted-data rule joins the prompt; v3: CPM effort and change profiles;
# v4: changes_vehicle, scope of related_requirement, carryover of own profiles not applied;
# v5: the CPM subsystem view and the market evidence;
# v6: reference changes per subsystem, start subsystem and size are checked and sent back
# v7: external evidence rows
PROMPT_VERSION = "situation-analysis-v8"  # v8: short fields, for the brief
ACTOR = "agent:analyst"


# Bounds on what the model may send. They are part of the answer schema, so the provider enforces
# them and an answer beyond them is rejected as a whole at parsing; nothing is cut to fit.
MAX_INSIGHTS = 30
MAX_PROPOSALS = 20
MAX_REFS = 40  # per insight or proposal
MAX_CHANGES = 8  # per proposal
MAX_TERMS = 5  # catalogue terms per change


class ProposedChange(Change):
    """A change written by the analyst: the engine's format with a bounded term list."""

    portfolio_terms: list[str] = Field(
        max_length=MAX_TERMS, description="Catalogue search terms, German or English"
    )


class Insight(BaseModel):
    title: str
    kind: Literal[
        "recurring_complaint", "unmet_need", "strength", "metric_gap", "equipment_gap", "context"
    ]
    domain: str = Field(description="Vehicle domain key as written in the context pack")
    statement: str = Field(description="What the evidence shows, with its numbers")
    customer_quote: str | None = Field(description="One short verbatim quote, or null")
    evidence_refs: list[str] = Field(min_length=1, max_length=MAX_REFS)
    confidence: Literal["high", "medium", "low"]


class Recommendation(BaseModel):
    title: str
    proposal: str = Field(description="What the product manager should consider, customer-facing")
    horizon: Literal["H1", "H2"]
    rationale: str
    evidence_refs: list[str] = Field(min_length=1, max_length=MAX_REFS)
    related_requirement: str | None = Field(
        description="Id of an existing requirement (REQ-…) that already covers this, or null"
    )
    changes_vehicle: bool = Field(
        description="True when the proposal changes hardware, software or content of the "
        "vehicle; false only when it keeps something as it is or acts outside the vehicle"
    )
    effort_changes: list[ProposedChange] | None = Field(
        max_length=MAX_CHANGES,
        description="Change profile for the effort engine: null when related_requirement is set "
        "and its stored profile covers the proposal, or when changes_vehicle is false",
    )


class SituationAnalysis(BaseModel):
    headline: str
    summary: str
    data_coverage: str = Field(description="Which evidence the analysis rests on and how much")
    insights: list[Insight] = Field(max_length=MAX_INSIGHTS)
    recommendations: list[Recommendation] = Field(max_length=MAX_PROPOSALS)
    assumptions_and_gaps: list[str]


SYSTEM_PROMPT = """You are the situation analyst of Tracepoint, a customer-requirements workbench for BMW product managers. You analyse one BMW model in one market, or in one country of that market, from the stored evidence. You report what customers experience, what they miss, what has to be kept, and what the product manager should look at first.

How to work
1. The user message holds the context pack of the scope. Read it first.
2. Drill down with the tools before you conclude. Read the verbatims behind the largest complaint themes and behind the strengths (get_verbatims_by_theme, search_evidence). Check the study metrics (get_metric), the catalogue (get_equipment), the sales weight (get_sales), the extracted findings (get_findings), the requirements already derived (get_requirements) and the external market and competition evidence (get_external_evidence). Ask for the requirements without a status filter: most are still proposed and wait for the product manager's decision. Where requirements exist, read their effort estimates and the package variations (get_effort with scenarios=true). The pack also shows the customer rows per CPM subsystem; get_subsystems with a subsystem key returns its liked and criticised themes with quotes. Use search_documents for the BMW Group's strategy and delivery figures.
3. Search is lexical: when a query returns little, try the customers' other words for the same thing.
4. Stop calling tools once another call would not change the analysis. Then answer in the JSON schema.

Evidence rules
- Every insight and every recommendation lists the references it rests on in evidence_refs, copied exactly as you received them: evidence_ref values (verbatim:…, metric:…, equipment:…, sales:…, document:…, market:…, external:…) and the ids of findings and requirements (FND-…, REQ-…). A reference you were not given is rejected.
- Every number comes from the context pack or from a tool result. Use no figure from memory and no knowledge about competitors or markets that is not in the evidence.
- A customer quote is copied word for word from a verbatim you cite, and kept short.
- Say how strong the evidence is: a theme with five rows is not a theme with two hundred.

Scope of the analysis
- In scope: what customers require of the product. Features, equipment, comfort, space, usability, infotainment and digital services, design and quality perception, driving experience, range and charging as the customer experiences them, the variant and package offering.
- Out of scope: regulation and homologation, engineering specifications, pricing and business case. Dealer, service-process and finance topics are not product feedback; mention them as context at most.
- Recommendations are proposals. The product manager decides; do not write them as decisions. Where a requirement that already exists covers a recommendation, put its id in related_requirement and cite it.

Two views of the same customer rows
- Customers speak in themes and domains; effort propagates in the twelve CPM subsystems. Each theme is mapped to one subsystem (an authored assumption). The pack lists the complaint and like counts per subsystem, and tools return the subsystem of a theme or a finding.
- Use the subsystem view to see where the complaints concentrate in engineering terms, and say so where it changes the picture: many small complaints in one subsystem can be one piece of work, and a subsystem with a high weight and few complaints is expensive to touch for little customer gain.
- Insights stay in the customer's terms (theme, domain). The report adds the subsystems of the evidence you cite; you do not list them.

Market and competition evidence
- The pack and get_subsystems carry market and competitor statements, each with its source, date, an evidence level (weak: one source, medium: two, strong: three or more) and a basis (evidence or assumption). Cite them by their evidence_ref (market:…) and state the level in your words.
- A weak row is context; it never carries an insight or a recommendation alone. A row whose basis is an assumption cannot raise confidence to high.
- Where a row carries a contradiction, report both sides. Never average them.
- A market figure ranks powertrains or describes the region. It is not customer feedback: it does not make a customer need more or less frequent.
- If no row is stored for the market or the subsystem, say that there is none. Do not fill the gap from memory.

External evidence (the team's source lists)
- get_external_evidence returns the rows of the market and the worldwide ones: market shares, consumer surveys, charging infrastructure, competitor moves, quality indices, expert tests, owner complaints filed with NHTSA, official EPA figures. The pack says how many rows the scope has and for which subsystems and topics. Look at the rows of the subsystems your main insights sit in before you conclude, and cite a row by its evidence_ref (external:…).
- The rules for market rows hold for them: state the level, a weak row never carries an insight or a recommendation alone, an assumption (a forecast) cannot raise confidence to high, both sides of a contradiction are reported.
- verification says whether the figures of a row were found on the fetched page: confirmed (they stand together in one passage, or a reader pinned the passage) or computed (from an official API) is verified. Call any other row (on_page, partial, not_found, not_fetched, not_checkable) unverified where you use it; it never carries a recommendation alone, whatever its level.
- A row for the regions Global only describes no single market. Say so.
- Rows about this vehicle (expert tests, NHTSA complaints, EPA figures) are third-party statements. They are not BMW customer feedback: they do not change a complaint count, and an NHTSA complaint is a safety or defect report, not a satisfaction measure.
- Competitor and market knowledge comes from these rows only. A rival or a market fact that no row names is not in the evidence.
- search_documents also finds passages of the stored pages of external sources about this vehicle (reviews, owner complaints); cite them as document:….

Effort
- Effort is estimated with the Change Prediction Method as a share of the development effort of a new vehicle generation. It is never money, and every input of the model is an uncalibrated assumption: say so wherever effort enters your reasoning.
- Effort is a rough prioritisation factor only. What customers need comes first; effort decides the horizon and the packaging, not whether a need is real.
- You do not write an effort percentage for your own proposals. The engine computes it from a change profile and the report shows it. Figures returned by get_effort may be quoted.
- A recommendation that an existing requirement covers names it in related_requirement and leaves effort_changes null: the requirement's stored profile is used. Name only requirements of the vehicle and market you analyse; any other is refused. If your proposal goes beyond the requirement, add the extra in effort_changes: both are counted.
- A requirement the product manager rejected at gate G2 is not proposed again, unless your rationale says what new evidence justifies it.
- Any other recommendation that changes the vehicle sets changes_vehicle to true and gives effort_changes, at most eight entries, one per subsystem where the change starts: the subsystem key from the effort model in the user message, own_impact (share of that subsystem's design redone, judged against the reference points given there), the layer, carryover, why in one sentence, and portfolio_terms (two or three German or English catalogue words for the feature; the catalogue is searched with them). List only where the change starts; the engine adds the propagation to other subsystems.
- Where a change starts is checked against your evidence. A change that starts in a subsystem none of the findings, requirements or market rows you cite sits in, and that fewer than two of your verbatims or external rows touch, is sent back: cite evidence for that subsystem, move the start, or state in why what puts the work there (a complaint about setting the climate through the screen sits in thermal_hvac or software_hmi; physical keys for it start in interior_console, and why says so).
- own_impact is set by comparison, not by feel. The effort model in the user message lists reference changes for every subsystem: documented BMW decisions and the reviewed profiles of existing requirements. Find the nearest ones, decide whether your change is smaller or larger, and name that comparison in why ("smaller than the OS 7 release at 0.4: one menu layer, not a new system"). A value outside the range of its subsystem's references is sent back.
- carryover in your own profile is a claim for the product manager to check. It is reported and not applied: your profile is computed as a new development.
- Only a recommendation that changes nothing on the vehicle (keep a strength, explain a function) sets changes_vehicle to false and has no profile. A proposal that changes the vehicle and has no profile is sent back.
- Horizon follows effort: H1 holds what stays an adaptation of the current model. A major revision or a new generation belongs to H2, or is split into an H1 step and an H2 step. Several H1 proposals add up: get_effort shows what the existing H1 requirements already come to as one package.

What the data is (name the points that bear on your conclusions under data_coverage or assumptions_and_gaps)
- Verbatims carry labels of the canonical VFC taxonomy with the types Likes, Wants, Difficult to Use and Defect. Severity runs Defect, then Difficult to Use, then Wants. Verbatims that arrived without a label were labelled by an AI assistant, not by BMW.
- The four verbatim sources A to D are not weighted against each other. Source B is call-centre notes written by an agent; they mix product feedback with process content.
- Feedback countries are grouped into four markets: EU, US (with Canada), CN, and RoW (Japan, South Korea, Australia, South Africa).
- A country scope narrows the customer verbatims only. Study metrics, sales and findings exist per market, so for a country they describe its whole market.
- The equipment catalogue is the German price list of July 2026 in EUR. Outside Germany it shows what the model line offers, not what is standard or optional in that market.
- Sales have no powertrain split. The G60 volumes include the Chinese long-wheelbase G68. The 2030 figure is a plan value.
- China has study scores and no verbatims.
- Study scores are compared with other BMW models only. Competitor statements exist as market rows and external evidence rows, nowhere else.
- Finding evidence levels: A means several source types, at least 20 complaint rows and a supporting study metric; B at least 10 rows or a study metric; C at least 5 rows or the catalogue alone.
- Horizons: H1 is achievable within the current generation (model-year update, software, equipment, packages, colours). H2 belongs to the successor generation, about 2030.

Write in English, plainly and briefly, for a product manager who reads the brief in five minutes and checks references only where a point surprises: a statement in at most three sentences with the numbers that carry it, a proposal and a rationale in at most two sentences each, a summary in at most four."""

_generated_line = re.compile(r", generated [^.]*\.")
_not_alnum = re.compile(r"[\W_]+")  # Unicode-aware: letters of any script are kept


def unverified_quotes(session: Session, analysis: SituationAnalysis) -> list[str]:
    """Customer quotes that are not found word for word in a verbatim the insight cites
    (compared on letters and digits only, so punctuation and spacing do not matter). A quote
    with nothing left to compare counts as not found."""

    def plain(text: str) -> str:
        return _not_alnum.sub(" ", text.lower()).strip()

    missing = []
    for insight in analysis.insights:
        if not insight.customer_quote:
            continue
        ids = [r.split(":", 1)[1] for r in insight.evidence_refs if r.startswith("verbatim:")]
        texts = session.scalars(select(Verbatim.text).where(Verbatim.id.in_(ids))).all()
        quote = plain(insight.customer_quote)
        if not quote or not any(quote in plain(t) for t in texts):
            missing.append(insight.customer_quote)
    return missing


def resolve_scope(
    session: Session, market: str | None, country: str | None
) -> tuple[str, str | None]:
    """(market, country). A country brings its market with it (config/markets.yaml)."""
    if country:
        row = session.get(Country, country.upper())
        if row is None:
            raise ValueError(f"unknown country {country!r}; see config/markets.yaml")
        if market and market != row.market_code:
            raise ValueError(
                f"country {row.code} belongs to market {row.market_code}, not {market}"
            )
        return row.market_code, row.code
    if not market:
        raise ValueError("give a market or a country")
    return market, None


def effort_brief(engine: Engine) -> str:
    """What the model needs to author a change profile, read from config/effort/."""
    cfg = engine.cfg
    present = [f"{k} ({engine.names[k]}, {w:.0f} %)" for k, w in engine.base.weights.items()]
    absent = [k for k in engine.names if k not in engine.base.weights]
    anchors = [
        f"- {a.name}: "
        + " + ".join(
            f"{c.subsystem} {c.own_impact} {c.layer}" + (" carryover" if c.carryover else "")
            for c in a.changes
        )
        + f" → {a.actual}"
        for a in load_anchors().anchors
        if a.independent
    ]
    rule, t = cfg.platform_rule, cfg.thresholds
    lines = [
        "## Effort model (CPM) for effort_changes – assumptions, not calibrated",
        "Subsystems (key, name, share of the development effort of a new generation): "
        + ", ".join(present)
        + ".",
        *(
            [f"Not on this vehicle, so no change can start there: {', '.join(absent)}."]
            if absent
            else []
        ),
        f"Layers: K0 configuration (standard content, package, activation of existing hardware; "
        f"own_impact at most {cfg.k0_max_own_impact}), K1 add-on on existing interfaces, K2 "
        f"module change, K3 platform change. Replacing {', '.join(rule.subsystems)} at "
        f"{rule.min_own_impact} or more without carryover must be K3.",
        f"Classes: below {t.major_revision} % adapt, below {t.new_generation} % major revision, "
        "above that or any K3 change without carryover a new generation.",
        "Reference points for own_impact (documented BMW decisions):",
        *anchors,
        "Reference changes per subsystem (own_impact, layer, source: what was changed). The "
        "smallest, a middle and the largest of each; n is how many exist:",
        *_reference_lines(set(engine.base.weights)),
    ]
    return "\n".join(lines)


MIN_REFERENCES = 3  # fewer than this is no scale to hold a size against


def _reference_text(r: dict[str, Any]) -> str:
    label = r["label"] if len(r["label"]) <= 70 else r["label"][:70] + " …"
    return f"{r['own_impact']} {r['layer']}, {r['source']}: {label}"


def _reference_lines(present: set[str]) -> list[str]:
    lines = []
    for key, rows in reference_changes().items():
        if key not in present:
            continue
        picks = {0: rows[0], len(rows) // 2: rows[len(rows) // 2], len(rows) - 1: rows[-1]}
        lines.append(
            f"- {key} (n={len(rows)}): " + " | ".join(_reference_text(r) for r in picks.values())
        )
    return lines


def _size_check(c: Change) -> tuple[dict[str, Any], str | None]:
    """Where an analyst's own_impact stands among the reference changes of its subsystem, and
    the complaint if it is outside their range."""
    rows = reference_changes().get(c.subsystem, [])
    below = [r for r in rows if r["own_impact"] <= c.own_impact]
    above = [r for r in rows if r["own_impact"] >= c.own_impact]
    info = {
        "subsystem": c.subsystem,
        "own_impact": c.own_impact,
        "references": len(rows),
        "nearest_below": below[-1] if below else None,
        "nearest_above": above[0] if above else None,
    }
    if len(rows) < MIN_REFERENCES:
        return info, None
    if not above:
        return info, (
            f"own_impact {c.own_impact} for {c.subsystem} is above every reference change of "
            f"that subsystem (largest: {_reference_text(rows[-1])})"
        )
    if not below:
        return info, (
            f"own_impact {c.own_impact} for {c.subsystem} is below every reference change of "
            f"that subsystem (smallest: {_reference_text(rows[0])})"
        )
    return info, None


_EFFORT_KEYS = ("effort_pct", "p5", "p95", "decision", "decision_stable_pct", "layer", "size")


def _flag(level: str, rule: str, text: str) -> dict[str, str]:
    return {"level": level, "rule": rule, "text": text}


def _requirement_in_scope(
    session: Session, requirement_id: str, scopes: set[tuple[str, str]]
) -> tuple[Requirement | None, str | None]:
    """The requirement a proposal names, or why its profile may not be used. The id comes from
    the model, so it is only accepted for the vehicles and markets under analysis."""
    req = session.get(Requirement, requirement_id)
    if req is None or req.status == "withdrawn":
        return None, "which does not exist"
    if (req.vehicle_code, req.market_code) not in scopes:
        return (
            None,
            f"which belongs to {req.vehicle_code} {req.market_code}, not {_scope_text(scopes)}",
        )
    return req, None


def _scope_text(scopes: set[tuple[str, str]]) -> str:
    return " or ".join(f"{v} {m}" for v, m in sorted(scopes))


def _searchable(term: str) -> bool:
    """A catalogue term is matched as a substring: too short or with a wildcard it matches
    almost every item and would make any feature look as if BMW already offered it."""
    return len(term.strip()) >= 4 and not set("%_") & set(term)


def _analyst_change(c: Change) -> Change:
    """A change written by the model, as the engine may use it: computed as a new development
    (the carryover discount is a claim nobody has checked), searched with usable terms only."""
    terms = [t.strip() for t in c.portfolio_terms if _searchable(t)]
    return c.model_copy(update={"carryover": False, "portfolio_terms": terms})


def effort_of_proposals(
    session: Session,
    vehicle: str,
    market: str,
    analysis: Any,
    *,
    scopes: set[tuple[str, str]] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    """Effort of every recommendation and of the H1 and H2 recommendations as packages, computed
    by the CPM engine from the current model. Returns the result and the faults to send back to
    the model.

    ``analysis`` is anything with ``recommendations`` whose items carry title, horizon,
    evidence_refs, related_requirement, changes_vehicle and effort_changes (the series analysis
    passes its topics). ``scopes`` are the vehicle and market pairs whose requirements may be
    named; by default the one under analysis.

    Everything the model controls is checked or bounded here, and a proposal that changes the
    vehicle never passes without an estimate silently: it is estimated, or it is a fault and is
    listed as not counted in its package."""
    engine, samples = engine_and_samples(vehicle)
    scopes = scopes or {(vehicle, market)}
    rows: list[dict[str, Any]] = []
    faults: list[str] = []
    from_requirements: dict[str, dict[str, list[Change]]] = {"H1": {}, "H2": {}}
    from_analyst: dict[str, list[Change]] = {"H1": [], "H2": []}
    not_counted: dict[str, list[str]] = {"H1": [], "H2": []}
    for rec in analysis.recommendations:
        flags: list[dict[str, str]] = []
        sources: list[str] = []
        req, stored = None, None
        if rec.related_requirement:
            req, problem = _requirement_in_scope(session, rec.related_requirement, scopes)
            if problem:
                text = f"names {rec.related_requirement}, {problem}; its profile is not used"
                flags.append(_flag("conflict", "scope", text))
                faults.append(
                    f'"{rec.title}" {text}. Name a requirement of {_scope_text(scopes)} or set '
                    "related_requirement to null and give effort_changes."
                )
        if req is not None:
            stored = session.get(RequirementEffort, req.id)
            if req.status == "rejected":
                text = f"{req.id} was rejected by the product manager at gate G2"
                flags.append(_flag("conflict", "G2", text))
                faults.append(
                    f'"{rec.title}": {text}. Drop the proposal, or say in the rationale what '
                    "new evidence justifies raising it again."
                )
            elif req.status == "deferred":
                flags.append(_flag("info", "G2", f"{req.id} was deferred by the product manager"))
            if stored is not None and stored.requirement_version != req.version:
                flags.append(
                    _flag(
                        "warning",
                        "63",
                        f"the profile of {req.id} was written for version "
                        f"{stored.requirement_version}; the requirement is at {req.version}",
                    )
                )
        stored_changes = [Change.model_validate(c) for c in stored.changes] if stored else []
        if stored is not None:
            sources.append(f"change profile of {req.id}")
        own = list(rec.effort_changes or [])
        claimed = [c.subsystem for c in own if c.carryover]
        cited_in = subsystems_of_refs(session, rec.evidence_refs)
        # Where the evidence sits for certain: findings, requirements and market rows carry one
        # theme each; a verbatim carries several labels and an external row can bear on several
        # subsystems, so one of those alone is not enough.
        precise = subsystems_of_refs(
            session,
            [r for r in rec.evidence_refs if not r.startswith(("verbatim:", "external:"))],
        )
        core = set(precise) | {k for k, n in cited_in.items() if n >= 2}
        elsewhere = sorted({c.subsystem for c in own} - core)
        if own and not core:
            flags.append(
                _flag(
                    "info",
                    "map",
                    "the cited evidence pins no subsystem (no finding, requirement or market "
                    "row with a theme, and no two verbatims in one subsystem), so where the "
                    "change starts cannot be checked against it",
                )
            )
        elif elsewhere:
            text = (
                f"the change starts in {', '.join(elsewhere)}; the cited evidence sits in "
                f"{', '.join(sorted(core))} by the theme mapping"
            )
            flags.append(_flag("warning", "map", text + ". Check the reason given for it"))
            faults.append(
                f'"{rec.title}": {text}. Cite evidence for {", ".join(elsewhere)}, move the '
                "start of the change to where the evidence sits, or state in the change's why "
                "what puts the work there."
            )
        sizes = []
        for c in own:
            info, problem = _size_check(c)
            sizes.append(info)
            if problem:
                flags.append(_flag("warning", "size", problem))
                faults.append(
                    f'"{rec.title}": {problem}. Correct own_impact, or state in why what makes '
                    "this change larger or smaller than that reference."
                )
            elif info["references"] < MIN_REFERENCES:
                flags.append(
                    _flag(
                        "info",
                        "size",
                        f"{c.subsystem} has {info['references']} reference change(s); the size "
                        "of this change rests on the analyst's judgement alone",
                    )
                )
        unsearched = sorted({t for c in own for t in c.portfolio_terms if not _searchable(t)})
        if unsearched:
            flags.append(
                _flag(
                    "info",
                    "43",
                    "catalogue terms not searched (under four characters or with a wildcard): "
                    + ", ".join(repr(t) for t in unsearched),
                )
            )
        as_written, own = own, [_analyst_change(c) for c in own]
        if own:
            sources.append("analyst's change profile")
        changes = stored_changes + own
        row: dict[str, Any] = {
            "source": " plus ".join(sources) or None,
            "flags": flags,
            "evidence_subsystems": cited_in,
            "size_references": sizes,
        }
        rows.append(row)
        if not changes:
            # only a declared "nothing changes" passes without an estimate
            if rec.changes_vehicle:
                row["status"] = "missing"
                not_counted[rec.horizon].append(rec.title)
                faults.append(
                    f'"{rec.title}" changes the vehicle but has no change profile'
                    + (f" ({req.id} has none for a vehicle change)" if stored is not None else "")
                    + ". Give effort_changes."
                )
            else:
                row["status"] = "no_vehicle_change"
            continue
        errors = [e for c in changes for e in engine.check_change(c)]
        if errors:
            row.update(status="invalid", error="; ".join(errors))
            not_counted[rec.horizon].append(rec.title)
            faults.append(
                f'The change profile of "{rec.title}" breaks the effort model: '
                f"{row['error']}. Correct effort_changes."
            )
            continue
        res = evaluate_changes(session, engine, samples, vehicle, changes, rec.horizon)
        if claimed:
            with_claim = estimate(engine, stored_changes + as_written).effort
            flags.append(
                _flag(
                    "info",
                    "43",
                    f"carryover claimed by the analyst for {', '.join(claimed)} is not applied: "
                    f"an analyst's profile is computed as a new development (with the claim "
                    f"{with_claim:.2f} %)",
                )
            )
        row.update(
            status="estimated",
            **{k: res[k] for k in _EFFORT_KEYS},
            certification=res["certification_add_on"],
            subsystems=res["subsystems"][:4],
            portfolio=res["portfolio"],
            changes=[c.model_dump() for c in changes],
            flags=flags + res["flags"],
        )
        if stored_changes:
            from_requirements[rec.horizon][req.id] = stored_changes  # named twice: counted once
        from_analyst[rec.horizon] += own
        for flag in res["flags"]:
            if flag["rule"] == "47":
                faults.append(
                    f'"{rec.title}" is {rec.horizon}, but its change profile comes to '
                    f"{row['effort_pct']} % of a new vehicle generation ({row['decision']}): "
                    f"{flag['text']}. Change the horizon, split the proposal, or correct the "
                    "change profile if it overstates the change."
                )
    packages = []
    for horizon in ("H1", "H2"):
        changes = [c for cs in from_requirements[horizon].values() for c in cs]
        changes += from_analyst[horizon]
        in_horizon = [
            r
            for r, rec in zip(rows, analysis.recommendations, strict=True)
            if rec.horizon == horizon and r["status"] == "estimated"
        ]
        if not in_horizon and not not_counted[horizon]:
            continue
        res = evaluate(engine, samples, changes)
        packages.append(
            {
                "horizon": horizon,
                "proposals": len(in_horizon),
                "sum_of_single_pct": round(sum(r["effort_pct"] for r in in_horizon), 2),
                **{k: res[k] for k in _EFFORT_KEYS},
                "certification": res["certification_add_on"],
                "subsystems": res["subsystems"][:6],
                # a package figure that leaves a proposal out says so
                "not_counted": not_counted[horizon],
                # for the product manager to weigh (split the package or accept the class);
                # not sent back to the model, which judges single proposals
                "flags": horizon_flags(
                    horizon, "change", res["decision"], res["decision_stable_pct"]
                )
                if changes
                else [],
            }
        )
    out = {
        "method": "CPM, share of the development effort of a new vehicle generation; never "
        "money; every model input is an uncalibrated assumption (config/effort/model.yaml)",
        "model_hash": model_hash(load_model()),
        "recommendations": rows,
        "packages": packages,
    }
    return out, faults


def run_analysis(
    session: Session,
    run: Run,
    gateway: LlmGateway,
    vehicle: str,
    market: str | None = None,
    country: str | None = None,
    *,
    max_steps: int = 12,
    use_cache: bool = True,
) -> dict[str, Any]:
    market, country = resolve_scope(session, market, country)
    pack = build_context_pack(session, vehicle, market, country_code=country)
    if not pack["coverage"]["verbatims"] and not pack["studies"]:
        raise ValueError(f"no evidence for {vehicle} in {country or market}")
    scope = f"{pack['vehicle']['name']} ({vehicle}), " + (
        f"country {country} (market {market})" if country else f"market {market}"
    )
    # the pack's timestamp would make every request new to the response cache
    pack_text = _generated_line.sub(".", render_markdown(pack), count=1)
    user = (
        f"Analyse {scope}.\n"
        + (
            f"Pass country={country} to the verbatim tools; use market={market} for the rest.\n"
            if country
            else ""
        )
        + f"\n{pack_text}\n{effort_brief(engine_and_samples(vehicle)[0])}"
    )

    def check(answer: SituationAnalysis) -> list[str]:
        quotes = [
            f'The quote "{q}" is not word for word in a verbatim its insight cites. Cite the '
            "verbatim it comes from, or remove the quote."
            for q in unverified_quotes(session, answer)
        ]
        return quotes + effort_of_proposals(session, vehicle, market, answer)[1]

    result = run_agent(
        session,
        gateway,
        purpose="situation_analysis",
        prompt_version=PROMPT_VERSION,
        system=SYSTEM_PROMPT,
        user=user,
        schema_model=SituationAnalysis,
        schema_name="situation_analysis",
        actor_id=ACTOR,
        seen_refs=collect_refs(pack, set()),
        citation_keys=("evidence_refs", "related_requirement"),
        check=check,
        max_steps=max_steps,
        use_cache=use_cache,
    )
    run.model_ids = {"reasoning": result.model}
    quotes = unverified_quotes(session, result.parsed)
    effort, effort_faults = effort_of_proposals(session, vehicle, market, result.parsed)
    effort["open_faults"] = effort_faults  # what the one correction did not settle
    # the engineering view of each insight, computed from its references, not written by the model
    insight_subsystems = [
        subsystems_of_refs(session, i.evidence_refs) for i in result.parsed.insights
    ]
    out = {
        "run_id": run.id,
        "vehicle": vehicle,
        "market": market,
        "country": country,
        "scope": scope,
        "prompt_version": PROMPT_VERSION,
        "context_pack": pack["pack"],
        "model": result.model,
        "analysis": result.parsed.model_dump(),
        "effort": effort,
        "subsystems": {
            "basis": "theme to subsystem by config/cpm/theme_subsystem_map.yaml (an assumption); "
            "references per subsystem among those the insight cites",
            "insights": insight_subsystems,
        },
        "citations": {
            "cited": len(result.cited_refs),
            "unknown": result.unknown_refs,
            "unverified_quotes": quotes,
        },
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
        entity_id=f"{vehicle}_{country or market}",
        run_id=run.id,
        model_id=result.model,
        prompt_version=PROMPT_VERSION,
        after={
            "headline": result.parsed.headline,
            "insights": len(result.parsed.insights),
            "recommendations": len(result.parsed.recommendations),
            "cited_refs": result.cited_refs,
            "unknown_refs": result.unknown_refs,
            "unverified_quotes": quotes,
            "effort_model": effort["model_hash"],
            "effort_packages": [
                {k: p[k] for k in ("horizon", "proposals", "effort_pct", "decision")}
                for p in effort["packages"]
            ],
            "effort_open_faults": effort_faults,
            "steps": result.steps,
            "tool_calls": len(result.tool_calls),
            "cost_usd": out["trace"]["cost_usd"],
            "llm_call_ids": result.llm_call_ids,
        },
        rationale="Proposal for the product manager; nothing in the evidence store was changed",
    )
    return out


def effort_text(e: dict[str, Any]) -> str:
    """One estimate in a few words, for a table cell."""
    if e["status"] == "estimated":
        return f"{e['effort_pct']} % · {e['decision']}"
    return "none" if e["status"] == "no_vehicle_change" else "not estimated"


def warnings_of(e: dict[str, Any]) -> list[str]:
    """What the product manager has to look at; informational notes stay in the JSON."""
    return [f["text"] for f in e["flags"] if f["level"] in ("warning", "conflict")]


def package_lines(effort: dict[str, Any]) -> list[str]:
    lines = []
    for p in effort["packages"]:
        when = "Now (H1)" if p["horizon"] == "H1" else "Next generation (H2)"
        lines.append(
            f"- {when}: {p['proposals']} change(s) together **{p['effort_pct']} %** of a new "
            f"vehicle generation ({p['decision']}); work that proposals share counts once."
            + "".join(f" Not counted, no usable change profile: {t}." for t in p["not_counted"])
        )
        lines += [f"  - {f['text']}" for f in p["flags"] if f["level"] in ("warning", "conflict")]
    lines.append(
        "- Effort is a CPM estimate: a share of the development effort of a new vehicle "
        "generation, never money, on uncalibrated assumptions."
    )
    return lines


def render_brief(out: dict[str, Any]) -> str:
    """The analysis as a product manager reads it: the answer, the proposals with their effort,
    what customers say, what is open. Every reference, change profile, catalogue scan and tool
    call is in the JSON beside it (and in ``render_analysis``, the full print)."""
    a, effort = out["analysis"], out["effort"]
    unknown, loose = out["citations"]["unknown"], set(out["citations"]["unverified_quotes"])
    rows = list(zip(a["recommendations"], effort["recommendations"], strict=True))
    lines = [
        f"# {out['scope']}: situation and proposals",
        "",
        f"**{a['headline']}**",
        "",
        a["summary"],
        "",
        "## Proposals",
        "",
        "| # | Proposal | When | Effort | Requirement |",
        "|---|---|---|---|---|",
    ]
    lines += [
        f"| {n} | {r['title']} | {r['horizon']} | {effort_text(e)} | "
        f"{r['related_requirement'] or 'new'} |"
        for n, (r, e) in enumerate(rows, 1)
    ]
    lines += ["", *package_lines(effort)]
    for n, (r, e) in enumerate(rows, 1):
        lines += ["", f"### {n}. {r['title']}", "", r["proposal"], "", f"- Why: {r['rationale']}"]
        if e["status"] == "estimated":
            lines.append(
                f"- Effort: {e['effort_pct']} % of a new vehicle generation ({e['decision']}, "
                f"P5–P95 {e['p5']}–{e['p95']}), from the {e['source']}."
            )
        elif e["status"] != "no_vehicle_change":
            lines.append("- Effort: **not estimated** (no usable change profile).")
        lines += [f"- Check: {w}" for w in warnings_of(e)]
        lines.append(f"- Evidence: {len(r['evidence_refs'])} references")
    lines += ["", "## What customers say"]
    for i in a["insights"]:
        lines += ["", f"**{i['title']}** (confidence {i['confidence']})", "", i["statement"]]
        if i["customer_quote"] and i["customer_quote"] not in loose:
            lines += ["", f"> {i['customer_quote']}"]
    lines += ["", "## Assumptions and gaps"] + [f"- {x}" for x in a["assumptions_and_gaps"]]
    if effort["open_faults"]:
        lines += ["", "## Not settled by the checks"] + [f"- {f}" for f in effort["open_faults"]]
    lines += [
        "",
        "---",
        f"Run `{out['run_id']}` · {out['model']} · {out['prompt_version']} · "
        f"{out['citations']['cited']} references cited, {len(unknown)} not verified"
        + (f" ({', '.join(unknown)})" if unknown else "")
        + f" · {len(loose)} quotes not found in their verbatims and left out · "
        f"{len(out['trace']['tool_calls'])} tool calls. References, change profiles and tool "
        "calls are in the JSON file of the same name.",
    ]
    return "\n".join(lines) + "\n"


def render_analysis(out: dict[str, Any]) -> str:
    """The full print for checking: every reference, change profile, flag and tool call."""
    a, trace, effort = out["analysis"], out["trace"], out["effort"]
    unknown = set(out["citations"]["unknown"])
    loose_quotes = set(out["citations"]["unverified_quotes"])

    def refs(items: list[str]) -> str:
        return ", ".join(f"`{r}`" + (" (not verified)" if r in unknown else "") for r in items)

    names = subsystem_names()

    def subsystem_line(hits: dict[str, int]) -> list[str]:
        if not hits:
            return []
        return [
            "",
            "Subsystems of the cited evidence: "
            + ", ".join(f"{names[k]} ({n})" for k, n in hits.items()),
        ]

    def effort_lines(e: dict[str, Any]) -> list[str]:
        flags = [f"- {f['level']} ({f['rule']}): {f['text']}" for f in e["flags"]]
        if e["status"] == "no_vehicle_change":
            return ["", "Effort: none, the proposal is declared not to change the vehicle.", *flags]
        if e["status"] == "missing":
            return ["", "Effort: **not estimated**, no change profile was given.", *flags]
        if e["status"] == "invalid":
            text = f"Effort: **not estimated**, the profile breaks the model: {e['error']}"
            return ["", text, *flags]
        return [
            "",
            f"Effort (CPM estimate): **{e['effort_pct']} %** of a new vehicle generation "
            f"(P5–P95 {e['p5']}–{e['p95']}) · {e['decision']}, kept in "
            f"{e['decision_stable_pct']:.0f} % of the sensitivity runs · size {e['size']} · "
            f"layer {e['layer']}"
            + (" · certification add-on" if e["certification"] else "")
            + f" · from the {e['source']}",
            *[
                f"- {c['subsystem']} {c['own_impact']} {c['layer']}"
                + (" carryover" if c["carryover"] else "")
                + (f": {c['why']}" if c["why"] else "")
                for c in e["changes"]
            ],
            *[
                f"- size of {r['subsystem']} {r['own_impact']} among {r['references']} "
                "reference change(s): "
                + "; ".join(
                    f"{side} {_reference_text(r[key])}"
                    for side, key in (
                        ("at or below", "nearest_below"),
                        ("at or above", "nearest_above"),
                    )
                    if r[key]
                )
                for r in e["size_references"]
                if r["references"]
            ],
            # what the catalogue terms matched, so a flag of rule 43 can be judged
            *[
                f"- catalogue scan for {p['subsystem']} with {', '.join(p['terms'])}: "
                + (
                    "; ".join(f"{v} {x['status']} ({x['item']})" for v, x in p["vehicles"].items())
                    or "no item"
                )
                for p in e["portfolio"]
            ],
            *flags,
        ]

    lines = [
        f"# Situation analysis – {out['scope']}",
        "",
        f"Run `{out['run_id']}` · {out['model']} · {out['prompt_version']} · "
        f"{trace['steps']} steps, {len(trace['tool_calls'])} tool calls · "
        f"{out['citations']['cited']} references cited, {len(unknown)} not verified · "
        f"{len(loose_quotes)} quotes not found in their verbatims · "
        f"effort model `{effort['model_hash']}`",
        "",
        f"**{a['headline']}**",
        "",
        a["summary"],
        "",
        "## Data coverage",
        a["data_coverage"],
        "",
        "## Insights",
    ]
    for i, hits in zip(a["insights"], out["subsystems"]["insights"], strict=True):
        lines += [
            "",
            f"### {i['title']}",
            f"{i['kind']} · {i['domain']} · confidence {i['confidence']}",
            "",
            i["statement"],
        ]
        if i["customer_quote"]:
            flag = " (not found word for word in the cited verbatims)"
            lines += [
                "",
                f"> {i['customer_quote']}" + (flag if i["customer_quote"] in loose_quotes else ""),
            ]
        lines += subsystem_line(hits)
        lines += ["", f"Evidence: {refs(i['evidence_refs'])}"]
    lines += ["", "## Recommendations (proposals for the product manager)"]
    for r, e in zip(a["recommendations"], effort["recommendations"], strict=True):
        lines += ["", f"### {r['title']} ({r['horizon']})", r["proposal"], "", r["rationale"]]
        if r["related_requirement"]:
            lines += ["", f"Existing requirement: {refs([r['related_requirement']])}"]
        lines += effort_lines(e)
        lines += subsystem_line(e["evidence_subsystems"])
        lines += ["", f"Evidence: {refs(r['evidence_refs'])}"]
    lines += [
        "",
        "## Effort of the proposals as packages",
        effort["method"] + ".",
        "Changes are combined per subsystem, so work that several proposals share counts once.",
        "",
    ]
    for p in effort["packages"]:
        lines.append(
            f"- **{p['horizon']}**: {p['proposals']} proposal(s) with a change, together "
            f"**{p['effort_pct']} %** (P5–P95 {p['p5']}–{p['p95']}) · {p['decision']}, kept in "
            f"{p['decision_stable_pct']:.0f} % of the runs · sum of the single estimates "
            f"{p['sum_of_single_pct']} %"
        )
        if p["subsystems"]:
            lines.append(
                "  - footprint: "
                + ", ".join(f"{s['name']} {s['effort_pct']} %" for s in p["subsystems"])
            )
        lines += [f"  - {f['level']} (rule {f['rule']}): {f['text']}" for f in p["flags"]]
        lines += [f"  - not counted, no usable change profile: {t}" for t in p["not_counted"]]
    if not effort["packages"]:
        lines.append("- No proposal carries a change profile.")
    if effort["open_faults"]:
        lines += ["", "Not settled by the correction request:"]
        lines += [f"- {f}" for f in effort["open_faults"]]
    lines += ["", "## Assumptions and gaps"] + [f"- {x}" for x in a["assumptions_and_gaps"]]
    lines += ["", "## Tool calls"]
    lines += [
        f"- `{c['tool']}` {c['args']} → " + (c["error"] if "error" in c else f"{c.get('total')}")
        for c in trace["tool_calls"]
    ]
    return "\n".join(lines) + "\n"

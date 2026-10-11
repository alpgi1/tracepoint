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
from tracepoint.db.models import Country, RequirementEffort, Run, Verbatim
from tracepoint.effort.cpm import Change, Engine, load_anchors, load_model, model_hash
from tracepoint.effort.store import (
    engine_and_samples,
    evaluate,
    evaluate_changes,
    horizon_flags,
)
from tracepoint.llm.gateway import LlmGateway

# v2: the loop's untrusted-data rule joins the prompt; v3: CPM effort and change profiles
PROMPT_VERSION = "situation-analysis-v3"
ACTOR = "agent:analyst"


class Insight(BaseModel):
    title: str
    kind: Literal[
        "recurring_complaint", "unmet_need", "strength", "metric_gap", "equipment_gap", "context"
    ]
    domain: str = Field(description="Vehicle domain key as written in the context pack")
    statement: str = Field(description="What the evidence shows, with its numbers")
    customer_quote: str | None = Field(description="One short verbatim quote, or null")
    evidence_refs: list[str] = Field(min_length=1)
    confidence: Literal["high", "medium", "low"]


class Recommendation(BaseModel):
    title: str
    proposal: str = Field(description="What the product manager should consider, customer-facing")
    horizon: Literal["H1", "H2"]
    rationale: str
    evidence_refs: list[str] = Field(min_length=1)
    related_requirement: str | None = Field(
        description="Id of an existing requirement (REQ-…) that already covers this, or null"
    )
    effort_changes: list[Change] | None = Field(
        description="Change profile for the effort engine: null when related_requirement is set "
        "(its stored profile is used) or when nothing on the vehicle changes"
    )


class SituationAnalysis(BaseModel):
    headline: str
    summary: str
    data_coverage: str = Field(description="Which evidence the analysis rests on and how much")
    insights: list[Insight]
    recommendations: list[Recommendation]
    assumptions_and_gaps: list[str]


SYSTEM_PROMPT = """You are the situation analyst of Tracepoint, a customer-requirements workbench for BMW product managers. You analyse one BMW model in one market, or in one country of that market, from the stored evidence. You report what customers experience, what they miss, what has to be kept, and what the product manager should look at first.

How to work
1. The user message holds the context pack of the scope. Read it first.
2. Drill down with the tools before you conclude. Read the verbatims behind the largest complaint themes and behind the strengths (get_verbatims_by_theme, search_evidence). Check the study metrics (get_metric), the catalogue (get_equipment), the sales weight (get_sales), the extracted findings (get_findings) and the requirements already derived (get_requirements). Ask for the requirements without a status filter: most are still proposed and wait for the product manager's decision. Where requirements exist, read their effort estimates and the package variations (get_effort with scenarios=true). Use search_documents for the BMW Group's strategy and delivery figures.
3. Search is lexical: when a query returns little, try the customers' other words for the same thing.
4. Stop calling tools once another call would not change the analysis. Then answer in the JSON schema.

Evidence rules
- Every insight and every recommendation lists the references it rests on in evidence_refs, copied exactly as you received them: evidence_ref values (verbatim:…, metric:…, equipment:…, sales:…, document:…) and the ids of findings and requirements (FND-…, REQ-…). A reference you were not given is rejected.
- Every number comes from the context pack or from a tool result. Use no figure from memory and no knowledge about competitors or markets that is not in the evidence.
- A customer quote is copied word for word from a verbatim you cite, and kept short.
- Say how strong the evidence is: a theme with five rows is not a theme with two hundred.

Scope of the analysis
- In scope: what customers require of the product. Features, equipment, comfort, space, usability, infotainment and digital services, design and quality perception, driving experience, range and charging as the customer experiences them, the variant and package offering.
- Out of scope: regulation and homologation, engineering specifications, pricing and business case. Dealer, service-process and finance topics are not product feedback; mention them as context at most.
- Recommendations are proposals. The product manager decides; do not write them as decisions. Where a requirement that already exists covers a recommendation, put its id in related_requirement and cite it.

Effort
- Effort is estimated with the Change Prediction Method as a share of the development effort of a new vehicle generation. It is never money, and every input of the model is an uncalibrated assumption: say so wherever effort enters your reasoning.
- Effort is a rough prioritisation factor only. What customers need comes first; effort decides the horizon and the packaging, not whether a need is real.
- You do not write an effort percentage for your own proposals. The engine computes it from a change profile and the report shows it. Figures returned by get_effort may be quoted.
- A recommendation that an existing requirement covers names it in related_requirement and leaves effort_changes null: the requirement's stored profile is used.
- Any other recommendation that changes the vehicle gives effort_changes, one entry per subsystem where the change starts: the subsystem key from the effort model in the user message, own_impact (share of that subsystem's design redone, judged against the reference points given there), the layer, carryover (true only when the catalogue or the evidence shows BMW already offers it or the platform is prepared for it), why in one sentence, and portfolio_terms (two or three German or English catalogue words for the feature; the catalogue is searched with them). List only where the change starts; the engine adds the propagation to other subsystems.
- A recommendation that changes nothing on the vehicle (keep a strength, explain a function) has neither.
- Horizon follows effort: H1 holds what stays an adaptation of the current model. A major revision or a new generation belongs to H2, or is split into an H1 step and an H2 step. Several H1 proposals add up: get_effort shows what the existing H1 requirements already come to as one package.

What the data is (name the points that bear on your conclusions under data_coverage or assumptions_and_gaps)
- Verbatims carry labels of the canonical VFC taxonomy with the types Likes, Wants, Difficult to Use and Defect. Severity runs Defect, then Difficult to Use, then Wants. Verbatims that arrived without a label were labelled by an AI assistant, not by BMW.
- The four verbatim sources A to D are not weighted against each other. Source B is call-centre notes written by an agent; they mix product feedback with process content.
- Feedback countries are grouped into four markets: EU, US (with Canada), CN, and RoW (Japan, South Korea, Australia, South Africa).
- A country scope narrows the customer verbatims only. Study metrics, sales and findings exist per market, so for a country they describe its whole market.
- The equipment catalogue is the German price list of July 2026 in EUR. Outside Germany it shows what the model line offers, not what is standard or optional in that market.
- Sales have no powertrain split. The G60 volumes include the Chinese long-wheelbase G68. The 2030 figure is a plan value.
- China has study scores and no verbatims.
- Study scores are compared with other BMW models only. There is no competitor data.
- Finding evidence levels: A means several source types, at least 20 complaint rows and a supporting study metric; B at least 10 rows or a study metric; C at least 5 rows or the catalogue alone.
- Horizons: H1 is achievable within the current generation (model-year update, software, equipment, packages, colours). H2 belongs to the successor generation, about 2030.

Write in English, plainly, for a product manager who will check your references."""

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
    ]
    return "\n".join(lines)


_EFFORT_KEYS = ("effort_pct", "p5", "p95", "decision", "decision_stable_pct", "layer", "size")


def effort_of_proposals(
    session: Session, vehicle: str, analysis: SituationAnalysis
) -> tuple[dict[str, Any], list[str]]:
    """Effort of every recommendation and of the H1 and H2 recommendations as packages, computed
    by the CPM engine. Returns the result and the faults to send back to the model: a change
    profile that breaks a rule of the model, and an effort class that does not fit the horizon."""
    engine, samples = engine_and_samples(vehicle)
    rows: list[dict[str, Any] | None] = []
    faults: list[str] = []
    packaged: dict[str, dict[str, list[Change]]] = {"H1": {}, "H2": {}}
    for n, rec in enumerate(analysis.recommendations):
        stored = (
            session.get(RequirementEffort, rec.related_requirement)
            if rec.related_requirement
            else None
        )
        if stored is not None:
            changes = [Change.model_validate(c) for c in stored.changes]
            row = {
                "source": f"change profile of {rec.related_requirement}",
                "kind": stored.kind,
                **{k: getattr(stored, k) for k in _EFFORT_KEYS},
                "certification": stored.certification,
                "subsystems": stored.subsystems[:4],
                "portfolio": stored.portfolio,
                "changes": stored.changes,
                # the stored flags judge the requirement's horizon; this is the proposal's
                "flags": [f for f in stored.flags if f["rule"] == "43"]
                + horizon_flags(
                    rec.horizon, stored.kind, stored.decision, stored.decision_stable_pct
                ),
            }
            key = rec.related_requirement  # two proposals on one requirement count once
        elif rec.effort_changes:
            changes = rec.effort_changes
            errors = [e for c in changes for e in engine.check_change(c)]
            if errors:
                rows.append({"source": "analyst's change profile", "error": "; ".join(errors)})
                faults.append(
                    f'The change profile of "{rec.title}" breaks the effort model: '
                    f"{'; '.join(errors)}. Correct effort_changes."
                )
                continue
            res = evaluate_changes(session, engine, samples, vehicle, changes, rec.horizon)
            row = {
                "source": "analyst's change profile",
                "kind": "change",
                **{k: res[k] for k in _EFFORT_KEYS},
                "certification": res["certification_add_on"],
                "subsystems": res["subsystems"][:4],
                "portfolio": res["portfolio"],
                "changes": [c.model_dump() for c in changes],
                "flags": res["flags"],
            }
            key = f"#{n}"
        else:
            rows.append(None)
            continue
        rows.append(row)
        if changes:
            packaged[rec.horizon][key] = changes
        for flag in row["flags"]:
            if flag["rule"] == "47":
                faults.append(
                    f'"{rec.title}" is {rec.horizon}, but its change profile comes to '
                    f"{row['effort_pct']} % of a new vehicle generation ({row['decision']}): "
                    f"{flag['text']}. Change the horizon, split the proposal, or correct the "
                    "change profile if it overstates the change."
                )
    packages = []
    for horizon, by_key in packaged.items():
        if not by_key:
            continue
        res = evaluate(engine, samples, [c for changes in by_key.values() for c in changes])
        packages.append(
            {
                "horizon": horizon,
                "proposals": len(by_key),
                "sum_of_single_pct": round(
                    sum(
                        r["effort_pct"]
                        for r, rec in zip(rows, analysis.recommendations, strict=True)
                        if r and "error" not in r and rec.horizon == horizon
                    ),
                    2,
                ),
                **{k: res[k] for k in _EFFORT_KEYS},
                "certification": res["certification_add_on"],
                "subsystems": res["subsystems"][:6],
                # for the product manager to weigh (split the package or accept the class);
                # not sent back to the model, which judges single proposals
                "flags": horizon_flags(
                    horizon, "change", res["decision"], res["decision_stable_pct"]
                ),
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
        return quotes + effort_of_proposals(session, vehicle, answer)[1]

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
    effort, effort_faults = effort_of_proposals(session, vehicle, result.parsed)
    effort["open_faults"] = effort_faults  # what the one correction did not settle
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


def render_analysis(out: dict[str, Any]) -> str:
    a, trace, effort = out["analysis"], out["trace"], out["effort"]
    unknown = set(out["citations"]["unknown"])
    loose_quotes = set(out["citations"]["unverified_quotes"])

    def refs(items: list[str]) -> str:
        return ", ".join(f"`{r}`" + (" (not verified)" if r in unknown else "") for r in items)

    def effort_lines(e: dict[str, Any] | None) -> list[str]:
        if e is None:
            return ["", "Effort: no change profile (nothing on the vehicle changes)."]
        if "error" in e:
            return ["", f"Effort: not computed, the {e['source']} breaks the model: {e['error']}"]
        if e["kind"] != "change":
            return ["", f"Effort: none ({e['kind'].replace('_', ' ')}), from the {e['source']}."]
        out = [
            "",
            f"Effort (CPM estimate): **{e['effort_pct']} %** of a new vehicle generation "
            f"(P5–P95 {e['p5']}–{e['p95']}) · {e['decision']}, kept in "
            f"{e['decision_stable_pct']:.0f} % of the sensitivity runs · size {e['size']} · "
            f"layer {e['layer']}"
            + (" · certification add-on" if e["certification"] else "")
            + f" · from the {e['source']}",
        ]
        out += [
            f"- {c['subsystem']} {c['own_impact']} {c['layer']}"
            + (" carryover" if c["carryover"] else "")
            + (f": {c['why']}" if c["why"] else "")
            for c in e["changes"]
        ]
        out += [f"- {f['level']} (rule {f['rule']}): {f['text']}" for f in e["flags"]]
        return out

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
    for i in a["insights"]:
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
        lines += ["", f"Evidence: {refs(i['evidence_refs'])}"]
    lines += ["", "## Recommendations (proposals for the product manager)"]
    for r, e in zip(a["recommendations"], effort["recommendations"], strict=True):
        lines += ["", f"### {r['title']} ({r['horizon']})", r["proposal"], "", r["rationale"]]
        if r["related_requirement"]:
            lines += ["", f"Existing requirement: {refs([r['related_requirement']])}"]
        lines += effort_lines(e)
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
        lines += [f"  - {f['level']} (rule {f['rule']}): {f['text']}" for f in p["flags"]]
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

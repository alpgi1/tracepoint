"""Situation analysis of one vehicle in one market or country, written by the analyst agent.

The agent starts from the context pack, drills down with the tools and answers in a fixed schema
in which every insight and recommendation cites its evidence. The analysis is a proposal for the
product manager: it reads the evidence store and changes nothing in it.
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
from tracepoint.db.models import Country, Run, Verbatim
from tracepoint.llm.gateway import LlmGateway

PROMPT_VERSION = "situation-analysis-v2"  # v2: the loop's untrusted-data rule joins the prompt
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
2. Drill down with the tools before you conclude. Read the verbatims behind the largest complaint themes and behind the strengths (get_verbatims_by_theme, search_evidence). Check the study metrics (get_metric), the catalogue (get_equipment), the sales weight (get_sales), the extracted findings (get_findings) and the requirements already derived (get_requirements). Ask for the requirements without a status filter: most are still proposed and wait for the product manager's decision. Use search_documents for the BMW Group's strategy and delivery figures.
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
        + f"\n{pack_text}"
    )
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
        check=lambda answer: [
            f'The quote "{q}" is not word for word in a verbatim its insight cites. Cite the '
            "verbatim it comes from, or remove the quote."
            for q in unverified_quotes(session, answer)
        ],
        max_steps=max_steps,
        use_cache=use_cache,
    )
    run.model_ids = {"reasoning": result.model}
    quotes = unverified_quotes(session, result.parsed)
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
            "steps": result.steps,
            "tool_calls": len(result.tool_calls),
            "cost_usd": out["trace"]["cost_usd"],
            "llm_call_ids": result.llm_call_ids,
        },
        rationale="Proposal for the product manager; nothing in the evidence store was changed",
    )
    return out


def render_analysis(out: dict[str, Any]) -> str:
    a, trace = out["analysis"], out["trace"]
    unknown = set(out["citations"]["unknown"])
    loose_quotes = set(out["citations"]["unverified_quotes"])

    def refs(items: list[str]) -> str:
        return ", ".join(f"`{r}`" + (" (not verified)" if r in unknown else "") for r in items)

    lines = [
        f"# Situation analysis – {out['scope']}",
        "",
        f"Run `{out['run_id']}` · {out['model']} · {out['prompt_version']} · "
        f"{trace['steps']} steps, {len(trace['tool_calls'])} tool calls · "
        f"{out['citations']['cited']} references cited, {len(unknown)} not verified · "
        f"{len(loose_quotes)} quotes not found in their verbatims",
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
    for r in a["recommendations"]:
        lines += ["", f"### {r['title']} ({r['horizon']})", r["proposal"], "", r["rationale"]]
        if r["related_requirement"]:
            lines += ["", f"Existing requirement: {refs([r['related_requirement']])}"]
        lines += ["", f"Evidence: {refs(r['evidence_refs'])}"]
    lines += ["", "## Assumptions and gaps"] + [f"- {x}" for x in a["assumptions_and_gaps"]]
    lines += ["", "## Tool calls"]
    lines += [
        f"- `{c['tool']}` {c['args']} → " + (c["error"] if "error" in c else f"{c.get('total')}")
        for c in trace["tool_calls"]
    ]
    return "\n".join(lines) + "\n"

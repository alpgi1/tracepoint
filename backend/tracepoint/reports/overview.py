"""The overview of the markets and the vehicles sold in them, as the landing page shows it (D-101).

Per market (China, the United States, the European Union): the 2025 units of every vehicle sold
there, the customer verbatims, the domain with the highest complaint share and the study attribute
with the lowest score; per vehicle the same, with its three weakest study attributes. Until step 19
the frontend built this file itself from the workbooks and the committed baseline reports
(``frontend/scripts/build-content.py``); the evidence store now serves it, so the map, the vehicle
screen and the analyses count from one source.

Counting basis: the classification rows the workbooks carry (origin ``given``), as the CPM view
counts them by default (``labels=given``, D-075) and the committed baselines did. The assistant's
gap labels are served by ``GET /cpm/{vehicle}?labels=all`` and stay out of this overview.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from typing import Any

import yaml
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.briefs.labels import MARKET
from tracepoint.core.settings import get_settings
from tracepoint.db.models import (
    SalesVolume,
    StudyMetric,
    TaxonomyLevel2,
    Vehicle,
    Verbatim,
    VerbatimClassification,
)

# The markets on the map, in the order of the map, with the names of the vocabulary.
MARKETS = [(code, MARKET[code]) for code in ("CN", "US", "EU")]
SALES_YEAR = 2025
COMPLAINT_TYPES = ("Defect", "Difficult to Use", "Wants")
MIN_ROWS_FOR_DOMAIN = 50  # a domain needs this many classified rows before it can be the weakest
WEAKEST_SHOWN = 3
OVERALL_KEY = "overall_satisfaction"
# The sales file reports the 5 Series in one sheet (G60_G68, stored under the G60); China sells
# the long-wheelbase G68 (config/vehicles.yaml), which carries the Chinese study scores.
SOLD_AS = {("G60", "CN"): "G68"}
# The vehicles whose study scores make up a market's study line: those with a 1-to-10 mean.
MEAN_STUDY = "CN_EU_2025"


def _domains() -> dict[str, dict[str, str]]:
    path = get_settings().config_dir / "taxonomy" / "domains.yaml"
    return yaml.safe_load(path.read_text(encoding="utf-8"))["domains"]


def _domain_rows(session: Session, vehicle: str, market: str) -> dict[str, dict[str, int]]:
    """Rows, complaints and likes per domain of the given classification rows of one scope."""
    stmt = (
        select(TaxonomyLevel2.domain_key, VerbatimClassification.feedback_type, func.count())
        .join(Verbatim, Verbatim.id == VerbatimClassification.verbatim_id)
        .join(TaxonomyLevel2, TaxonomyLevel2.id == VerbatimClassification.level2_id)
        .where(
            Verbatim.vehicle_code == vehicle,
            Verbatim.market_code == market,
            VerbatimClassification.origin == "given",
        )
        .group_by(TaxonomyLevel2.domain_key, VerbatimClassification.feedback_type)
    )
    out: dict[str, dict[str, int]] = defaultdict(lambda: {"rows": 0, "complaints": 0, "likes": 0})
    for domain, feedback, n in session.execute(stmt):
        out[domain]["rows"] += n
        if feedback in COMPLAINT_TYPES:
            out[domain]["complaints"] += n
        elif feedback == "Likes":
            out[domain]["likes"] += n
    return out


def _weakest_domain(
    rows: dict[str, dict[str, int]], names: dict[str, dict[str, str]]
) -> dict[str, Any] | None:
    ranked = sorted(
        ((k, v) for k, v in rows.items() if k != "general" and v["rows"] >= MIN_ROWS_FOR_DOMAIN),
        key=lambda kv: -(kv[1]["complaints"] / kv[1]["rows"]),
    )
    if not ranked:
        return None
    key, v = ranked[0]
    return {
        "key": key,
        "name": names[key]["name"] if key in names else key,
        "complaintShare": round(v["complaints"] / v["rows"], 3),
        "rows": v["rows"],
    }


def _scale(m: StudyMetric) -> str:
    return "1-10 mean" if m.stat_kind == "mean" else "1-7 derived mean"


def _vehicle_study(metrics: list[StudyMetric]) -> dict[str, Any] | None:
    """The three weakest attributes of one vehicle in one market, and its overall score where
    the study has one."""
    if not metrics:
        return None
    study = sorted({m.study for m in metrics})[0]
    rows = [m for m in metrics if m.study == study and m.mean is not None]
    overall = next((m for m in rows if m.attribute_key == OVERALL_KEY), None)
    ranked = sorted((m for m in rows if m.attribute_key != OVERALL_KEY), key=lambda m: m.mean)
    return {
        "sheet": study,
        "overall": round(overall.mean, 2) if overall else None,
        "weakest": [
            {"attribute": m.attribute_raw, "score": round(m.mean, 2)}
            for m in ranked[:WEAKEST_SHOWN]
        ],
        "scale": _scale(ranked[0]) if ranked else None,
    }


def _market_study(
    metrics: list[StudyMetric], market: str, vehicles: list[str]
) -> dict[str, Any] | None:
    """The attribute with the lowest score averaged over the market's vehicles of the mean study,
    with the averaged overall score."""
    rows = [
        m
        for m in metrics
        if m.study == MEAN_STUDY and m.market_code == market and m.vehicle_code in vehicles
    ]
    covered = sorted({m.vehicle_code for m in rows})
    if not covered:
        return None
    per: dict[str, list[float]] = defaultdict(list)
    names: dict[str, str] = {}
    for m in rows:
        if m.mean is not None:
            per[m.attribute_key].append(m.mean)
            names[m.attribute_key] = m.attribute_raw
    avg = {k: sum(v) / len(v) for k, v in per.items() if len(v) == len(covered)}
    overall = avg.pop(OVERALL_KEY, None)
    if not avg:
        return None
    key = min(avg, key=avg.__getitem__)
    return {
        "attribute": names[key],
        "score": round(avg[key], 2),
        "overall": round(overall, 2) if overall is not None else None,
        "scale": "1-10 mean",
        "vehicles": covered,
    }


def build_overview(session: Session) -> dict[str, Any]:
    """The landing page's content (``MarketsContent`` of frontend/lib/content/types.ts)."""
    domains = _domains()
    vehicles = {v.code: v for v in session.scalars(select(Vehicle))}
    sales = [
        s
        for s in session.scalars(select(SalesVolume).where(SalesVolume.year == SALES_YEAR))
        if s.units > 0
    ]
    verbatims = dict(
        session.execute(
            select(
                func.concat(Verbatim.vehicle_code, ":", Verbatim.market_code), func.count()
            ).group_by(Verbatim.vehicle_code, Verbatim.market_code)
        ).all()
    )
    metrics = list(session.scalars(select(StudyMetric)))
    out_markets = []
    for code, name in MARKETS:
        market_rows: dict[str, dict[str, int]] = defaultdict(
            lambda: {"rows": 0, "complaints": 0, "likes": 0}
        )
        entries = []
        for s in sorted((s for s in sales if s.market_code == code), key=lambda s: s.vehicle_code):
            vcode = SOLD_AS.get((s.vehicle_code, code), s.vehicle_code)
            v = vehicles[vcode]
            n = verbatims.get(f"{vcode}:{code}", 0)
            rows = _domain_rows(session, vcode, code) if n else {}
            for k, x in rows.items():
                for f in ("rows", "complaints", "likes"):
                    market_rows[k][f] += x[f]
            entries.append(
                {
                    "code": vcode,
                    "name": v.name,
                    "series": v.series,
                    "drawing": "G60" if vcode == "G68" else vcode,
                    "sales": {"year": SALES_YEAR, "units": s.units, "source": f"sales:{s.id}"},
                    "verbatims": n,
                    "weakestDomain": _weakest_domain(rows, domains) if n else None,
                    "study": _vehicle_study(
                        [m for m in metrics if m.vehicle_code == vcode and m.market_code == code]
                    ),
                }
            )
        out_markets.append(
            {
                "code": code,
                "name": name,
                "sales": {
                    "year": SALES_YEAR,
                    "units": sum(e["sales"]["units"] for e in entries),
                    "source": f"sales: {SALES_YEAR} units of every vehicle sold in the market",
                },
                "verbatims": {
                    "count": sum(e["verbatims"] for e in entries),
                    "source": "verbatims of the vehicles sold in the market",
                },
                "weakestDomain": _weakest_domain(market_rows, domains),
                "weakestDomainSource": "Highest complaint share among domains with at least "
                f"{MIN_ROWS_FOR_DOMAIN} classified rows, over the market's vehicles, workbook "
                "labels",
                "study": _market_study(metrics, code, [e["code"] for e in entries]),
                "vehicles": entries,
            }
        )
    return {
        "generatedAt": datetime.now(UTC).date().isoformat(),
        "dataVintage": {
            "sales": f"sales_volumes.xlsx: {SALES_YEAR} actual, 2030 plan",
            "verbatims": "feedback_hackathon.xlsx per vehicle, rows with the workbook's own labels",
            "studies": "CN_EU_2025 means (1 to 10), US_2025 distributions (1 to 7 derived mean)",
        },
        "domains": [
            {"key": k, "name": v["name"], "description": v["description"]}
            for k, v in domains.items()
        ],
        "markets": out_markets,
    }

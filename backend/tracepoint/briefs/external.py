"""External evidence as a product manager reads it (D-102).

The team's two source lists put 143 statements into the evidence store (``ingest external``):
market shares, consumer surveys, expert tests, owner complaints, rivals' moves, regulation, each
with the source it comes from, how many independent sources agree and whether its figures stood
on the fetched page. The analysts read them through a tool; this view serves the same rows to the
screens, with every code in words. Selection and order are the agents' (``external_rows``): the
rows of the market and the worldwide ones, none about another vehicle or only about subsystems the
vehicle does not have, rows about the vehicle first.
"""

from __future__ import annotations

from collections import Counter
from typing import Any

from sqlalchemy.orm import Session

from tracepoint.briefs.labels import (
    BASIS,
    EXTERNAL_KIND,
    MARKET,
    SOURCE_LEVEL,
    TRUST,
    VERIFICATION,
    VERIFIED,
)
from tracepoint.effort.subsystems import external_rows, subsystem_names


def _link(url: str | None) -> str | None:
    return url if url and url.startswith(("https://", "http://")) else None


def external_view(
    session: Session,
    market: str,
    vehicle: str | None = None,
    *,
    subsystem: str | None = None,
    topic: str | None = None,
    kind: str | None = None,
    verified_only: bool = False,
) -> dict[str, Any]:
    """The external statements of a market (and vehicle), with their words and a summary."""
    names = subsystem_names()
    rows = external_rows(session, market, vehicle, subsystem=subsystem, topic=topic, kind=kind)
    if verified_only:
        rows = [r for r in rows if r["verification"] in VERIFIED]
    items = []
    for r in rows:
        source = dict(r["source"])
        source["url"] = _link(source.get("url"))
        items.append(
            {
                **r,
                "source": source,
                "kindLabel": EXTERNAL_KIND.get(r["kind"], r["kind"]),
                "levelLabel": SOURCE_LEVEL.get(r["level"], r["level"]),
                "verified": r["verification"] in VERIFIED,
                "verificationLabel": VERIFICATION.get(r["verification"], r["verification"]),
                "trustLabel": TRUST.get(r["trust"], str(r["trust"])),
                "basisLabel": BASIS.get(r["basis"], r["basis"]),
                "regionNames": [MARKET.get(x, x) for x in r["regions"]],
                "subsystemNames": [names.get(x, x) for x in r["subsystems"]],
                "aboutVehicle": bool(vehicle and vehicle in r["vehicles"]),
            }
        )
    per = Counter(k for r in items for k in r["subsystems"])
    return {
        "market": market,
        "marketName": MARKET.get(market, market),
        "vehicle": vehicle,
        "total": len(items),
        "verified": sum(r["verified"] for r in items),
        "aboutVehicle": sum(r["aboutVehicle"] for r in items),
        "bySubsystem": dict(per.most_common()),
        "topics": sorted({r["topic"] for r in items if r["topic"]}),
        "items": items,
    }

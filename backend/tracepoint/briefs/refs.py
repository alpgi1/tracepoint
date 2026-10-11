"""Evidence references in the product manager's words (D-100).

An analysis cites its evidence as reference strings (``verbatim:G60-0248``,
``metric:MET-US-US-G60-infotainment_menu_structure``, ``external:EXT-T1-01-1``, a finding id).
``describe`` reads each of them back from the evidence store and says what it is in a line a
product manager can check: the customer's words, the study attribute with its score, the source of
an external statement with whether its figures stood on the page. One query per kind of
reference. A reference the store does not hold is said to be unknown, never dropped.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Iterable
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.briefs.labels import (
    EXTERNAL_KIND,
    FINDING_KIND,
    MARKET,
    REFERENCE_KIND,
    VERIFICATION,
    VERIFIED,
)
from tracepoint.db.models import (
    DocumentPage,
    EquipmentItem,
    ExternalEvidence,
    ExternalSource,
    Finding,
    Requirement,
    SalesVolume,
    Source,
    StudyMetric,
    TechSpec,
    Verbatim,
)
from tracepoint.effort.subsystems import load_market_rows

KIND_OF_PREFIX = {
    "verbatim": "verbatim",
    "vclass": "verbatim",
    "metric": "metric",
    "equipment": "equipment",
    "sales": "sales",
    "spec": "spec",
    "external": "external",
    "document": "document",
    "market": "market",
    "finding": "finding",
    "aggregate": "aggregate",
}
ORDER = list(REFERENCE_KIND)


def split(ref: str) -> tuple[str, str]:
    """``("verbatim", "G60-0248")`` for ``verbatim:G60-0248``; bare finding and requirement ids
    are references too."""
    if ref.startswith("FND-"):
        return "finding", ref
    if ref.startswith("REQ-"):
        return "requirement", ref
    prefix, sep, rest = ref.partition(":")
    if not sep or prefix not in KIND_OF_PREFIX:
        return "unknown", ref
    kind = KIND_OF_PREFIX[prefix]
    if kind == "verbatim":
        rest = rest.split("#")[0]  # a classification row of the verbatim
    return kind, rest


def _score(m: StudyMetric) -> str:
    if m.stat_kind == "distribution" and m.distribution:
        mean = m.distribution.get("mean_1_7", m.mean)
        top2, bottom3 = m.distribution.get("top2"), m.distribution.get("bottom3")
        parts = [f"mean {mean:.2f} on 1 to 7" if mean is not None else None]
        if top2 is not None:
            parts.append(f"{top2 * 100:.0f} % in the top two boxes")
        if bottom3 is not None:
            parts.append(f"{bottom3 * 100:.0f} % in the bottom three")
        return ", ".join(p for p in parts if p)
    return f"mean {m.mean:.2f} on 1 to 10" if m.mean is not None else "no score"


def _http(url: str | None) -> str | None:
    """Only web addresses become links on a screen."""
    return url if url and url.startswith(("https://", "http://")) else None


def describe(session: Session, refs: Iterable[str]) -> dict[str, dict[str, Any]]:
    """Reference string -> ``{ref, kind, label, text, meta, url, verified}``. ``label`` names
    the item, ``text`` holds what it says where that is the point (a customer's words, an
    external statement), ``meta`` the facts beside it; ``verified`` is set for external rows."""
    wanted: dict[str, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))
    for ref in dict.fromkeys(refs):
        kind, key = split(ref)
        wanted[kind][key].append(ref)
    found: dict[tuple[str, str], dict[str, Any]] = {}

    def put(kind: str, key: str, label: str, **extra: Any) -> None:
        found[kind, key] = {
            "kind": kind,
            "label": label,
            "text": extra.get("text"),
            "meta": extra.get("meta"),
            "url": _http(extra.get("url")),
            "verified": extra.get("verified"),
        }

    if ids := list(wanted.get("finding", {})):
        for f in session.scalars(select(Finding).where(Finding.id.in_(ids))):
            where = MARKET.get(f.market_code or "ALL", f.market_code)
            put(
                "finding",
                f.id,
                f.title,
                meta=f"{FINDING_KIND.get(f.kind, f.kind)}, evidence level {f.evidence_level}, "
                f"{f.vehicle_code} in {where}",
            )
    if ids := list(wanted.get("requirement", {})):
        for r in session.scalars(select(Requirement).where(Requirement.id.in_(ids))):
            put("requirement", r.id, r.title, meta=r.id)
    if ids := list(wanted.get("verbatim", {})):
        for v in session.scalars(select(Verbatim).where(Verbatim.id.in_(ids))):
            facts = [v.country_code, v.powertrain, v.source_label]
            put(
                "verbatim",
                v.id,
                f"Customer comment {v.id}",
                text=v.text,
                meta=", ".join(x for x in facts if x),
            )
    if ids := list(wanted.get("metric", {})):
        for m in session.scalars(select(StudyMetric).where(StudyMetric.id.in_(ids))):
            where = MARKET.get(m.market_code, m.market_code)
            put(
                "metric",
                m.id,
                m.attribute_raw,
                meta=f"study {m.study}, {m.vehicle_code} in {where}, {_score(m)}",
            )
    if ids := list(wanted.get("equipment", {})):
        for e in session.scalars(select(EquipmentItem).where(EquipmentItem.id.in_(ids))):
            facts = [
                f"catalogue of the {e.vehicle_code}",
                f"SA {e.sa_code}" if e.sa_code else None,
                f"{e.price_eur} EUR" if e.price_eur else None,
            ]
            put("equipment", e.id, e.name_en or e.name_de, meta=", ".join(x for x in facts if x))
    if ids := list(wanted.get("sales", {})):
        for s in session.scalars(select(SalesVolume).where(SalesVolume.id.in_(ids))):
            where = MARKET.get(s.market_code, s.market_code)
            kind = "plan" if s.kind == "forecast" else s.kind
            put(
                "sales",
                s.id,
                f"{s.vehicle_code} sales in {where}, {s.year}",
                meta=f"{s.units:,} units, {kind}",
            )
    if ids := list(wanted.get("spec", {})):
        for t in session.scalars(select(TechSpec).where(TechSpec.id.in_(ids))):
            value = f"{t.value} {t.unit}" if t.unit else t.value
            put(
                "spec",
                t.id,
                t.attribute_raw or t.attribute_key,
                meta=f"{value}, {t.variant_id or t.vehicle_code}",
            )
    if ids := list(wanted.get("external", {})):
        for x in session.scalars(select(ExternalEvidence).where(ExternalEvidence.id.in_(ids))):
            loc = x.locator or {}
            facts = ", ".join(
                str(f) for f in (loc.get("title"), loc.get("origin"), x.published) if f
            )
            put(
                "external",
                x.id,
                x.statement,
                meta=f"{facts}; {EXTERNAL_KIND.get(x.kind, x.kind)}, "
                f"{VERIFICATION.get(x.verification, x.verification)}",
                url=loc.get("url"),
                verified=x.verification in VERIFIED,
            )
    if ids := list(wanted.get("document", {})):
        pages = list(session.scalars(select(DocumentPage).where(DocumentPage.id.in_(ids))))
        sources = {
            s.id: s
            for s in session.scalars(
                select(Source).where(Source.id.in_({d.source_id for d in pages}))
            )
        }
        external = set(session.scalars(select(ExternalSource.source_id))) if pages else set()
        for d in pages:
            src = sources.get(d.source_id)
            name = src.name if src else d.source_id
            if d.source_id in external:
                put(
                    "document", d.id, f"{name}, part {d.page}", url=src.path_or_url if src else None
                )
            else:
                put("document", d.id, f"{name}, page {d.page}", meta=d.section)
        # A part of an external page whose text this store does not hold (the page cache is not
        # committed): its source is still known by the list's reference (DOC-EXT-<ref>-<n>).
        missing = {}
        for key in ids:
            if key.startswith("DOC-EXT-") and ("document", key) not in found:
                ref, _, n = key.removeprefix("DOC-EXT-").rpartition("-")
                missing[key] = (ref, n)
        if missing:
            by_ref = {
                e.ref: e.source_id
                for e in session.scalars(
                    select(ExternalSource).where(
                        ExternalSource.ref.in_({ref for ref, _ in missing.values()})
                    )
                )
            }
            listed = {
                x.id: x
                for x in session.scalars(select(Source).where(Source.id.in_(set(by_ref.values()))))
            }
            for key, (ref, n) in missing.items():
                if src := listed.get(by_ref.get(ref, "")):
                    put(
                        "document",
                        key,
                        f"{src.name}, part {int(n) if n.isdigit() else n}",
                        meta="page text not stored on this machine",
                        url=src.path_or_url,
                    )
    if ids := list(wanted.get("market", {})):
        rows = {r["id"]: r for r in load_market_rows()}
        for key in ids:
            if r := rows.get(key):
                put(
                    "market",
                    key,
                    r["statement"],
                    meta=f"{r['source']['title']}, {r['source']['date']}; {r['kind']} statement",
                    url=r["source"]["url"],
                )
    for key in wanted.get("aggregate", {}):
        put("aggregate", key, "Count of classified customer rows", meta=key)
    out: dict[str, dict[str, Any]] = {}
    for kind, keys in wanted.items():
        for key, refs_of_key in keys.items():
            hit = found.get((kind, key))
            for ref in refs_of_key:
                out[ref] = (
                    {"ref": ref, **hit}
                    if hit
                    else {
                        "ref": ref,
                        "kind": "unknown",
                        "label": ref,
                        "text": None,
                        "meta": "not in the evidence store",
                        "url": None,
                        "verified": None,
                    }
                )
    return out


def evidence(refs: list[str], described: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """The references of one proposal, insight or topic: how many of each kind, in words, and
    the items in a stable order (kind, then as cited)."""
    items = [described[r] for r in dict.fromkeys(refs) if r in described]
    counts = Counter(i["kind"] for i in items)
    by_kind = [
        {
            "kind": kind,
            "count": counts[kind],
            "label": REFERENCE_KIND[kind][0 if counts[kind] == 1 else 1],
        }
        for kind in ORDER
        if counts[kind]
    ]
    items.sort(key=lambda i: ORDER.index(i["kind"]))
    return {"count": len(items), "byKind": by_kind, "items": items}

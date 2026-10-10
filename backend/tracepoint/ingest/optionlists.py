"""Parse the German price and equipment catalogues (PDF) into variants, equipment items,
availability per variant, dependency notes and customer-relevant technical data.

Approach: position-based parsing with pdfplumber. Rotated column headers give the variant columns;
the ■ / □ / –,– marks under those columns give the availability; the SA code and price columns are
located from the rotated price headers. Every item records page and vertical position as locator.
Merged table cells (several colour rows sharing one price cell) are approximated by inheriting the
previous row's price and marks; such rows are flagged in the locator and counted as data-quality
notes.
"""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

import pdfplumber
import yaml
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.core.ids import slug
from tracepoint.core.settings import get_settings
from tracepoint.db.models import (
    EquipmentAvailability,
    EquipmentDependency,
    EquipmentItem,
    Run,
    TechSpec,
    VehicleVariant,
)
from tracepoint.ingest.registry import file_path, register_source

PRICE_HEADER_TEXTS = {"SA-Nr.", "EUR inkl.", "19 % MwSt.", "[EUR ohne", "MwSt.]"}
MARK_STATUS = {"■": "standard", "□": "optional"}
CODE_RE = re.compile(r"^[0-9A-Z]{3,4}$")
MONEY_RE = re.compile(r"^\d{1,3}(\.\d{3})*,[–\-]$")
NET_RE = re.compile(r"^\[\d{1,3}(\.\d{3})*,\d{2}\]$")
NUMBER_RE = re.compile(r"\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?")
WHEEL_SPEC_RE = re.compile(r"^\d+(,\d+)? J x \d+")
NO_COST = "–,–"
CONDITION_KINDS: list[tuple[str, str]] = [
    ("Nur in Verbindung", "requires"),
    ("Nur mit", "requires"),
    ("Nur für", "requires"),
    ("Nicht in Verbindung", "excludes"),
    ("Nicht mit", "excludes"),
    ("Nicht für", "excludes"),
    ("In Verbindung mit", "conditional_price"),
    ("Im Umfang", "included_in"),
    ("Hinweis", "note"),
    ("Alternativ", "alternative"),
    ("Ausstattungsalternative", "alternative"),
    ("Eine Übersicht", "cross_reference"),
    ("Voraussetzung", "requires"),
    ("Entfällt", "note"),
]
PAGE_KINDS: list[tuple[str, str]] = [
    ("FAHRZEUGPREISE", "prices"),
    ("AUSGEWÄHLTE SERIENAUSSTATTUNGEN", "standard"),
    ("RÄDER UND REIFEN", "wheels"),
    ("FARBWELT EXTERIEUR", "exterior_colours"),
    ("FARBWELT INTERIEUR", "interior"),
    ("SONDERAUSSTATTUNGEN", "options"),
    ("TECHNISCHE WERTE", "tech"),
    ("TECHNISCHE MA", "skip"),
]
MATRIX_KINDS = {"standard", "wheels", "exterior_colours", "interior", "options"}
SECTION_LABELS = {
    "standard": "Serienausstattung",
    "wheels": "Räder und Reifen",
    "exterior_colours": "Farbwelt Exterieur",
    "interior": "Farbwelt Interieur",
    "options": "Sonderausstattungen",
}
GROUP_KEYS: list[tuple[str, str]] = [
    ("AUSSTATTUNGSPAKETE", "packages"),
    ("AUSSTATTUNGSHIGHLIGHTS", "package_contents"),
    ("HIGHLIGHTS", "package_contents"),
    ("AUSSTATTUNGSUMF", "package_contents"),
    ("SERIENAUSSTATTUNG", "package_contents"),
    ("KUNSTLEDER", "upholstery"),
    ("LEDERNACHBILDUNG", "upholstery"),
    ("LEDER", "upholstery"),
    ("STOFF", "upholstery"),
    ("ALCANTARA", "upholstery"),
    ("VEGANZA", "upholstery"),
    ("LENKR", "interior"),
    ("EXTERIEUR", "exterior"),
    ("INTERIEURLEISTEN", "interior_trim"),
    ("INTERIEUR", "interior"),
    ("KONNEKTIVITÄT", "connectivity_infotainment"),
    ("ENTERTAINMENT", "connectivity_infotainment"),
    ("ANTRIEB", "drivetrain_chassis"),
    ("FAHRWERK", "drivetrain_chassis"),
    ("FAHRASSISTENZ", "driver_assistance_safety"),
    ("FAHRERASSISTENZ", "driver_assistance_safety"),
    ("ASSISTENZSYSTEME", "driver_assistance_safety"),
    ("SICHERHEIT", "driver_assistance_safety"),
    ("SICHT", "lighting_visibility"),
    ("KOMFORT UND FUNKTIONALITÄT", "comfort"),
    ("SITZKOMFORT", "comfort"),
    ("KLIMAKOMFORT", "climate"),
    ("TRANSPORT", "transport_storage"),
    ("WEITERE FUNKTIONEN", "other"),
    ("RÄDER UND REIFEN", "wheels_tyres"),
    ("UNI", "exterior_colour"),
    ("METALLIC", "exterior_colour"),
    ("LACKIERUNG", "exterior_colour"),
    ("POLSTER", "upholstery"),
]
TECH_ATTRIBUTES: list[tuple[str, str, str | None]] = [
    ("beschleunigung 0–100", "acceleration_0_100_s", "s"),
    ("beschleunigung 0-100", "acceleration_0_100_s", "s"),
    ("höchstgeschwindigkeit", "top_speed_kmh", "km/h"),
    ("elektrische reichweite", "electric_range_wltp_km", "km"),
    ("energieverbrauch, kombiniert", "energy_consumption_wltp_kwh_100km", "kWh/100 km"),
    ("kraftstoffverbrauch, kombiniert", "fuel_consumption_wltp_l_100km", "l/100 km"),
    ("energieinhalt batterie", "battery_energy_kwh", "kWh"),
    ("maximale ladeleistung ac", "ac_charging_power_kw", "kW"),
    ("maximale ladeleistung dc", "dc_charging_power_kw", "kW"),
    ("minimale ladedauer dc", "dc_charge_time_10_80_min", "min"),
    ("minimale ladedauer ac", "ac_charge_time_0_100_h", "h"),
    ("nachgeladene reichweite", "range_added_10min_hpc_km", "km"),
    ("gepäckraumvolumen", "boot_volume_l", "l"),
    ("tankinhalt", "fuel_tank_l", "l"),
    ("leergewicht", "kerb_weight_kg", "kg"),
    ("zuladung", "payload_kg", "kg"),
    ("maximale anhängelast gebremst", "towing_capacity_braked_kg", "kg"),
    ("vorbeifahrtgeräusch", "passby_noise_db", "dB(A)"),
    ("leistung in kw", "power_kw", "kW"),
    ("drehmoment in nm", "torque_nm", "Nm"),
    ("antriebsart", "drive_type", None),
    ("getriebe", "transmission", None),
    ("antriebstyp", "drive_system", None),
]
POWERTRAIN_BY_BLOCK = {
    "VOLLELEKTRISCH": ("BEV", "electric"),
    "PLUG-IN-HYBRID": ("PHEV", "plug-in hybrid"),
    "BENZINER": ("ICE", "petrol"),
    "DIESEL": ("ICE", "diesel"),
}


# --------------------------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------------------------


@dataclass
class W:
    text: str
    x0: float
    x1: float
    top: float
    size: float

    @property
    def xc(self) -> float:
        return (self.x0 + self.x1) / 2


@dataclass
class Line:
    top: float
    words: list[W]

    def text(self) -> str:
        return " ".join(w.text for w in self.words)


@dataclass
class Layout:
    kind: str
    title: str
    variant_cols: list[tuple[float, str]] = field(default_factory=list)
    sa_x: float | None = None
    price_x: float | None = None
    left_limit: float = 300.0


def _words(page) -> tuple[list[W], dict[float, str]]:
    raw = page.extract_words(extra_attrs=["size", "upright"], keep_blank_chars=False)
    words = [
        W(w["text"], float(w["x0"]), float(w["x1"]), float(w["top"]), float(w["size"]))
        for w in raw
        if w.get("upright", True) and float(w["size"]) >= 5.0
    ]
    rotated: dict[float, list[Any]] = {}
    for c in page.chars:
        if c.get("upright", True):
            continue
        rotated.setdefault(round(c["x0"]), []).append(c)
    headers = {
        float(x): "".join(ch["text"] for ch in sorted(chars, key=lambda c: -c["top"])).strip()
        for x, chars in rotated.items()
    }
    return words, headers


def _lines(words: list[W], tol: float = 2.5) -> list[Line]:
    lines: list[Line] = []
    for w in sorted(words, key=lambda w: (w.top, w.x0)):
        if lines and abs(w.top - lines[-1].top) <= tol:
            lines[-1].words.append(w)
        else:
            lines.append(Line(top=w.top, words=[w]))
    for ln in lines:
        ln.words.sort(key=lambda w: w.x0)
    return lines


def _cells(words: list[W], gap: float = 12.0) -> list[tuple[float, str]]:
    """Group horizontally adjacent words into cells; returns (x_center, text)."""
    cells: list[list[W]] = []
    for w in sorted(words, key=lambda w: w.x0):
        if cells and w.x0 - cells[-1][-1].x1 <= gap:
            cells[-1].append(w)
        else:
            cells.append([w])
    return [((c[0].x0 + c[-1].x1) / 2, " ".join(w.text for w in c)) for c in cells]


def _nearest(xc: float, columns: list[tuple[float, str]], tol: float) -> str | None:
    best = None
    best_d = tol + 1
    for x, name in columns:
        d = abs(xc - x)
        if d < best_d:
            best, best_d = name, d
    return best if best_d <= tol else None


def _money(text: str) -> Decimal | None:
    if MONEY_RE.match(text):
        return Decimal(text.replace(".", "").rstrip("–-").rstrip(","))
    return None


def _number(text: str) -> float | None:
    if ":" in text:
        return None
    m = NUMBER_RE.search(text)
    if not m:
        return None
    return float(m.group(0).replace(".", "").replace(",", "."))


def _layout(page, words: list[W], headers: dict[float, str]) -> Layout:
    title_words = [w for w in words if w.top < 70 and w.size >= 14]
    title = " ".join(w.text for w in sorted(title_words, key=lambda w: w.x0)).strip()
    kind = "other"
    for prefix, k in PAGE_KINDS:
        if title.upper().startswith(prefix):
            kind = k
            break
    layout = Layout(kind=kind, title=title)
    variant_cols = []
    for x, text in headers.items():
        if text in PRICE_HEADER_TEXTS:
            if text == "SA-Nr.":
                layout.sa_x = x
            elif text == "EUR inkl.":
                layout.price_x = x
        elif len(text) >= 2:
            variant_cols.append((x, text))
    layout.variant_cols = sorted(variant_cols)
    if kind == "other" and any(w.text == "SA-Nr." for w in words):
        layout.kind = "package"
        sa = next(w for w in words if w.text == "SA-Nr.")
        layout.sa_x = sa.x0
        eur = next((w for w in words if w.text == "EUR" and w.top == sa.top), None)
        layout.price_x = eur.x0 if eur else None
    if layout.sa_x is not None:
        layout.left_limit = layout.sa_x - 15
    elif layout.variant_cols:
        layout.left_limit = layout.variant_cols[0][0] - 15
    return layout


# --------------------------------------------------------------------------------------------
# Parse results
# --------------------------------------------------------------------------------------------


@dataclass
class ParsedItem:
    name: str
    section: str
    group: str | None
    subsection: str | None
    page: int
    top: float
    code: str | None = None
    price: Decimal | None = None
    price_note: str | None = None
    marks: dict[str, str] = field(default_factory=dict)
    description: list[str] = field(default_factory=list)
    deps: list[tuple[str, str]] = field(default_factory=list)
    inherited: bool = False
    availability_notes: dict[str, str] = field(default_factory=dict)
    package: str | None = None


@dataclass
class ParsedVariant:
    name: str
    powertrain: str | None = None
    fuel: str | None = None
    power_kw: int | None = None
    base_price: Decimal | None = None
    page: int | None = None
    order: int = 0


@dataclass
class ParseResult:
    variants: dict[str, ParsedVariant] = field(default_factory=dict)
    items: list[ParsedItem] = field(default_factory=list)
    specs: list[dict[str, Any]] = field(default_factory=list)
    dq: Counter = field(default_factory=Counter)
    pages: list[dict[str, Any]] = field(default_factory=list)


def _group_key(section_text: str | None) -> str | None:
    if not section_text:
        return None
    upper = section_text.upper()
    for needle, key in GROUP_KEYS:
        if needle in upper:
            return key
    return slug(section_text)


# --------------------------------------------------------------------------------------------
# Page parsers
# --------------------------------------------------------------------------------------------


def _parse_price_page(lines: list[Line], page_no: int, result: ParseResult) -> None:
    block: str | None = None
    variants: list[tuple[float, str]] = []
    order_base = len(result.variants)
    for i, ln in enumerate(lines):
        if ln.top < 70:
            continue
        big = [w for w in ln.words if w.size >= 11]
        if big and len(ln.words) == len(big):
            block = " ".join(w.text for w in big).upper()
            variants = []
            continue
        if block is None:
            continue
        right = [w for w in ln.words if w.x0 > 200]
        left = [w for w in ln.words if w.x0 <= 200]
        if not variants and right and not left:
            cells = _cells(right)
            for xc, name in cells:
                variants.append((xc, name))
                pv = result.variants.get(name)
                if pv is None:
                    pt, fuel = POWERTRAIN_BY_BLOCK.get(block, (None, None))
                    pv = ParsedVariant(
                        name=name,
                        powertrain=pt,
                        fuel=fuel,
                        page=page_no,
                        order=order_base + len(result.variants),
                    )
                    result.variants[name] = pv
            continue
        if not variants:
            continue
        label = " ".join(w.text for w in left)
        cells = _cells(right)
        if label.startswith("Leistung Gesamtfahrzeugantrieb"):
            for xc, text in cells:
                name = _nearest(xc, variants, 40)
                num = _number(text)
                if name and num is not None:
                    result.variants[name].power_kw = int(num)
        elif label.startswith("Mit 48 V Mild-Hybrid"):
            for xc, text in cells:
                name = _nearest(xc, variants, 40)
                if name and _number(text) is not None and result.variants[name].powertrain == "ICE":
                    result.variants[name].powertrain = "MHEV"
        elif label.startswith("FAHRZEUGGRUNDPREIS"):
            # the gross prices sit on a line within a few points above the label
            for other in lines[max(0, i - 3) : i + 3]:
                for xc, text in _cells([w for w in other.words if w.x0 > 200]):
                    money = _money(text)
                    if money is None:
                        continue
                    name = _nearest(xc, variants, 40)
                    if name:
                        result.variants[name].base_price = money


def _parse_tech_page(
    lines: list[Line], page_no: int, result: ParseResult, vehicle_code: str
) -> None:
    variants: list[tuple[float, str]] = []
    label_lines: list[tuple[int, str, list[Line]]] = []  # (index, label, value lines)
    pending_values: list[tuple[int, Line]] = []
    for i, ln in enumerate(lines):
        if ln.top < 70 or ln.top > 700:
            continue
        left = [w for w in ln.words if w.x0 <= 215]
        right = [w for w in ln.words if w.x0 > 215]
        if not variants:
            if left and left[0].text == "BMW" and right:
                variants = _cells(right)
            continue
        label = " ".join(w.text for w in left)
        if label and right:
            label_lines.append((i, label, [ln]))
        elif label and not right:
            label_lines.append((i, label, []))
        elif right and not label:
            pending_values.append((i, ln))
    # attach value-only lines to the nearest label line within 8 points
    for _, vln in pending_values:
        best = None
        best_d = 9.0
        for entry in label_lines:
            d = abs(entry[2][0].top - vln.top) if entry[2] else abs(lines[entry[0]].top - vln.top)
            if d < best_d:
                best, best_d = entry, d
        if best is not None:
            best[2].append(vln)
    for _, label, vlines in label_lines:
        low = label.lower()
        match = next(
            ((key, unit) for prefix, key, unit in TECH_ATTRIBUTES if low.startswith(prefix)), None
        )
        if match is None or not vlines:
            continue
        key, unit = match
        per_variant: dict[str, list[str]] = {}
        for vln in vlines:
            for xc, text in _cells([w for w in vln.words if w.x0 > 215], gap=9.0):
                name = _nearest(xc, variants, 30)
                if name:
                    per_variant.setdefault(name, []).append(text)
        for name, parts in per_variant.items():
            value = " ".join(parts)
            result.specs.append(
                {
                    "variant": name,
                    "key": key,
                    "raw": label,
                    "value": value,
                    "num": _number(value),
                    "unit": unit,
                    "page": page_no,
                }
            )
            if name not in result.variants:
                result.variants[name] = ParsedVariant(
                    name=name, page=page_no, order=len(result.variants)
                )
                result.dq["variant_only_on_tech_page"] += 1


def _condition_kind(text: str) -> str | None:
    for prefix, kind in CONDITION_KINDS:
        if text.startswith(prefix):
            return kind
    return None


def _marks_summary(marks: dict[str, str], price_text: str | None) -> str:
    parts = []
    if price_text:
        parts.append(price_text)
    if marks:
        parts.append("; ".join(f"{v}: {k}" for k, v in marks.items()))
    return " | ".join(parts)


def _parse_matrix_page(
    layout: Layout, lines: list[Line], page_no: int, result: ParseResult
) -> None:
    section_label = SECTION_LABELS.get(layout.kind, layout.title)
    section: str | None = None
    subsection: str | None = None
    group_label: str | None = None
    current: ParsedItem | None = None
    prev_top: float | None = None
    prev_was_heading = False

    # pass 1: features per line
    feats = []
    for ln in lines:
        if ln.top < 115 or ln.top > 785:
            continue
        marks: dict[str, str] = {}
        for w in ln.words:
            if w.text in MARK_STATUS:
                col = _nearest(w.x0, layout.variant_cols, 6)
                if col:
                    marks[col] = MARK_STATUS[w.text]
        code = None
        if layout.sa_x is not None:
            for w in ln.words:
                if abs(w.x0 - layout.sa_x) <= 10 and CODE_RE.match(w.text):
                    code = w.text
                    break
        price_text = None
        if layout.price_x is not None:
            for w in ln.words:
                if layout.price_x - 8 <= w.x0 <= layout.price_x + 14 and (
                    MONEY_RE.match(w.text) or w.text in (NO_COST, "Serie")
                ):
                    price_text = w.text
                    break
        net = any(NET_RE.match(w.text) for w in ln.words)
        left = [w for w in ln.words if w.x0 < layout.left_limit]
        left_text = " ".join(w.text for w in left).strip()
        feats.append(
            {
                "line": ln,
                "marks": marks,
                "code": code,
                "price": price_text,
                "net": net,
                "left": left_text,
                "bullet": bool(left) and left[0].text in ("–", "-", "•"),
                "size": max((w.size for w in left), default=6.0),
                "upper": bool(left_text)
                and left_text.upper() == left_text
                and any(c.isalpha() for c in left_text),
            }
        )

    def new_item(f: dict[str, Any], name: str) -> ParsedItem:
        item = ParsedItem(
            name=name,
            section=section_label,
            group=_group_key(section) if section else _group_key(section_label),
            subsection=subsection or group_label,
            page=page_no,
            top=f["line"].top,
            code=f["code"],
            marks=dict(f["marks"]),
        )
        _apply_price(item, f["price"])
        result.items.append(item)
        return item

    n = len(feats)
    i = 0
    while i < n:
        f = feats[i]
        ln: Line = f["line"]
        has_data = bool(f["marks"] or f["code"] or f["price"])
        gap = (ln.top - prev_top) if prev_top is not None else 99.0
        nxt = feats[i + 1] if i + 1 < n else None
        prv = feats[i - 1] if i > 0 else None

        if not f["left"] and f["net"] and not has_data:
            i += 1
            continue  # net price line
        if f["upper"] and not f["marks"] and not f["price"] and not f["bullet"]:
            adjacent_data = (
                nxt and abs(nxt["line"].top - ln.top) <= 6 and (nxt["marks"] or nxt["price"])
            ) or (prv and abs(prv["line"].top - ln.top) <= 6 and (prv["marks"] or prv["price"]))
            if not adjacent_data and f["code"] is None:
                if f["size"] >= 7.5:
                    section, subsection, group_label = f["left"], None, None
                else:
                    subsection, group_label = f["left"], None
                current = None
                prev_top, prev_was_heading = ln.top, True
                i += 1
                continue
        kind = _condition_kind(f["left"]) if f["left"] else None
        if kind is not None:
            if current is not None:
                summary = _marks_summary(f["marks"], f["price"])
                current.deps.append((kind, f["left"] + (f" [{summary}]" if summary else "")))
                if kind == "conditional_price" and f["marks"]:
                    for col, st in f["marks"].items():
                        if col not in current.marks:
                            current.marks[col] = st
                            current.availability_notes[col] = f["left"] + (
                                f" ({f['price']})" if f["price"] else ""
                            )
            prev_top, prev_was_heading = ln.top, False
            i += 1
            continue
        if f["bullet"]:
            if current is not None:
                current.deps.append(("includes", f["left"].lstrip("–-• ").strip()))
            prev_top, prev_was_heading = ln.top, False
            i += 1
            continue
        if (
            f["left"]
            and WHEEL_SPEC_RE.match(f["left"])
            and current is not None
            and (has_data or gap < 13)
        ):
            summary = _marks_summary(f["marks"], f["price"])
            current.description.append(f["left"] + (f" [{summary}]" if summary else ""))
            for col, st in f["marks"].items():
                if col not in current.marks:
                    current.marks[col] = st
                    current.availability_notes[col] = f["left"] + (
                        f" ({f['price']})" if f["price"] else ""
                    )
            prev_top, prev_was_heading = ln.top, False
            i += 1
            continue
        if has_data or (f["code"] and f["left"]):
            name = f["left"]
            merged_next = False
            if not name:
                # name on the adjacent line (within 6 points), e.g. package headers
                for cand in (nxt, prv):
                    if (
                        cand
                        and abs(cand["line"].top - ln.top) <= 6
                        and cand["left"]
                        and not cand["bullet"]
                        and not _condition_kind(cand["left"])
                    ):
                        name = cand["left"]
                        if cand is nxt:
                            merged_next = True
                            if cand["code"] and not f["code"]:
                                f["code"] = cand["code"]
                        break
            if not name:
                if current is not None:
                    # additional price / availability row for the current item
                    summary = _marks_summary(f["marks"], f["price"])
                    current.deps.append(("variant_price", summary))
                    for col, st in f["marks"].items():
                        if col not in current.marks:
                            current.marks[col] = st
                            current.availability_notes[col] = summary
                    result.dq["unnamed_data_row_attached"] += 1
                else:
                    result.dq["unnamed_data_row_dropped"] += 1
                prev_top, prev_was_heading = ln.top, False
                i += 1
                continue
            item = new_item(f, name)
            if not f["marks"] and not f["price"] and f["code"]:
                # merged cell: inherit from the previous item of the same block
                if (
                    nxt
                    and abs(nxt["line"].top - ln.top) <= 6
                    and (nxt["marks"] or nxt["price"])
                    and not nxt["left"]
                ):
                    item.marks = dict(nxt["marks"])
                    _apply_price(item, nxt["price"])
                    merged_next = True
                elif (
                    current is not None
                    and current.page == page_no
                    and (current.marks or current.price_note)
                ):
                    item.marks = dict(current.marks)
                    item.price, item.price_note = current.price, current.price_note
                    item.inherited = True
                    result.dq["inherited_price_rows"] += 1
            current = item
            prev_top, prev_was_heading = ln.top, False
            i += 2 if merged_next else 1
            continue
        # plain text line: group label at a block boundary, otherwise description
        if f["left"]:
            if (
                (gap >= 13 or prev_was_heading)
                and nxt
                and abs(nxt["line"].top - ln.top) <= 25
                and (nxt["marks"] or nxt["code"] or nxt["price"])
            ):
                group_label = f["left"]
                current = None
            elif current is not None:
                current.description.append(f["left"])
            elif gap >= 13 or prev_was_heading:
                group_label = f["left"]
        prev_top, prev_was_heading = ln.top, False
        i += 1


def _apply_price(item: ParsedItem, price_text: str | None) -> None:
    if price_text is None:
        return
    if price_text == "Serie":
        item.price_note = "standard"
    elif price_text == NO_COST:
        item.price = Decimal(0)
        item.price_note = "no_cost_option"
    else:
        item.price = _money(price_text)


def _parse_package_page(
    layout: Layout, lines: list[Line], page_no: int, result: ParseResult
) -> None:
    package_name = layout.title.rstrip(".").strip()
    section: str | None = None
    package_item: ParsedItem | None = None
    current: ParsedItem | None = None
    for ln in lines:
        if ln.top < 70 or ln.top > 785:
            continue
        left = [w for w in ln.words if w.x0 < layout.left_limit]
        right = [w for w in ln.words if w.x0 >= layout.left_limit]
        left_text = " ".join(w.text for w in left).strip()
        code = next((w.text for w in right if CODE_RE.match(w.text)), None)
        price_text = next(
            (w.text for w in right if MONEY_RE.match(w.text) or w.text == NO_COST), None
        )
        if not left_text:
            continue
        if left_text.upper() == left_text and any(c.isalpha() for c in left_text) and not code:
            if left_text not in ("SA-NR.",):
                section = left_text
            continue
        kind = _condition_kind(left_text)
        if kind:
            if current is not None:
                current.deps.append((kind, left_text + (f" [{price_text}]" if price_text else "")))
            continue
        if left[0].text in ("–", "-"):
            if current is not None:
                current.deps.append(("includes", left_text.lstrip("–- ").strip()))
            continue
        if code or price_text:
            item = ParsedItem(
                name=left_text,
                section=f"Paket: {package_name}",
                group=_group_key(section) if section else "packages",
                subsection=section,
                page=page_no,
                top=ln.top,
                code=code,
            )
            _apply_price(item, price_text)
            if package_item is None and (
                price_text or left_text.lower().startswith(package_name.lower()[:6])
            ):
                package_item = item
                item.group = "packages"
            else:
                item.package = package_name
                item.deps.append(("included_in", package_name))
            result.items.append(item)
            current = item
        elif current is not None and ln.top - current.top < 40:
            current.description.append(left_text)


# --------------------------------------------------------------------------------------------
# Entry points
# --------------------------------------------------------------------------------------------


def parse_catalogue(path, vehicle_code: str) -> ParseResult:
    result = ParseResult()
    with pdfplumber.open(path) as pdf:
        for page_no, page in enumerate(pdf.pages, start=1):
            words, headers = _words(page)
            layout = _layout(page, words, headers)
            lines = _lines(words)
            result.pages.append(
                {
                    "page": page_no,
                    "kind": layout.kind,
                    "title": layout.title,
                    "variants": [n for _, n in layout.variant_cols],
                }
            )
            if layout.kind == "prices":
                _parse_price_page(lines, page_no, result)
            elif layout.kind == "tech":
                _parse_tech_page(lines, page_no, result, vehicle_code)
            elif layout.kind in MATRIX_KINDS:
                for _, name in layout.variant_cols:
                    if name not in result.variants:
                        result.variants[name] = ParsedVariant(
                            name=name, page=page_no, order=len(result.variants)
                        )
                        result.dq["variant_only_in_matrix_header"] += 1
                _parse_matrix_page(layout, lines, page_no, result)
            elif layout.kind == "package":
                _parse_package_page(layout, lines, page_no, result)
    return result


def _translations() -> dict[str, str]:
    path = get_settings().config_dir / "equipment" / "translations.yaml"
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return {e["de"].strip(): e["en"].strip() for e in data.get("entries", []) if e.get("en")}


def _group_domains() -> dict[str, str]:
    path = get_settings().config_dir / "equipment" / "groups.yaml"
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return {k: v.get("domain") for k, v in (data.get("groups") or {}).items()}


def variant_id(vehicle_code: str, name: str) -> str:
    return f"{vehicle_code}-{slug(name)}"


def ingest_optionlist(session: Session, run: Run, vehicle_code: str) -> dict[str, Any]:
    key = f"optionlist_{vehicle_code.lower()}"
    source = register_source(session, run, key)
    path = file_path(key)
    result = parse_catalogue(path, vehicle_code)
    translations = _translations()
    domains = _group_domains()

    # idempotence: remove previous rows for this vehicle
    item_ids = select(EquipmentItem.id).where(EquipmentItem.vehicle_code == vehicle_code)
    session.execute(
        delete(EquipmentAvailability).where(EquipmentAvailability.equipment_item_id.in_(item_ids))
    )
    session.execute(
        delete(EquipmentDependency).where(EquipmentDependency.equipment_item_id.in_(item_ids))
    )
    session.execute(delete(EquipmentItem).where(EquipmentItem.vehicle_code == vehicle_code))
    session.execute(delete(TechSpec).where(TechSpec.vehicle_code == vehicle_code))
    session.execute(delete(VehicleVariant).where(VehicleVariant.vehicle_code == vehicle_code))
    session.flush()

    variant_rows: dict[str, VehicleVariant] = {}
    for name, pv in sorted(result.variants.items(), key=lambda kv: kv[1].order):
        row = VehicleVariant(
            id=variant_id(vehicle_code, name),
            vehicle_code=vehicle_code,
            name=name,
            powertrain=pv.powertrain,
            fuel=pv.fuel,
            drive="all-wheel" if "xDrive" in name else None,
            power_kw=pv.power_kw,
            base_price_eur=pv.base_price,
            column_order=pv.order,
            source_id=source.id,
            locator={"file": path.name, "page": pv.page},
            created_run_id=run.id,
        )
        variant_rows[name] = row
    session.add_all(variant_rows.values())
    session.flush()

    untranslated = 0
    items_out: list[EquipmentItem] = []
    avail_out: list[EquipmentAvailability] = []
    deps_out: list[EquipmentDependency] = []
    for n, pi in enumerate(result.items, start=1):
        item_id = f"EQ-{vehicle_code}-{n:04d}"
        name_en = translations.get(pi.name)
        if name_en is None:
            untranslated += 1
        description = "\n".join(pi.description) if pi.description else None
        items_out.append(
            EquipmentItem(
                id=item_id,
                vehicle_code=vehicle_code,
                sa_code=pi.code,
                name_de=pi.name[:300],
                name_en=name_en[:300] if name_en else None,
                section=pi.section,
                group_key=pi.group,
                domain_key=domains.get(pi.group) if pi.group else None,
                description_de=description,
                description_en=None,
                price_eur=pi.price,
                price_note=pi.price_note or ("inherited" if pi.inherited else None),
                source_id=source.id,
                locator={
                    "file": path.name,
                    "page": pi.page,
                    "y": round(pi.top, 1),
                    "subsection": pi.subsection,
                    "inherited": pi.inherited,
                    "package": pi.package,
                },
                created_run_id=run.id,
            )
        )
        for vname, vrow in variant_rows.items():
            status = pi.marks.get(vname)
            if status is None:
                if (
                    pi.section == "Serienausstattung"
                    or pi.package
                    or pi.section.startswith("Paket")
                ):
                    continue
                if not pi.marks and not pi.price_note:
                    continue
                status = "not_available"
            elif status == "optional" and pi.price_note == "no_cost_option":
                status = "no_cost_option"
            avail_out.append(
                EquipmentAvailability(
                    equipment_item_id=item_id,
                    variant_id=vrow.id,
                    status=status,
                    note=pi.availability_notes.get(vname),
                )
            )
        for kind, text in pi.deps:
            deps_out.append(
                EquipmentDependency(equipment_item_id=item_id, kind=kind, text=text[:2000])
            )
    session.add_all(items_out)
    session.flush()
    session.add_all(avail_out)
    session.add_all(deps_out)

    spec_rows: list[TechSpec] = []
    seen: set[str] = set()
    for s in result.specs:
        vrow = variant_rows.get(s["variant"])
        if vrow is None:
            result.dq["spec_variant_unknown"] += 1
            continue
        sid = f"SPEC-{vrow.id}-{s['key']}"[:96]
        if sid in seen:
            result.dq["spec_duplicate"] += 1
            continue
        seen.add(sid)
        spec_rows.append(
            TechSpec(
                id=sid,
                vehicle_code=vehicle_code,
                variant_id=vrow.id,
                attribute_key=s["key"],
                attribute_raw=s["raw"][:200],
                value=s["value"][:120],
                value_num=s["num"],
                unit=s["unit"],
                source_id=source.id,
                locator={"file": path.name, "page": s["page"]},
                created_run_id=run.id,
            )
        )
    session.add_all(spec_rows)
    session.flush()

    stats: dict[str, Any] = {
        "pages": len(result.pages),
        "variants": len(variant_rows),
        "items": len(items_out),
        "availability_rows": len(avail_out),
        "dependencies": len(deps_out),
        "tech_specs": len(spec_rows),
        "untranslated_items": untranslated,
        **{f"dq_{k}": v for k, v in result.dq.items()},
    }
    record_event(
        session,
        actor_type="system",
        actor_id="ingest.optionlists",
        action="optionlist.ingested",
        entity_type="source",
        entity_id=source.id,
        run_id=run.id,
        after={**stats, "page_kinds": [(p["page"], p["kind"]) for p in result.pages]},
        rationale=f"Position-based parse of {path.name}; merged cells approximated by inheritance",
    )
    return stats

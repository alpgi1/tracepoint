"""External evidence (Phase 2, D-007): the team's two source lists become a registry of
sources, claims with a locator, and snapshots of the pages.

Inputs
- ``docs/trend_sources.md`` (trend sources, one key-figure cell each) and
  ``docs/external_sources_v2.json`` (sources with access notes), in Turkish as the team wrote
  them. They are parsed as they are; an entry of the second list gets the id ``E-<position>``.
- ``config/external/evidence.yaml``, the authored reading of the two lists: which entries are
  in the scope of the programme and why the others are not, an English title, the institution
  the data comes from, and one claim per statement with its regions, CPM subsystems and
  vehicles.
- ``config/external/fetched.json``, written by ``--fetch``: what every URL returned, whether a
  claim's figures stand on the page, the passage they stand in, and the claims computed from
  the two public APIs.

The pages themselves are a local cache under ``data/external/`` and are not committed, because
they are third-party text. A rebuild without the cache still loads every source and every claim
with its verification; only the searchable page text needs ``--fetch`` once.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import time
from collections import Counter
from datetime import UTC, date, datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Literal
from urllib.parse import quote, urlsplit
from urllib.robotparser import RobotFileParser

import httpx
import yaml
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.core.settings import get_settings
from tracepoint.db.models import DocumentPage, ExternalEvidence, ExternalSource, Run, Source
from tracepoint.effort.subsystems import subsystem_names

USER_AGENT = (
    "Mozilla/5.0 (compatible; TracepointResearch/0.1; +https://github.com/alpgi1/tracepoint)"
)
ROBOTS_NAME = "TracepointResearch"  # the name robots.txt rules are matched against
MAX_BYTES = 30_000_000
MAX_PDF_PAGES = 150
HOST_PAUSE_SECONDS = 1.0
PAGE_CHARS = 1800  # size of one searchable chunk of a web page
EXCERPT_WINDOW = 600  # the figures of a claim stand together within this many characters
VEHICLES = ("F70", "G60", "G68", "G70")
REGIONS = ("EU", "US", "CN", "Global")
LEVELS = {1: "weak", 2: "medium"}  # by independent sources; three or more are strong (rule 34)

_REGION = {"Europe": "EU", "USA": "US", "China": "CN"}
_TRUST = {"Yüksek": 4, "Orta-yüksek": 3, "Orta": 2, "Düşük": 1}
_FEEDS = {
    "Pazar momentumu": "market_momentum",
    "Müşteri çekişi": "customer_pull",
    "Çelişki girdisi": "contradiction_input",
}
_VERIFIED = {"evet": "yes", "kısmen": "partly", "hayır": "no"}
_STATUS = {
    "core": "core",
    "ikincil": "secondary",
    "tut": "keep",
    "ekle": "add",
    "değiştir": "replace",
    "çıkar": "drop",
}
_CATEGORY = {
    "Kalite ve memnuniyet": "quality_satisfaction",
    "Uzman testleri": "expert_tests",
    "Sahip sesi": "owner_voice",
    "Rakip spec ve konfigüratör": "competitor_spec",
    "Trend ve sektör yönü": "trend",
}
# evidence layer of the master plan (section 4.2) per family of the lists
_LAYER = {
    "P": "regional_demand",
    "quality_satisfaction": "quantitative_metrics",
    "expert_tests": "quantitative_metrics",
    "owner_voice": "voice_of_customer",
    "competitor_spec": "competition",
}
_MONTHS = "Ocak Şubat Mart Nisan Mayıs Haziran Temmuz Ağustos Eylül Ekim Kasım Aralık".split()


# --------------------------------------------------------------------------------------------
# The two lists
# --------------------------------------------------------------------------------------------


def _published(raw: str) -> str | None:
    """ISO form of what the list says about the publication date: the latest full date, else
    month and year, else the year."""
    days = [f"{y}-{m}-{d}" for d, m, y in re.findall(r"(\d{2})\.(\d{2})\.(\d{4})", raw)]
    if days:
        return max(days)
    month = re.search(rf"({'|'.join(_MONTHS)})\s+(\d{{4}})", raw)
    if month:
        return f"{month.group(2)}-{_MONTHS.index(month.group(1)) + 1:02d}"
    year = re.search(r"\d{4}", raw)
    return year.group() if year else None


def read_trend_sources(path: Path) -> list[dict[str, Any]]:
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 9 or not re.fullmatch(r"[A-Z]\d?-\d{2}", cells[0]):
            continue
        link = re.fullmatch(r"\[(.+)\]\((\S+)\)", cells[1])
        if not link:
            raise ValueError(f"{path.name}: {cells[0]} has no linked source")
        family = cells[0].rsplit("-", 1)[0]
        out.append(
            {
                "ref": cells[0],
                "list": path.name,
                "family": family,
                "layer": _LAYER.get(family, "market_trends"),
                "name": link.group(1),
                "url": link.group(2),
                "regions": [r.strip() for r in cells[2].split(",")],
                "published": _published(cells[3]),
                "trust": int(cells[5]),
                "feeds": [_FEEDS[f.strip()] for f in cells[6].split(",")],
                "status": _STATUS[cells[7]],
                "listed": {"key_data": cells[4], "verified": _VERIFIED[cells[8]]},
            }
        )
    return out


def read_source_list(path: Path) -> list[dict[str, Any]]:
    out = []
    for n, e in enumerate(json.loads(path.read_text(encoding="utf-8")), 1):
        family = _CATEGORY[e["category"]]
        out.append(
            {
                "ref": f"E-{n:02d}",
                "list": path.name,
                "family": family,
                "layer": _LAYER.get(family, "market_trends"),
                "name": e["institution"],
                "url": e["url"] if e["url"].startswith("http") else None,
                "regions": [_REGION[e["region"]]],
                "published": None,
                "trust": _TRUST[e["trust_level"]],
                "feeds": [],
                "status": _STATUS[e["status"]],
                "listed": {
                    k: e[k] for k in ("description", "scope_fit", "access", "usage", "focus")
                },
            }
        )
    return out


# --------------------------------------------------------------------------------------------
# The authored reading (config/external/evidence.yaml)
# --------------------------------------------------------------------------------------------

Kind = Literal[
    "market_share",
    "market_context",
    "consumer_pull",
    "infrastructure",
    "owner_voice",
    "expert_test",
    "quality_index",
    "competitor_move",
    "bmw_offer",
    "official_spec",
    "regulation_context",
]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Claim(_Strict):
    statement: str
    kind: Kind
    subsystems: list[str] = []
    regions: list[str] | None = None  # default: the regions of the source
    vehicles: list[str] | None = None  # default: the vehicles of the source
    topic: str | None = None  # claims of one topic and region support each other
    side: Literal["for", "against"] = "for"
    basis: Literal["evidence", "assumption"] = "evidence"
    figures: list[str] | None = None  # default: the numbers of the statement, years left out
    quote: str | None = None  # for a claim without figures: words that stand on the page


class SourceEntry(_Strict):
    title: str
    origin: str  # the institution the data comes from; independence is counted on it
    type: Literal["primary", "secondary"] = "primary"
    fetch: Literal["auto", "api", "manual", "none"] | None = None
    why_not_fetched: str | None = None
    api: Literal["nhtsa_complaints", "epa_fueleconomy"] | None = None
    models: dict[str, dict[str, Any]] = {}  # per vehicle: from_year and model-name pattern
    vehicles: list[str] = []  # the page is about these vehicles: its text is stored
    access: str | None = None
    lang: str = "en"
    claims: list[Claim] = []


class Contradiction(_Strict):
    id: str
    claims: list[str] = Field(min_length=2)
    for_: str = Field(alias="for")
    against: str


class Overlay(_Strict):
    version: int
    excluded: dict[str, str]
    sources: dict[str, SourceEntry]
    contradictions: list[Contradiction] = []


def external_dir() -> Path:
    return get_settings().config_dir / "external"


def cache_dir() -> Path:
    return get_settings().data_dir / "external"


def source_id(ref: str) -> str:
    return f"SRC-EXT-{ref}"


_NUMBER = re.compile(r"(?<![\w.,])\d[\d,]*(?:\.\d+)?")


def claim_figures(statement: str) -> list[str]:
    """The numbers a statement asserts: years and single digits are left out, they stand on
    any page."""
    out: list[str] = []
    for m in _NUMBER.finditer(statement):
        fig = m.group().rstrip(",").replace(",", "")
        if re.fullmatch(r"(19|20)\d\d|\d", fig) or fig in out:
            continue
        out.append(fig)
    return out


def load_registry() -> dict[str, Any]:
    """The two lists joined with the authored reading. Raises when an entry of a list is
    neither in scope nor excluded with a reason, so a new row in a list cannot slip by."""
    docs = get_settings().docs_dir
    listed = read_trend_sources(docs / "trend_sources.md") + read_source_list(
        docs / "external_sources_v2.json"
    )
    overlay = Overlay.model_validate(
        yaml.safe_load((external_dir() / "evidence.yaml").read_text(encoding="utf-8"))
    )
    refs = {e["ref"] for e in listed}
    decided = set(overlay.sources) | set(overlay.excluded)
    if refs != decided or set(overlay.sources) & set(overlay.excluded):
        raise ValueError(
            "evidence.yaml and the lists disagree: undecided "
            f"{sorted(refs - decided)}, unknown {sorted(decided - refs)}, both in scope and "
            f"excluded {sorted(set(overlay.sources) & set(overlay.excluded))}"
        )
    known = set(subsystem_names())
    sources, claims = [], []
    for entry in listed:
        ref = entry["ref"]
        if ref in overlay.excluded:
            continue
        spec = overlay.sources[ref]
        deep_link = bool(entry["url"]) and urlsplit(entry["url"]).path.strip("/") != ""
        fetch = spec.fetch or ("api" if spec.api else "auto" if deep_link else "none")
        why = spec.why_not_fetched
        if fetch == "none" and not why:
            why = "the list gives the home page, which addresses no content"
        if fetch in ("manual", "none") and not why:
            raise ValueError(f"evidence.yaml: {ref} is not fetched and gives no reason")
        if set(spec.vehicles) - set(VEHICLES):
            raise ValueError(f"evidence.yaml: {ref} names an unknown vehicle")
        sources.append({**entry, "spec": spec, "fetch": fetch, "why_not_fetched": why})
        for n, c in enumerate(spec.claims, 1):
            regions = c.regions or entry["regions"]
            vehicles = spec.vehicles if c.vehicles is None else c.vehicles
            if set(c.subsystems) - known or set(regions) - set(REGIONS):
                raise ValueError(f"evidence.yaml: {ref} claim {n}: unknown subsystem or region")
            if set(vehicles) - set(VEHICLES):
                raise ValueError(f"evidence.yaml: {ref} claim {n}: unknown vehicle")
            claims.append(
                {
                    "id": f"EXT-{ref}-{n}",
                    "ref": ref,
                    "origin": spec.origin,
                    "kind": c.kind,
                    "topic": c.topic,
                    "side": c.side,
                    "regions": regions,
                    "subsystems": c.subsystems,
                    "vehicles": vehicles,
                    "statement": c.statement,
                    "basis": c.basis,
                    "figures": claim_figures(c.statement) if c.figures is None else c.figures,
                    "quote": c.quote,
                }
            )
    by_id = {c["id"]: c for c in claims}
    for con in overlay.contradictions:
        for cid in con.claims:
            if cid not in by_id:
                raise ValueError(f"evidence.yaml: contradiction {con.id} names unknown {cid}")
            by_id[cid]["contradiction"] = {"id": con.id, "for": con.for_, "against": con.against}
    return {
        "listed": listed,
        "excluded": overlay.excluded,
        "sources": sources,
        "claims": claims,
    }


def set_levels(claims: list[dict[str, Any]]) -> None:
    """Evidence level by rule 34: the number of independent institutions that state the same
    thing for a shared region. Another institution counts only if its statement was found on
    its page (``verified``); claims without a topic stand alone."""
    for c in claims:
        origins = {c["origin"]}
        if c.get("topic"):
            origins |= {
                o["origin"]
                for o in claims
                if o.get("topic") == c["topic"]
                and o.get("side", "for") == c.get("side", "for")
                and o.get("verified", True)
                and set(o["regions"]) & set(c["regions"])
            }
        c["sources_agreeing"] = len(origins)
        c["level"] = LEVELS.get(len(origins), "strong")


# --------------------------------------------------------------------------------------------
# Snapshots: fetch once, keep the raw answer, read its text
# --------------------------------------------------------------------------------------------


class _PageText(HTMLParser):
    """Visible text of a page, one line per block element, without scripts, navigation and
    forms. ``inner`` is the part inside an article or main element."""

    SKIP = frozenset(
        "script style noscript svg template iframe form button select nav aside footer".split()
    )
    BLOCK = frozenset(
        "p li h1 h2 h3 h4 h5 h6 tr br div section blockquote figcaption dt dd table ul ol "
        "title header".split()
    )

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.open: list[str] = []  # skipped elements we are inside of
        self.main = 0
        self.all: list[str] = []
        self.inner: list[str] = []

    def _emit(self, text: str) -> None:
        if not self.open:
            self.all.append(text)
            if self.main:
                self.inner.append(text)

    def handle_starttag(self, tag: str, attrs: Any) -> None:
        if tag in self.SKIP or (tag == "header" and not self.main):
            self.open.append(tag)
        elif tag in ("article", "main"):
            self.main += 1
        self._emit("\n" if tag in self.BLOCK else " ")

    def handle_endtag(self, tag: str) -> None:
        if self.open and self.open[-1] == tag:
            self.open.pop()
        elif tag in ("article", "main") and self.main:
            self.main -= 1
        self._emit("\n" if tag in self.BLOCK else " ")

    def handle_data(self, data: str) -> None:
        self._emit(data)


def _lines(text: str) -> str:
    out: list[str] = []
    for line in text.split("\n"):
        line = " ".join(line.split())
        if line and (not out or out[-1] != line):
            out.append(line)
    return "\n".join(out)


_meta_charset = re.compile(rb"charset=[\"']?([\w-]+)", re.I)
_article_body = re.compile(r'"articleBody"\s*:\s*"((?:[^"\\]|\\.)*)"')
_CHALLENGE = (
    "just a moment",
    "enable javascript and cookies",
    "access denied",
    "are you a robot",
    "verify you are human",
    "captcha",
)


def html_text(raw: bytes, content_type: str = "") -> str:
    found = _meta_charset.search(content_type.encode()) or _meta_charset.search(raw[:4096])
    try:
        html = raw.decode(found.group(1).decode() if found else "utf-8", errors="replace")
    except LookupError:
        html = raw.decode("utf-8", errors="replace")
    parser = _PageText()
    parser.feed(html)
    whole, inner = _lines("".join(parser.all)), _lines("".join(parser.inner))
    text = inner if len(inner) >= 1500 or len(inner) >= 0.3 * len(whole) else whole
    if len(text) < 400:  # pages rendered by script often still carry the article as metadata
        body = _article_body.search(html)
        if body:
            text = _lines(json.loads(f'"{body.group(1)}"'))
    return text


def pdf_pages(raw: bytes) -> list[str]:
    import pdfplumber

    with pdfplumber.open(io.BytesIO(raw)) as pdf:
        return [_lines(p.extract_text() or "") for p in pdf.pages[:MAX_PDF_PAGES]]


def _write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, indent=1, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8"
    )


class Fetcher:
    """One polite client: it says who it is, asks robots.txt, waits between two requests to a
    host, and never retries a refusal."""

    def __init__(self) -> None:
        self.client = httpx.Client(
            headers={"User-Agent": USER_AGENT, "Accept-Language": "en,de;q=0.8,zh;q=0.6"},
            follow_redirects=True,
            timeout=40.0,
        )
        self.robots: dict[str, RobotFileParser | None] = {}
        self.last: dict[str, float] = {}

    def _wait(self, host: str) -> None:
        pause = self.last.get(host, 0) + HOST_PAUSE_SECONDS - time.monotonic()
        if pause > 0:
            time.sleep(pause)
        self.last[host] = time.monotonic()

    def allowed(self, url: str) -> bool:
        parts = urlsplit(url)
        host = f"{parts.scheme}://{parts.netloc}"
        if host not in self.robots:
            rules: RobotFileParser | None = None
            try:
                self._wait(parts.netloc)
                res = self.client.get(f"{host}/robots.txt")
                if res.status_code == 200 and "<html" not in res.text[:500].lower():
                    rules = RobotFileParser()
                    rules.parse(res.text.splitlines())
            except httpx.HTTPError:
                pass  # no readable rules: the page request decides
            self.robots[host] = rules
        rules = self.robots[host]
        return rules is None or rules.can_fetch(ROBOTS_NAME, url)

    def get(self, url: str, **kw: Any) -> httpx.Response:
        self._wait(urlsplit(url).netloc)
        return self.client.get(url, **kw)

    def snapshot(self, url: str) -> tuple[dict[str, Any], bytes | None]:
        """(record of the request, body or None). Nothing is raised: a refusal is a result."""
        record: dict[str, Any] = {
            "url": url,
            "fetched_at": datetime.now(UTC).isoformat(timespec="seconds"),
        }
        try:
            if not self.allowed(url):
                return {**record, "status": "blocked_by_robots"}, None
            res = self.get(url)
        except httpx.HTTPError as exc:
            return {**record, "status": "error", "detail": type(exc).__name__}, None
        record |= {
            "http_status": res.status_code,
            "final_url": str(res.url),
            "content_type": res.headers.get("content-type", "").split(";")[0].strip(),
        }
        if res.status_code != 200:
            return {**record, "status": f"http_{res.status_code}"}, None
        body = res.content
        if len(body) > MAX_BYTES:
            return {**record, "status": "too_large", "bytes": len(body)}, None
        charset = res.headers.get("content-type", "")
        record |= {
            "status": "fetched",
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
            "charset_header": charset if "charset" in charset.lower() else None,
        }
        return record, body


def _is_pdf(record: dict[str, Any], body: bytes) -> bool:
    return body[:5] == b"%PDF-" or record.get("content_type") == "application/pdf"


def _read_pages(record: dict[str, Any], body: bytes) -> list[str]:
    if _is_pdf(record, body):
        return pdf_pages(body)
    return [html_text(body, record.get("charset_header") or "")]


def fetch_page(fetcher: Fetcher, ref: str, url: str) -> dict[str, Any]:
    """Fetch one page into the cache (raw body, record, text) unless it is there already."""
    folder = cache_dir() / ref
    meta = folder / "meta.json"
    if meta.exists():
        return json.loads(meta.read_text(encoding="utf-8"))
    record, body = fetcher.snapshot(url)
    folder.mkdir(parents=True, exist_ok=True)
    if body is not None:
        try:
            pages = _read_pages(record, body)
        except Exception as exc:  # a broken PDF or page is a result, not a crash
            pages, record["status"], record["detail"] = [], "unreadable", type(exc).__name__
        text = "\f".join(pages)
        record |= {"format": "pdf" if _is_pdf(record, body) else "html", "chars": len(text)}
        if (
            record["status"] == "fetched"
            and len(text) < 1500
            and any(w in text.lower() for w in _CHALLENGE)
        ):
            record["status"] = "bot_challenge"
        elif record["status"] == "fetched" and len(text) < 200:
            record["status"] = "no_text"
        (folder / "body").write_bytes(body)
        (folder / "text.txt").write_text(text, encoding="utf-8")
    _write_json(meta, record)
    return record


def cached_pages(ref: str) -> list[str] | None:
    """Text of a cached snapshot, one entry per PDF page (one for a web page)."""
    path = cache_dir() / ref / "text.txt"
    return path.read_text(encoding="utf-8").split("\f") if path.exists() else None


# --------------------------------------------------------------------------------------------
# The two public APIs: owner complaints (NHTSA) and official range figures (EPA)
# --------------------------------------------------------------------------------------------

NHTSA = "https://api.nhtsa.gov"
EPA = "https://www.fueleconomy.gov/ws/rest/vehicle"


def _json(fetcher: Fetcher, url: str) -> Any:
    res = fetcher.get(url, headers={"Accept": "application/json"})
    res.raise_for_status()
    return res.json() if res.content.strip() else None


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else [] if value is None else [value]


def fetch_nhtsa(fetcher: Fetcher, src: dict[str, Any]) -> dict[str, Any]:
    """Every complaint an owner filed with NHTSA for the model names of our vehicles."""
    this_year = date.today().year
    complaints: dict[int, dict[str, Any]] = {}
    for vehicle, rule in src["spec"].models.items():
        pattern = re.compile(rule["pattern"])
        for year in range(rule["from_year"], this_year + 2):
            listed = _json(
                fetcher, f"{NHTSA}/products/vehicle/models?modelYear={year}&make=BMW&issueType=c"
            )
            for model in sorted({m["model"] for m in listed["results"]}):
                if not pattern.search(model):
                    continue
                rows = _json(
                    fetcher,
                    f"{NHTSA}/complaints/complaintsByVehicle?make=BMW"
                    f"&model={quote(model)}&modelYear={year}",
                )["results"]
                for r in rows:
                    complaints.setdefault(
                        r["odiNumber"],
                        {
                            "odi_number": r["odiNumber"],
                            "vehicle": vehicle,
                            "model": model,
                            "model_year": year,
                            "filed": r["dateComplaintFiled"],
                            "components": r["components"],
                            "crash": r["crash"],
                            "fire": r["fire"],
                            "summary": r["summary"],
                        },
                    )
    return {"complaints": sorted(complaints.values(), key=lambda c: c["odi_number"])}


def nhtsa_claims(data: dict[str, Any], read_on: str) -> list[dict[str, Any]]:
    out = []
    for vehicle in sorted({c["vehicle"] for c in data["complaints"]}):
        rows = [c for c in data["complaints"] if c["vehicle"] == vehicle]
        years = sorted({c["model_year"] for c in rows})
        parts = Counter(p.strip().title() for c in rows for p in c["components"].split(","))
        top = ", ".join(f"{name} {n}" for name, n in parts.most_common(5))
        out.append(
            {
                "kind": "owner_voice",
                "vehicles": [vehicle],
                "regions": ["US"],
                "subsystems": [],
                "statement": (
                    f"NHTSA lists {len(rows)} owner complaints for the BMW {vehicle} (filed "
                    f"under {', '.join(sorted({c['model'].title() for c in rows}))}; model "
                    f"years {years[0]} to {years[-1]}), read on {read_on}. Components named "
                    f"most often (a complaint can name several): {top}. These are safety and "
                    "defect complaints, not a satisfaction measure."
                ),
            }
        )
    return out


def fetch_epa(fetcher: Fetcher, src: dict[str, Any]) -> dict[str, Any]:
    """Official EPA range and consumption of every US variant of our vehicles."""
    this_year = date.today().year
    variants = []
    for vehicle, rule in src["spec"].models.items():
        pattern = re.compile(rule["pattern"])
        for year in range(rule["from_year"], this_year + 2):
            menu = _json(fetcher, f"{EPA}/menu/model?year={year}&make=BMW")
            for model in [m["value"] for m in _as_list((menu or {}).get("menuItem"))]:
                if not pattern.search(model):
                    continue
                options = _json(
                    fetcher, f"{EPA}/menu/options?year={year}&make=BMW&model={quote(model)}"
                )
                for option in _as_list((options or {}).get("menuItem")):
                    v = _json(fetcher, f"{EPA}/{option['value']}")
                    variants.append(
                        {
                            "epa_id": int(option["value"]),
                            "vehicle": vehicle,
                            "model": model,
                            "model_year": year,
                            "drive": v.get("atvType") or "ICE",
                            "fuel": v.get("fuelType"),
                            "range_mi": int(v.get("range") or 0),
                            "electric_range_mi": int(float(v.get("rangeA") or 0) or 0)
                            if v.get("atvType") == "Plug-in Hybrid"
                            else None,
                            "combined_mpg": int(v.get("comb08") or 0),
                            "city_mpg": int(v.get("city08") or 0),
                            "highway_mpg": int(v.get("highway08") or 0),
                            "charge_240v_hours": float(v.get("charge240") or 0) or None,
                        }
                    )
    return {"variants": sorted(variants, key=lambda v: v["epa_id"])}


def epa_claims(data: dict[str, Any]) -> list[dict[str, Any]]:
    """One claim per vehicle, model year and kind of drive, with every variant in it."""
    groups: dict[tuple[str, int, str], list[dict[str, Any]]] = {}
    for v in data["variants"]:
        groups.setdefault((v["vehicle"], v["model_year"], v["drive"]), []).append(v)
    out = []
    for (vehicle, year, drive), rows in sorted(groups.items()):
        if drive == "EV":
            body = "; ".join(
                f"{r['model']} {r['range_mi']} mi, {r['combined_mpg']} MPGe" for r in rows
            )
            what, subsystems = "EPA range and combined consumption", ["hv_battery"]
        elif drive == "Plug-in Hybrid":
            body = "; ".join(
                f"{r['model']} {r['electric_range_mi']} mi electric, {r['combined_mpg']} mpg "
                "on petrol"
                for r in rows
            )
            what, subsystems = "EPA electric range and combined consumption", ["hv_battery"]
        else:
            body = "; ".join(
                f"{r['model']} {r['combined_mpg']} mpg ({r['city_mpg']} city, "
                f"{r['highway_mpg']} highway)"
                for r in rows
            )
            what, subsystems = "EPA combined consumption", ["powertrain"]
        out.append(
            {
                "kind": "official_spec",
                "vehicles": [vehicle],
                "regions": ["US"],
                "subsystems": subsystems,
                "statement": f"{what}, model year {year} (official US figures): {body}.",
            }
        )
    return out


def fetch_api(fetcher: Fetcher, src: dict[str, Any]) -> dict[str, Any]:
    """Run an API source into the cache unless it is there already; returns its record."""
    folder = cache_dir() / src["ref"]
    meta = folder / "meta.json"
    if meta.exists():
        return json.loads(meta.read_text(encoding="utf-8"))
    record: dict[str, Any] = {
        "url": src["url"],
        "fetched_at": datetime.now(UTC).isoformat(timespec="seconds"),
    }
    folder.mkdir(parents=True, exist_ok=True)
    try:
        api = src["spec"].api
        data = fetch_nhtsa(fetcher, src) if api == "nhtsa_complaints" else fetch_epa(fetcher, src)
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        record |= {"status": "error", "detail": type(exc).__name__}
    else:
        body = json.dumps(data, indent=1, ensure_ascii=False, sort_keys=True).encode()
        (folder / "data.json").write_bytes(body)
        record |= {
            "status": "fetched",
            "format": "json",
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
            "records": len(next(iter(data.values()))),
        }
    _write_json(meta, record)
    return record


def cached_api(ref: str) -> dict[str, Any] | None:
    path = cache_dir() / ref / "data.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


# --------------------------------------------------------------------------------------------
# Verification: do the figures of a claim stand on the page it names?
# --------------------------------------------------------------------------------------------

_not_alnum = re.compile(r"[\W_]+")


def _figure_pattern(fig: str) -> re.Pattern[str]:
    whole, _, decimals = fig.partition(".")
    if len(whole) > 3:  # 12810 also stands as 12,810 or 12.810 or 12 810
        head = len(whole) % 3 or 3
        groups = [whole[:head], *(whole[i : i + 3] for i in range(head, len(whole), 3))]
        core = r"[.,\s]?".join(groups)
    else:
        core = whole
    if decimals:
        core += r"[.,]" + decimals
    return re.compile(rf"(?<![\d.,]){core}(?![\d]|[.,]\d)")


def verify_claim(claim: dict[str, Any], pages: list[str] | None) -> dict[str, Any]:
    """Does the page say what the claim says? A number alone proves little on a page full of
    numbers, so the figures of a claim have to stand together.

    confirmed: every figure stands in one passage, or a reader pinned the claim with a quote
    that is on the page and every figure is there too; on_page: every figure is on the page,
    but in different passages and nobody pinned it; partial: some figures are missing;
    not_found: no figure, or the quote is not on the page; not_checkable: the claim has neither
    figure nor quote; not_fetched: there is no snapshot."""
    if pages is None:
        return {"verification": "not_fetched"}
    text = " ".join("\n".join(pages).split())
    quote = claim.get("quote")
    if quote:
        needle = _not_alnum.sub(" ", quote.lower()).strip()
        if not needle or needle not in _not_alnum.sub(" ", text.lower()):
            return {"verification": "not_found", "missing": [f"quote: {quote}"]}
    if not claim["figures"]:
        return (
            {"verification": "confirmed", "excerpt": quote}
            if quote
            else {"verification": "not_checkable"}
        )
    hits = {f: [m.start() for m in _figure_pattern(f).finditer(text)] for f in claim["figures"]}
    found = [f for f, at in hits.items() if at]
    if not found:
        return {"verification": "not_found", "missing": claim["figures"]}

    def together(start: int) -> int:
        return sum(any(start <= p < start + EXCERPT_WINDOW for p in at) for at in hits.values())

    best = max(sorted(p for at in hits.values() for p in at), key=together)
    lo = max(0, best - 100)
    if len(found) < len(hits):
        state = "partial"
    elif together(best) == len(hits) or quote:
        state = "confirmed"
    else:
        state = "on_page"
    return {
        "verification": state,
        "found": found,
        "missing": [f for f in hits if f not in found],
        "excerpt": quote or text[lo : best + EXCERPT_WINDOW],
    }


# --------------------------------------------------------------------------------------------
# Fetch and verify (network), then load (offline)
# --------------------------------------------------------------------------------------------


def fetched_path() -> Path:
    return external_dir() / "fetched.json"


def load_fetched() -> dict[str, Any]:
    path = fetched_path()
    if not path.exists():
        return {"sources": {}, "claims": {}, "generated_claims": {}}
    return json.loads(path.read_text(encoding="utf-8"))


def fetch_and_verify(registry: dict[str, Any], only: list[str] | None = None) -> dict[str, Any]:
    """Fetch what is not in the cache yet, check every claim against its snapshot and write
    ``config/external/fetched.json``. Delete ``data/external/<ref>`` to fetch a page again."""
    fetcher = Fetcher()
    out = load_fetched()
    for src in registry["sources"]:
        ref = src["ref"]
        if only and ref not in only:
            continue
        if src["fetch"] == "auto":
            record = fetch_page(fetcher, ref, src["url"])
        elif src["fetch"] == "api":
            record = fetch_api(fetcher, src)
            data = cached_api(ref)
            if data and src["spec"].api == "nhtsa_complaints":
                out["generated_claims"][ref] = nhtsa_claims(data, record["fetched_at"][:10])
            elif data:
                out["generated_claims"][ref] = epa_claims(data)
        else:
            continue
        out["sources"][ref] = {k: v for k, v in record.items() if v is not None}
    for claim in registry["claims"]:
        if only and claim["ref"] not in only:
            continue
        state = out["sources"].get(claim["ref"], {}).get("status")
        pages = cached_pages(claim["ref"]) if state == "fetched" else None
        result = verify_claim(claim, pages)
        out["claims"][claim["id"]] = {k: v for k, v in result.items() if v}
    known = {c["id"] for c in registry["claims"]}
    out["claims"] = {k: v for k, v in out["claims"].items() if k in known}
    refs = {s["ref"] for s in registry["sources"]}
    out["sources"] = {k: v for k, v in out["sources"].items() if k in refs}
    out["generated_claims"] = {k: v for k, v in out["generated_claims"].items() if k in refs}
    _write_json(fetched_path(), out)
    return out


def _chunks(text: str) -> list[str]:
    out, cur = [], ""
    for line in text.split("\n"):
        if cur and len(cur) + len(line) > PAGE_CHARS:
            out.append(cur)
            cur = ""
        cur = f"{cur}\n{line}" if cur else line
    return [*out, cur] if cur.strip() else out


def _pages_of(src: dict[str, Any], fetched_at: str | None) -> list[dict[str, Any]]:
    """Searchable text of a source that is about our vehicles, from the local cache."""
    ref, spec = src["ref"], src["spec"]
    base = {"url": src["url"], "fetched_at": fetched_at, "regions": src["regions"]}
    if spec.api == "nhtsa_complaints":
        return [
            {
                "key": str(c["odi_number"]),
                "section": c["components"].title()[:200],
                "text": c["summary"],
                "locator": {
                    **base,
                    "url": f"https://www.nhtsa.gov/?nhtsaId={c['odi_number']}",
                    "vehicles": [c["vehicle"]],
                    "odi_number": c["odi_number"],
                    "model": f"{c['model']} {c['model_year']}",
                    "filed": c["filed"],
                    "lang": "en",
                },
            }
            for c in (cached_api(ref) or {}).get("complaints", [])
            if c["summary"]
        ]
    if spec.api or not spec.vehicles:
        return []
    pages = cached_pages(ref) or []
    parts = pages if len(pages) > 1 else _chunks(pages[0]) if pages else []
    return [
        {
            "key": f"{n:04d}",
            "section": spec.title[:200],
            "text": text,
            "locator": {**base, "vehicles": spec.vehicles, "part": n, "lang": spec.lang},
        }
        for n, text in enumerate(parts, 1)
        if text.strip()
    ]


def ingest_external(
    session: Session, run: Run, *, fetch: bool = False, only: list[str] | None = None
) -> dict[str, int]:
    registry = load_registry()
    fetched = fetch_and_verify(registry, only) if fetch else load_fetched()
    claims = list(registry["claims"])
    by_ref = {s["ref"]: s for s in registry["sources"]}
    for ref, rows in fetched["generated_claims"].items():
        claims += [
            {
                **row,
                "id": f"EXT-{ref}-A{n}",
                "ref": ref,
                "origin": by_ref[ref]["spec"].origin,
                "topic": None,
                "side": "for",
                "basis": "evidence",
                "figures": [],
                "computed": True,
            }
            for n, row in enumerate(rows, 1)
        ]
    for c in claims:
        check = fetched["claims"].get(c["id"], {}).get("verification")
        c["verified"] = bool(c.get("computed")) or check == "confirmed"
    set_levels(claims)

    session.execute(delete(ExternalEvidence))
    session.execute(delete(DocumentPage).where(DocumentPage.source_id.like("SRC-EXT-%")))
    session.execute(delete(ExternalSource))
    session.flush()
    kept = {source_id(s["ref"]) for s in registry["sources"]}
    for stale in session.scalars(select(Source).where(Source.id.like("SRC-EXT-%"))):
        if stale.id not in kept:
            session.delete(stale)
    stats: Counter = Counter(
        listed=len(registry["listed"]),
        excluded=len(registry["excluded"]),
        sources=len(registry["sources"]),
        claims=len(claims),
    )
    now = datetime.now(UTC)
    for src in registry["sources"]:
        ref, spec, sid = src["ref"], src["spec"], source_id(src["ref"])
        record = fetched["sources"].get(ref, {})
        state = record.get("status") or f"not_attempted:{src['fetch']}"
        stats[f"fetch_{state.split(':')[0]}"] += 1
        row = session.get(Source, sid)
        fields = {
            "kind": "web_api" if spec.api else "web_page",
            "name": spec.title[:200],
            "path_or_url": src["url"] or "",
            "format": record.get("format"),
            "layer": src["layer"],
            "checksum": record.get("sha256"),
            "size_bytes": record.get("bytes"),
            "fetched_at": datetime.fromisoformat(record["fetched_at"]) if record else None,
            "reliability": f"trust {src['trust']} of 4, {spec.type}",
            "notes": spec.access,
        }
        if row is None:
            session.add(Source(id=sid, created_run_id=run.id, **fields))
            stats["sources_new"] += 1
        else:
            for key, value in fields.items():
                setattr(row, key, value)
        session.flush()
        session.add(
            ExternalSource(
                source_id=sid,
                ref=ref,
                family=src["family"],
                origin=spec.origin,
                regions=src["regions"],
                vehicles=spec.vehicles,
                trust=src["trust"],
                status=src["status"],
                published=src["published"],
                fetch_status=state,
                meta={
                    "list": src["list"],
                    "listed_name": src["name"],
                    "listed": src["listed"],
                    "feeds": src["feeds"],
                    "why_not_fetched": src["why_not_fetched"],
                    "http_status": record.get("http_status"),
                    "final_url": record.get("final_url"),
                },
                created_run_id=run.id,
            )
        )
        for page in _pages_of(src, record.get("fetched_at")) if state == "fetched" else []:
            stats["pages"] += 1
            session.add(
                DocumentPage(
                    id=f"DOC-EXT-{ref}-{page['key']}",
                    source_id=sid,
                    page=stats["pages"],
                    section=page["section"],
                    text=page["text"],
                    char_len=len(page["text"]),
                    locator=page["locator"],
                    created_run_id=run.id,
                )
            )
    for c in claims:
        src = by_ref[c["ref"]]
        record = fetched["sources"].get(c["ref"], {})
        check = (
            {"verification": "computed"}
            if c.get("computed")
            else fetched["claims"].get(c["id"], {"verification": "not_fetched"})
        )
        stats[f"claims_{check['verification']}"] += 1
        session.add(
            ExternalEvidence(
                id=c["id"],
                source_id=source_id(c["ref"]),
                kind=c["kind"],
                topic=c["topic"],
                side=c["side"],
                regions=c["regions"],
                subsystems=c["subsystems"],
                vehicles=c["vehicles"],
                statement=c["statement"],
                basis=c["basis"],
                level=c["level"],
                sources_agreeing=c["sources_agreeing"],
                trust=src["trust"],
                published=src["published"] or (record.get("fetched_at") or "")[:10] or None,
                feeds=src["feeds"],
                verification=check["verification"],
                excerpt=check.get("excerpt"),
                contradiction=c.get("contradiction"),
                locator={
                    "url": src["url"],
                    "title": src["spec"].title,
                    "origin": c["origin"],
                    "source_type": src["spec"].type,
                    "listed_verified": src["listed"].get("verified"),
                    "figures_missing": check.get("missing"),
                    "snapshot_sha256": record.get("sha256"),
                    "fetched_at": record.get("fetched_at"),
                },
                created_run_id=run.id,
            )
        )
    session.flush()
    record_event(
        session,
        actor_type="system",
        actor_id="ingest.external",
        action="external.ingested",
        entity_type="source",
        entity_id="external",
        run_id=run.id,
        after=dict(stats),
        rationale=(
            "Loaded the team's external source lists as far as they are in scope "
            f"({len(registry['excluded'])} entries excluded with a reason) at {now:%Y-%m-%d}; "
            "claims carry the result of the check against their snapshot"
        ),
    )
    return dict(stats)

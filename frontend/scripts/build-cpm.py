#!/usr/bin/env python3
"""Build the CPM subsystem content for the vehicle screen and its subsystem dialog.

Reads the twelve subsystems with their weights and links (config/cpm/subsystems.yaml), the
theme-to-subsystem mapping (config/cpm/theme_subsystem_map.yaml), the market and competitor
evidence (config/cpm/market_context.yaml), the customer domains, the feedback workbooks under
docs/ and the vehicle × market pairs of frontend/content/markets.json, and writes
frontend/content/cpm.json: per vehicle × market, every subsystem's rows, likes and complaints,
the themes customers like and criticise with two verbatims each, and the market rows.

Counting follows the baseline reports (reports/baseline/*.json): one classification row per
workbook row with a canonical level-2 theme; the script checks its totals against the baselines
and stops if they differ. Verbatims are copied as written.

    python3 frontend/scripts/build-cpm.py

Weights, likelihoods, impacts and the mapping are the team's assumptions (effort rule 50) and
are labelled as such in the output and on screen.
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import date
from pathlib import Path

import openpyxl
import yaml

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend" / "content" / "cpm.json"
SHEET = "Feedback_Explorer"
LIKE = "Likes"
COMPLAINT_TYPES = {"Defect", "Difficult to Use", "Wants"}
ENGINE_MAP = {"ICE": "ICE", "BEVE": "BEV", "BEV": "BEV", "PHEV": "PHEV", "MHEV": "MHEV"}
UNCLASSIFIED = {"", "no_class_found"}
MAX_THEMES = 6
MAX_QUOTES = 2
QUOTE_MIN, QUOTE_MAX, QUOTE_CUT = 40, 240, 300
SURVEY_SOURCE = "Source C"  # survey answers that repeat the question; used only when nothing else exists


def load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def normalise(name) -> str:
    return " ".join(str(name or "").replace("\xa0", " ").split())


def read_rows(path: Path, country_market: dict[str, str]) -> list[dict]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[SHEET]
    it = ws.iter_rows(values_only=True)
    header = [normalise(h) for h in next(it)]
    rows = []
    for values in it:
        rec = dict(zip(header, values))
        l2 = normalise(rec.get("Vfc level2 Name"))
        if l2 in UNCLASSIFIED:
            continue
        country = normalise(rec.get("Country")).upper()
        engine = normalise(rec.get("Engine Type"))
        rows.append({
            "id": normalise(rec.get("ID")),
            "source": normalise(rec.get("Source")),
            "country": country,
            "market": country_market.get(country),
            "powertrain": ENGINE_MAP.get(engine, engine or None),
            "type": normalise(rec.get("Feedback Type")),
            "theme": l2,
            "text": str(rec.get("Customer Feedback") or "").strip(),
        })
    return rows


def pick_quotes(cands: list[dict]) -> list[dict]:
    """Two verbatims per theme and polarity: one per verbatim id, sources other than the survey
    first, texts of a readable length, deterministic order by id."""
    by_id: dict[str, dict] = {}
    for r in sorted(cands, key=lambda r: r["id"]):
        by_id.setdefault(r["id"], r)
    unique = list(by_id.values())
    preferred = [r for r in unique if r["source"] != SURVEY_SOURCE and QUOTE_MIN <= len(r["text"]) <= QUOTE_MAX]
    fallback = [r for r in unique if r["text"]]
    chosen = (preferred or fallback)[:MAX_QUOTES]
    return [
        {
            "id": r["id"],
            "evidenceRef": f"verbatim:{r['id']}",
            "text": r["text"] if len(r["text"]) <= QUOTE_CUT else r["text"][:QUOTE_CUT] + " …",
            "source": r["source"],
            "powertrain": r["powertrain"],
            "country": r["country"],
        }
        for r in chosen
    ]


def main() -> None:
    cpm = load_yaml(ROOT / "config" / "cpm" / "subsystems.yaml")
    mapping = load_yaml(ROOT / "config" / "cpm" / "theme_subsystem_map.yaml")
    context = load_yaml(ROOT / "config" / "cpm" / "market_context.yaml")["rows"]
    domain_map = load_yaml(ROOT / "config" / "taxonomy" / "domain_map.yaml")["map"]
    domains = load_yaml(ROOT / "config" / "taxonomy" / "domains.yaml")["domains"]
    canonical = {e["name"] for e in load_yaml(ROOT / "config" / "taxonomy" / "vfc_level2.yaml")["entries"]}
    markets_cfg = load_yaml(ROOT / "config" / "markets.yaml")
    country_market = {code: c["market"] for code, c in markets_cfg["countries"].items()}
    markets = json.loads((ROOT / "frontend" / "content" / "markets.json").read_text(encoding="utf-8"))

    subsystems = cpm["subsystems"]
    keys = [s["key"] for s in subsystems]
    theme_subsystem = {t: key for key, themes in mapping["map"].items() for t in themes}
    unassigned = set(mapping["unassigned"])
    mapped = set(theme_subsystem) | unassigned
    if mapped != canonical or len(theme_subsystem) + len(unassigned) != len(canonical):
        raise SystemExit(f"theme_subsystem_map.yaml must name every canonical theme once: missing {sorted(canonical - mapped)}, unknown {sorted(mapped - canonical)}")
    if sum(s["weight"] for s in subsystems) != 100:
        raise SystemExit("subsystem weights must sum to 100")
    for s in subsystems:
        for link in s["links"]:
            if link["to"] not in keys:
                raise SystemExit(f"unknown link target {link['to']} in {s['key']}")
    for row in context:
        if row["subsystem"] not in keys:
            raise SystemExit(f"unknown subsystem {row['subsystem']} in market_context.yaml")
    theme_domain = {t: d for d, themes in domain_map.items() for t in themes}

    workbooks: dict[str, list[dict]] = {}
    for code in ("F70", "G60", "G70"):
        workbooks[code] = read_rows(ROOT / "docs" / f"{code}_feedback_hackathon.xlsx", country_market)

    baselines: dict[tuple[str, str], dict] = {}
    for path in sorted((ROOT / "reports" / "baseline").glob("*.json")):
        d = json.loads(path.read_text(encoding="utf-8"))
        baselines[(d["vehicle"]["code"], d["market"])] = d

    views = {}
    for m in markets["markets"]:
        for v in m["vehicles"]:
            rows = [r for r in workbooks.get(v["code"], []) if r["market"] == m["code"]]
            base = baselines.get((v["code"], m["code"]))
            withheld = 0
            if base:
                expected = base["coverage"]["classification_rows"] - base["coverage"]["unclassified_rows"]
                if len(rows) != expected:
                    raise SystemExit(f"{v['code']} {m['code']}: {len(rows)} classified rows here, {expected} in the baseline report")
            elif rows:
                # The screen follows the baseline reports (markets.json says "no verbatims yet" for
                # this scope), so the rows are withheld here too until the report is generated.
                print(f"  note: {v['code']} {m['code']} has {len(rows)} classified rows in the workbook but no baseline report; shown as empty")
                withheld = len(rows)
                rows = []
            per_sub: dict[str, dict] = {k: defaultdict(lambda: {"rows": 0, "likes": 0, "complaints": 0, "defects": 0, "difficultToUse": 0, "wants": 0, "likeQuotes": [], "complaintQuotes": []}) for k in keys}
            unassigned_rows = 0
            for r in rows:
                key = theme_subsystem.get(r["theme"])
                if key is None:
                    unassigned_rows += 1
                    continue
                t = per_sub[key][r["theme"]]
                t["rows"] += 1
                if r["type"] == LIKE:
                    t["likes"] += 1
                    t["likeQuotes"].append(r)
                elif r["type"] in COMPLAINT_TYPES:
                    t["complaints"] += 1
                    t["complaintQuotes"].append(r)
                    if r["type"] == "Defect":
                        t["defects"] += 1
                    elif r["type"] == "Difficult to Use":
                        t["difficultToUse"] += 1
                    else:
                        t["wants"] += 1
            entries = []
            for key in keys:
                themes = per_sub[key]
                liked = sorted(((n, t) for n, t in themes.items() if t["likes"] > 0), key=lambda nt: (-nt[1]["likes"], nt[0]))[:MAX_THEMES]
                criticised = sorted(((n, t) for n, t in themes.items() if t["complaints"] > 0), key=lambda nt: (-nt[1]["complaints"], nt[0]))[:MAX_THEMES]
                entries.append({
                    "key": key,
                    "rows": sum(t["rows"] for t in themes.values()),
                    "likes": sum(t["likes"] for t in themes.values()),
                    "complaints": sum(t["complaints"] for t in themes.values()),
                    "themes": len(themes),
                    "liked": [
                        {"theme": n, "domain": theme_domain.get(n, "general"), "rows": t["rows"], "likes": t["likes"], "quotes": pick_quotes(t["likeQuotes"])}
                        for n, t in liked
                    ],
                    "criticised": [
                        {
                            "theme": n, "domain": theme_domain.get(n, "general"), "rows": t["rows"], "complaints": t["complaints"],
                            "defects": t["defects"], "difficultToUse": t["difficultToUse"], "wants": t["wants"],
                            "quotes": pick_quotes(t["complaintQuotes"]),
                        }
                        for n, t in criticised
                    ],
                    "market": [
                        {
                            "kind": c["kind"],
                            "statement": c["statement"],
                            "source": {"title": c["source"]["title"], "url": c["source"]["url"], "date": str(c["source"]["date"]), "type": c["source"]["type"]},
                            "level": c["level"],
                            "basis": c["basis"],
                            "note": c.get("note"),
                            "contradiction": c.get("contradiction"),
                        }
                        for c in context
                        if c["market"] == m["code"] and c["subsystem"] == key
                    ],
                })
            views[f"{v['code']}_{m['code']}"] = {
                "vehicle": v["code"],
                "market": m["code"],
                "verbatims": v["verbatims"],
                "rows": len(rows),
                "unassignedRows": unassigned_rows,
                "rowsSource": (
                    f"docs/{v['code']}_feedback_hackathon.xlsx, classified rows with a canonical level-2 theme and a country in this market; totals equal reports/baseline/{v['code']}_{m['code']}.json"
                    if base else (
                        f"docs/{v['code']}_feedback_hackathon.xlsx holds {withheld} classified rows for this market, withheld until a baseline report exists for this scope"
                        if withheld else "no classified verbatims for this vehicle in this market"
                    )
                ),
                "subsystems": entries,
            }

    payload = {
        "generatedAt": date.today().isoformat(),
        "method": {
            "name": cpm["method"]["name"],
            "reference": cpm["method"]["reference"],
            "url": cpm["method"]["url"],
            "engine": cpm["method"]["engine"],
            "basis": cpm["method"]["basis"],
            "weightSources": cpm["method"]["weight_sources"],
            "thresholds": {"adaptBelowPercent": cpm["method"]["thresholds"]["adapt_below_percent"], "newGenerationFromPercent": cpm["method"]["thresholds"]["new_generation_from_percent"]},
            "certificationAddOnPercent": cpm["method"]["certification_add_on_percent"],
        },
        "subsystems": [
            {
                "key": s["key"], "name": s["name"], "scope": s["scope"], "weight": s["weight"],
                "certificationTrigger": bool(s["certification_trigger"]),
                "links": [{"to": l["to"], "likelihood": l["likelihood"], "impact": l["impact"]} for l in s["links"]],
            }
            for s in subsystems
        ],
        "mapping": {
            "source": "config/cpm/theme_subsystem_map.yaml, the team's assignment of every level-2 theme to one subsystem (assumption)",
            "themes": len(theme_subsystem),
            "unassigned": sorted(unassigned),
        },
        "marketContextSource": "config/cpm/market_context.yaml (rules 31 to 36 of the team's rule set v0.2)",
        "domains": {k: d["name"] for k, d in domains.items()},
        "views": views,
    }
    OUT.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(views)} views, {OUT.stat().st_size // 1024} KB")
    for name, view in views.items():
        top = sorted(view["subsystems"], key=lambda s: -s["rows"])[:3]
        print(f"  {name}: {view['rows']} rows, {view['unassignedRows']} unassigned; " + ", ".join(f"{s['key']} {s['rows']} ({s['complaints']} complaints)" for s in top))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build the CPM subsystem content for the vehicle screen and its subsystem dialog.

Reads the CPM effort model of the backend engine (config/effort/model.yaml: the twelve
subsystems with their weights, links, certification and threshold parameters and the subsystems
absent on a vehicle), the theme-to-subsystem mapping (config/cpm/theme_subsystem_map.yaml), the
market and competitor evidence (config/cpm/market_context.yaml), the customer domains, the
feedback workbooks under docs/ and the vehicle × market pairs of frontend/content/markets.json,
and writes
frontend/content/cpm.json: per vehicle × market, every subsystem's rows, likes and complaints,
the themes customers like and criticise with two verbatims each, a derived one-sentence
suggestion and a few-sentence summary per block (template text from the counts and the finding
rules of config/findings/findings.yaml; the backend's agent replaces it in the same fields), and
the market rows.

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


def join_names(names: list[str]) -> str:
    if len(names) <= 1:
        return "".join(names)
    return ", ".join(names[:-1]) + " and " + names[-1]


def liked_narration(liked: list[tuple[str, dict]], likes: int, rows: int, n_themes: int, rules: dict) -> dict | None:
    """Template text from the counts and the strength rule (finding config), basis 'derived'."""
    if rows == 0:
        return None
    min_rows, min_share = rules["min_strength_rows"], rules["min_strength_share"]
    strengths = [(n, t) for n, t in liked if t["likes"] >= min_rows and t["likes"] / t["rows"] >= min_share][:3]
    rule = f"at least {min_rows} likes and {min_share:.0%} of its rows"
    if strengths:
        share = min(t["likes"] / t["rows"] for _, t in strengths)
        share_text = f"{share:.0%} of its rows are likes" if len(strengths) == 1 else f"{share:.0%} or more of their rows are likes"
        suggestion = f"Keep {join_names([n for n, _ in strengths])}: {share_text} (strength rule: {rule})."
    elif likes == 0:
        suggestion = "No likes recorded in this subsystem; nothing is flagged to keep."
    else:
        suggestion = f"No theme meets the strength rule ({rule}), so nothing in this subsystem is flagged to keep."
    parts = [f"{likes:,} likes in {rows:,} rows across {n_themes} theme{'s' if n_themes != 1 else ''}."]
    if liked:
        n0, t0 = liked[0]
        lead = f"{n0} leads with {t0['likes']:,} likes of {t0['rows']:,} rows"
        rest = [f"{n} ({t['likes']:,} of {t['rows']:,})" for n, t in liked[1:3]]
        parts.append(lead + (", then " + join_names(rest) if rest else "") + ".")
    return {"suggestion": suggestion, "summary": " ".join(parts), "basis": "derived"}


def criticised_narration(criticised: list[tuple[str, dict]], complaints: int, rows: int, totals: dict, rules: dict) -> dict | None:
    """Template text from the counts and the unmet-need rule (finding config), basis 'derived'."""
    if rows == 0:
        return None
    if not criticised:
        return {"suggestion": "No complaints recorded in this subsystem.", "summary": f"{rows:,} rows, none of them a complaint.", "basis": "derived"}
    n0, t0 = criticised[0]
    kinds = {"defects": t0["defects"], "difficult to use": t0["difficultToUse"], "wants": t0["wants"]}
    dominant = max(kinds, key=lambda k: kinds[k])
    kind = "an unmet need" if t0["wants"] / t0["complaints"] >= rules["unmet_need_wants_share"] else "a recurring complaint"
    suggestion = f"Address {n0} first: {t0['complaints']:,} complaints of {t0['rows']:,} rows, mostly {dominant} ({kind})."
    top = criticised[:3]
    share = sum(t["complaints"] for _, t in top) / complaints
    summary = (
        f"{complaints:,} complaints in {rows:,} rows: {totals['defects']:,} defects, {totals['difficultToUse']:,} difficult to use, {totals['wants']:,} wants. "
        f"{join_names([f"{n} ({t['complaints']:,})" for n, t in top])} "
        f"carr{'ies' if len(top) == 1 else 'y'} {share:.0%} of them."
    )
    return {"suggestion": suggestion, "summary": summary, "basis": "derived"}


METHOD = {
    "name": "Change Prediction Method",
    "reference": "Clarkson, Simons, Eckert (2004), Predicting Change Propagation in Complex Design, Journal of Mechanical Design 126(5)",
    "url": "https://oro.open.ac.uk/18626",
    "engine": "backend/tracepoint/effort/cpm.py",
    "modelSource": "config/effort/model.yaml",
}


def main() -> None:
    model = load_yaml(ROOT / "config" / "effort" / "model.yaml")
    mapping = load_yaml(ROOT / "config" / "cpm" / "theme_subsystem_map.yaml")
    context = load_yaml(ROOT / "config" / "cpm" / "market_context.yaml")["rows"]
    domain_map = load_yaml(ROOT / "config" / "taxonomy" / "domain_map.yaml")["map"]
    domains = load_yaml(ROOT / "config" / "taxonomy" / "domains.yaml")["domains"]
    canonical = {e["name"] for e in load_yaml(ROOT / "config" / "taxonomy" / "vfc_level2.yaml")["entries"]}
    markets_cfg = load_yaml(ROOT / "config" / "markets.yaml")
    country_market = {code: c["market"] for code, c in markets_cfg["countries"].items()}
    markets = json.loads((ROOT / "frontend" / "content" / "markets.json").read_text(encoding="utf-8"))
    finding_rules = load_yaml(ROOT / "config" / "findings" / "findings.yaml")["voice_of_customer"]

    subsystems = model["subsystems"]
    keys = [s["key"] for s in subsystems]
    names = {s["key"]: s["name"] for s in subsystems}
    links_from: dict[str, list[dict]] = defaultdict(list)
    for link in model["links"]:
        links_from[link["from"]].append(link)
    cert = model["certification"]
    vehicle_models = model.get("vehicles", {})
    theme_subsystem = {t: key for key, themes in mapping["map"].items() for t in themes}
    unassigned = set(mapping["unassigned"])
    mapped = set(theme_subsystem) | unassigned
    if mapped != canonical or len(theme_subsystem) + len(unassigned) != len(canonical):
        raise SystemExit(f"theme_subsystem_map.yaml must name every canonical theme once: missing {sorted(canonical - mapped)}, unknown {sorted(mapped - canonical)}")
    if sum(s["weight"] for s in subsystems) != 100:
        raise SystemExit("subsystem weights must sum to 100")
    for link in model["links"]:
        if link["from"] not in keys or link["to"] not in keys:
            raise SystemExit(f"unknown subsystem in link {link['from']} -> {link['to']}")
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
            # Subsystems absent on this vehicle (config/effort/model.yaml) are left out and the
            # weights of the present ones are renormalised to 100, as the engine does.
            vehicle_model = vehicle_models.get(v["code"], {})
            absent = list(vehicle_model.get("absent", []))
            present = [sub for sub in subsystems if sub["key"] not in absent]
            present_total = sum(sub["weight"] for sub in present)
            per_sub: dict[str, dict] = {k: defaultdict(lambda: {"rows": 0, "likes": 0, "complaints": 0, "defects": 0, "difficultToUse": 0, "wants": 0, "likeQuotes": [], "complaintQuotes": []}) for k in keys}
            unassigned_rows = 0
            absent_rows = {k: 0 for k in absent}
            for r in rows:
                key = theme_subsystem.get(r["theme"])
                if key is None:
                    unassigned_rows += 1
                    continue
                if key in absent_rows:
                    absent_rows[key] += 1
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
            for sub in present:
                key = sub["key"]
                themes = per_sub[key]
                liked = sorted(((n, t) for n, t in themes.items() if t["likes"] > 0), key=lambda nt: (-nt[1]["likes"], nt[0]))[:MAX_THEMES]
                criticised = sorted(((n, t) for n, t in themes.items() if t["complaints"] > 0), key=lambda nt: (-nt[1]["complaints"], nt[0]))[:MAX_THEMES]
                sub_rows = sum(t["rows"] for t in themes.values())
                sub_likes = sum(t["likes"] for t in themes.values())
                sub_complaints = sum(t["complaints"] for t in themes.values())
                totals = {k: sum(t[k] for t in themes.values()) for k in ("defects", "difficultToUse", "wants")}
                entries.append({
                    "key": key,
                    "weight": round(sub["weight"] * 100 / present_total, 1),
                    "rows": sub_rows,
                    "likes": sub_likes,
                    "complaints": sub_complaints,
                    "themes": len(themes),
                    "liked": {
                        "narration": liked_narration(liked, sub_likes, sub_rows, len(themes), finding_rules),
                        "themes": [
                            {"theme": n, "domain": theme_domain.get(n, "general"), "rows": t["rows"], "likes": t["likes"], "quotes": pick_quotes(t["likeQuotes"])}
                            for n, t in liked
                        ],
                    },
                    "criticised": {
                        "narration": criticised_narration(criticised, sub_complaints, sub_rows, totals, finding_rules),
                        "themes": [
                            {
                                "theme": n, "domain": theme_domain.get(n, "general"), "rows": t["rows"], "complaints": t["complaints"],
                                "defects": t["defects"], "difficultToUse": t["difficultToUse"], "wants": t["wants"],
                                "quotes": pick_quotes(t["complaintQuotes"]),
                            }
                            for n, t in criticised
                        ],
                    },
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
                "platform": vehicle_model.get("platform"),
                "absent": [{"key": k, "name": names[k], "rows": absent_rows[k]} for k in absent],
                "absentNote": vehicle_model.get("note"),
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
            **METHOD,
            "modelVersion": model["version"],
            "basis": model["status"],
            "thresholds": {"adaptBelowPercent": model["thresholds"]["major_revision"], "newGenerationFromPercent": model["thresholds"]["new_generation"]},
            "certificationAddOnPercent": cert["add_on"],
        },
        "subsystems": [
            {
                "key": s["key"], "name": s["name"], "weight": s["weight"], "basis": s["basis"],
                "certificationTrigger": s["key"] in cert["trigger_subsystems"],
                "links": [{"to": l["to"], "likelihood": l["likelihood"], "impact": l["impact"], "why": l["why"]} for l in links_from[s["key"]]],
            }
            for s in subsystems
        ],
        "mapping": {
            "source": "config/cpm/theme_subsystem_map.yaml, the team's assignment of every level-2 theme to one subsystem (assumption)",
            "themes": len(theme_subsystem),
            "unassigned": sorted(unassigned),
        },
        "marketContextSource": "config/cpm/market_context.yaml (rules 31 to 36 of the team's rule set v0.2)",
        "narrationSource": "suggestion and summary per block are template text derived from the counts and config/findings/findings.yaml (strength and unmet-need rules); basis 'derived' until the backend's agent writes them",
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

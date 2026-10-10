"""Extract the canonical VFC taxonomy (level 2 / level 3) from the feedback workbooks.

The union of the given names becomes the canonical, frozen list (decision D-004). Re-running the
extraction merges with the existing YAML: identifiers, domain assignments, polarity and notes
are preserved; occurrence counts are refreshed.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import pandas as pd
import yaml

from tracepoint.core.settings import get_settings
from tracepoint.ingest.registry import INTERNAL_FILES, file_path

UNCLASSIFIED = {"", "no_class_found"}


def normalise_name(name: str) -> str:
    """Normalise whitespace in taxonomy names (the input contains non-breaking spaces)."""
    return " ".join(str(name).replace("\xa0", " ").split())


def _load_existing(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return {e["name"]: e for e in data.get("entries", [])}


def _dump(path: Path, header: str, entries: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        fh.write(header)
        yaml.safe_dump({"entries": entries}, fh, allow_unicode=True, sort_keys=False, width=120)


def extract_taxonomy(config_dir: Path | None = None) -> dict[str, int]:
    config_dir = config_dir or get_settings().config_dir
    l2_counts: dict[str, Counter] = defaultdict(Counter)
    l3_counts: dict[str, Counter] = defaultdict(Counter)
    for key, spec in INTERNAL_FILES.items():
        if not key.startswith("feedback_"):
            continue
        df = pd.read_excel(file_path(key), sheet_name="Feedback_Explorer", dtype=str).fillna("")
        for l2, l3 in zip(df["Vfc level2 Name"], df["Vfc level3 Name"], strict=True):
            l2 = normalise_name(l2)
            l3 = normalise_name(l3)
            if l2 not in UNCLASSIFIED:
                l2_counts[l2][spec.vehicle_code] += 1
            if l3 not in UNCLASSIFIED:
                l3_counts[l3][spec.vehicle_code] += 1

    out: dict[str, int] = {}
    for level, counts, prefix, fields in (
        ("level2", l2_counts, "L2", ("domain",)),
        ("level3", l3_counts, "L3", ("polarity",)),
    ):
        path = config_dir / "taxonomy" / f"vfc_{level}.yaml"
        existing = _load_existing(path)
        used_ids = {e["id"] for e in existing.values()}
        next_no = 1
        entries: list[dict[str, Any]] = []
        for name in sorted(counts, key=lambda n: n.lower()):
            prev = existing.get(name)
            if prev:
                eid = prev["id"]
            else:
                while f"{prefix}-{next_no:03d}" in used_ids:
                    next_no += 1
                eid = f"{prefix}-{next_no:03d}"
                used_ids.add(eid)
            entry: dict[str, Any] = {"id": eid, "name": name}
            for f in fields:
                entry[f] = (prev or {}).get(f)
            entry["origin"] = (prev or {}).get("origin", "given")
            entry["status"] = (prev or {}).get("status", "canonical")
            entry["occurrences"] = dict(sorted(counts[name].items()))
            if (prev or {}).get("notes"):
                entry["notes"] = prev["notes"]
            entries.append(entry)
        # keep entries that exist in the YAML but no longer occur (e.g. approved proposals)
        for name, prev in existing.items():
            if name not in counts and prev.get("origin", "given") != "given":
                entries.append(prev)
        header = (
            f"# Canonical VFC {level} taxonomy extracted from the feedback workbooks (decision D-004).\n"
            "# Identifiers are stable. 'occurrences' = classification rows per vehicle in the input.\n"
            + (
                "# 'domain' = vehicle domain key (authored, see config/taxonomy/domains.yaml).\n"
                if level == "level2"
                else "# 'polarity' = positive / negative / request / neutral (authored).\n"
            )
        )
        _dump(path, header, entries)
        out[level] = len(entries)
    return out


# --------------------------------------------------------------------------------------------
# Authored enrichment: domain map (level 2) and polarity (level 3)
# --------------------------------------------------------------------------------------------

POLARITY_RULES: list[tuple[str, str]] = [
    ("like", "positive"),
    ("likes", "positive"),
    ("appeals", "positive"),
    ("customer request", "request"),
]


def _polarity_for(name: str) -> str:
    low = name.lower()
    if low.startswith("like") or low.startswith("likes"):
        return "positive"
    if low.endswith("appeals") and "not" not in low and "does not" not in low:
        return "positive"
    if low.startswith("customer request"):
        return "request"
    return "negative"


def apply_enrichment(config_dir: Path | None = None) -> dict[str, int]:
    """Apply config/taxonomy/domain_map.yaml to level 2 and polarity rules / overrides to level 3."""
    config_dir = config_dir or get_settings().config_dir
    tax = config_dir / "taxonomy"
    stats = {"level2_mapped": 0, "level2_unmapped": 0, "level3_polarity": 0}

    l2_path = tax / "vfc_level2.yaml"
    map_path = tax / "domain_map.yaml"
    if l2_path.exists():
        with l2_path.open(encoding="utf-8") as fh:
            data = yaml.safe_load(fh) or {}
        domain_map: dict[str, str] = {}
        if map_path.exists():
            with map_path.open(encoding="utf-8") as fh:
                raw = yaml.safe_load(fh) or {}
            for domain, names in (raw.get("map") or {}).items():
                for n in names or []:
                    domain_map[n] = domain
        for e in data.get("entries", []):
            d = domain_map.get(e["name"])
            if d:
                e["domain"] = d
                stats["level2_mapped"] += 1
            else:
                stats["level2_unmapped"] += 1
        header = (
            "# Canonical VFC level2 taxonomy extracted from the feedback workbooks (decision D-004).\n"
            "# Identifiers are stable. 'occurrences' = classification rows per vehicle in the input.\n"
            "# 'domain' = vehicle domain key, applied from config/taxonomy/domain_map.yaml.\n"
        )
        _dump(l2_path, header, data.get("entries", []))

    l3_path = tax / "vfc_level3.yaml"
    ov_path = tax / "polarity_overrides.yaml"
    if l3_path.exists():
        with l3_path.open(encoding="utf-8") as fh:
            data = yaml.safe_load(fh) or {}
        overrides: dict[str, str] = {}
        if ov_path.exists():
            with ov_path.open(encoding="utf-8") as fh:
                overrides = (yaml.safe_load(fh) or {}).get("overrides") or {}
        for e in data.get("entries", []):
            e["polarity"] = overrides.get(e["name"]) or _polarity_for(e["name"])
            stats["level3_polarity"] += 1
        header = (
            "# Canonical VFC level3 taxonomy extracted from the feedback workbooks (decision D-004).\n"
            "# Identifiers are stable. 'occurrences' = classification rows per vehicle in the input.\n"
            "# 'polarity' = positive / negative / request, from rules plus config/taxonomy/polarity_overrides.yaml.\n"
        )
        _dump(l3_path, header, data.get("entries", []))
    return stats

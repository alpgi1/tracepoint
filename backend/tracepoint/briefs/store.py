"""Where the analyses are stored and which scopes they speak about (D-100).

An analysis is a file, not a table: ``tracepoint agent analyze`` and ``agent series`` write
``data/analyses/<VEHICLE>_<SCOPE>.json`` (a run on this machine), and the team files the briefs it
keeps under ``reports/analysis/`` (committed). Both are read; a run on this machine wins over the
committed file of the same name. The key is the file name: ``G60_US`` (a vehicle in a market),
``F70_GB`` (in one country), ``G60_regions`` (a series across its regions). Only keys found in the
two folders are served, so a request can never name a path.
"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from tracepoint.core.settings import REPO_ROOT, get_settings

KEY = re.compile(r"^(?P<vehicle>[A-Z]\d{2})_(?P<scope>[A-Z]{2}|RoW|regions)$")
_RUN_TIME = re.compile(r"^RUN-(\d{8})-(\d{6})-")


def folders() -> list[tuple[Path, str]]:
    """The folders that hold analyses, the first one winning: (path, origin)."""
    return [
        (get_settings().data_dir / "analyses", "run on this machine"),
        (REPO_ROOT / "reports" / "analysis", "committed with the repository"),
    ]


def stored() -> dict[str, tuple[Path, str]]:
    """Key -> (file, origin) of every analysis on disk."""
    out: dict[str, tuple[Path, str]] = {}
    for folder, origin in folders():
        if not folder.is_dir():
            continue
        for path in sorted(folder.glob("*.json")):
            if KEY.match(path.stem) and path.stem not in out:
                out[path.stem] = (path, origin)
    return out


def load(key: str) -> tuple[dict[str, Any], Path, str] | None:
    """The analysis as written, its file and its origin; None for a key that is not stored."""
    hit = stored().get(key)
    if hit is None:
        return None
    path, origin = hit
    return json.loads(path.read_text(encoding="utf-8")), path, origin


def run_time(run_id: str | None) -> str | None:
    """When a run started, from its id (``RUN-20261011-035557-…``), as ISO 8601 in UTC."""
    m = _RUN_TIME.match(run_id or "")
    if not m:
        return None
    return (
        datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S").replace(tzinfo=UTC).isoformat()
    )


def is_series(data: dict[str, Any]) -> bool:
    return "series" in data and "regions" in data


def scopes_of(data: dict[str, Any]) -> list[dict[str, str | None]]:
    """The vehicle and market pairs an analysis speaks about: its own, or one per region."""
    if is_series(data):
        return [
            {"vehicle": r["vehicle"], "market": r["market"], "country": None}
            for r in data["regions"]
        ]
    return [{"vehicle": data["vehicle"], "market": data["market"], "country": data.get("country")}]


def summary_file(path: Path) -> str:
    """The file, relative to the repository where it lies inside it."""
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return path.name


def summary(key: str, data: dict[str, Any], path: Path, origin: str) -> dict[str, Any]:
    """One line of the index: what the analysis is, when it ran, what it covers."""
    series = is_series(data)
    a = data["analysis"]
    file = summary_file(path)
    return {
        "key": key,
        "kind": "series" if series else "situation",
        "title": f"BMW {data['series']}: what to change, for whom, and when"
        if series
        else data["scope"],
        "vehicle": data["lead_vehicle"] if series else data["vehicle"],
        "market": None if series else data["market"],
        "country": None if series else data.get("country"),
        "series": data.get("series"),
        "scopes": scopes_of(data),
        "headline": a["headline"],
        "items": len(a["topics"] if series else a["recommendations"]),
        "runId": data["run_id"],
        "ranAt": run_time(data["run_id"]),
        "model": data["model"],
        "promptVersion": data["prompt_version"],
        "origin": origin,
        "file": file,
    }


def index(
    vehicle: str | None = None, market: str | None = None, kind: str | None = None
) -> list[dict[str, Any]]:
    """The stored analyses, situation analyses first, each with the scopes it covers; with a
    vehicle and a market, those that speak about that pair."""
    out = []
    for key, (path, origin) in stored().items():
        data = json.loads(path.read_text(encoding="utf-8"))
        item = summary(key, data, path, origin)
        if kind and item["kind"] != kind:
            continue
        if vehicle and not any(s["vehicle"] == vehicle for s in item["scopes"]):
            continue
        if market and not any(
            s["market"] == market and (not vehicle or s["vehicle"] == vehicle)
            for s in item["scopes"]
        ):
            continue
        out.append(item)
    out.sort(key=lambda i: (i["kind"] == "series", i["key"]))
    return out

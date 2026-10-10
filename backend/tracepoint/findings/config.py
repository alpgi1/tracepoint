"""Configuration for the deterministic finding extraction (config/findings/*.yaml)."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import yaml

from tracepoint.core.settings import get_settings


def _load(name: str) -> dict[str, Any]:
    path = get_settings().config_dir / "findings" / name
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


@dataclass(frozen=True)
class FindingConfig:
    voc: dict[str, Any]
    metrics: dict[str, Any]
    evidence_levels: dict[str, dict[str, Any]]
    theme_attributes: dict[str, list[str]]
    theme_equipment: dict[str, list[str]]


@lru_cache
def load_config() -> FindingConfig:
    main = _load("findings.yaml")
    return FindingConfig(
        voc=main.get("voice_of_customer", {}),
        metrics=main.get("quantitative_metrics", {}),
        evidence_levels=main.get("evidence_levels", {}),
        theme_attributes={
            k: list(v) for k, v in (_load("theme_attribute_map.yaml").get("map") or {}).items()
        },
        theme_equipment={
            k: list(v) for k, v in (_load("theme_equipment_map.yaml").get("map") or {}).items()
        },
    )

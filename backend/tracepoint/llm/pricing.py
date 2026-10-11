"""Cost estimation from config/llm/pricing.yaml (USD per million tokens)."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import yaml

from tracepoint.core.settings import get_settings


@lru_cache
def pricing_table() -> dict[str, dict[str, float]]:
    path = get_settings().config_dir / "llm" / "pricing.yaml"
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as fh:
        data: dict[str, Any] = yaml.safe_load(fh) or {}
    return {k: v for k, v in (data.get("models") or {}).items() if isinstance(v, dict)}


def estimate_cost_usd(
    model: str, input_tokens: int | None, cached_tokens: int | None, output_tokens: int | None
) -> float | None:
    # The API reports dated snapshots (gpt-5.4-mini-2026-03-17); price them by the longest
    # alias they extend, so gpt-5.4-mini-* is not billed as gpt-5.4.
    table = pricing_table()
    alias = max((k for k in table if model == k or model.startswith(f"{k}-")), key=len, default="")
    price = table.get(alias)
    if price is None or input_tokens is None or output_tokens is None:
        return None
    cached = cached_tokens or 0
    uncached = max(0, input_tokens - cached)
    cost = (
        uncached * price.get("input", 0.0)
        + cached * price.get("cached_input", price.get("input", 0.0))
        + output_tokens * price.get("output", 0.0)
    ) / 1_000_000
    return round(cost, 6)


def estimate_tokens(text: str) -> int:
    """Rough token estimate for dry runs (about four characters per token)."""
    return max(1, len(text) // 4)

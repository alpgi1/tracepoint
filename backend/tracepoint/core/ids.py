"""Identifier helpers. Identifiers are stable, prefixed and human-readable."""

from __future__ import annotations

import re
import secrets
from datetime import UTC, datetime


def new_run_id(kind: str) -> str:
    stamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    return f"RUN-{stamp}-{kind}-{secrets.token_hex(2)}"


def padded_id(prefix: str, number: int, width: int = 4) -> str:
    return f"{prefix}-{number:0{width}d}"


_slug_re = re.compile(r"[^A-Za-z0-9]+")


def slug(text: str, max_len: int = 48) -> str:
    """ASCII slug for use inside identifiers (lower case, underscores)."""
    value = (
        text.replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("Ä", "Ae")
        .replace("Ö", "Oe")
        .replace("Ü", "Ue")
        .replace("ß", "ss")
    )
    value = _slug_re.sub("_", value).strip("_").lower()
    return value[:max_len].rstrip("_")

"""JSON-schema helpers for structured outputs."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


def to_strict_schema(model: type[BaseModel]) -> dict[str, Any]:
    """Pydantic JSON schema transformed for provider strict mode.

    Every object gets ``additionalProperties: false`` and lists all of its properties as required
    (optional fields stay nullable through their ``anyOf`` with ``null``).
    """
    schema = model.model_json_schema()

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            if node.get("type") == "object" and "properties" in node:
                node["additionalProperties"] = False
                node["required"] = list(node["properties"].keys())
            for key in ("properties", "$defs"):
                if key in node and isinstance(node[key], dict):
                    for child in node[key].values():
                        walk(child)
            for key in ("items", "anyOf", "oneOf", "allOf"):
                if key in node:
                    sub = node[key]
                    if isinstance(sub, list):
                        for child in sub:
                            walk(child)
                    else:
                        walk(sub)
            # strict mode does not accept defaults
            node.pop("default", None)
        elif isinstance(node, list):
            for child in node:
                walk(child)

    walk(schema)
    return schema

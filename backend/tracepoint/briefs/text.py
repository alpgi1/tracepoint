"""The analysts' sentences in the product manager's words (D-100).

The agents write for a product manager but now and then leave a code in a sentence: a subsystem
key (``software_hmi``), a field name (``own_impact``), a layer (``K2``), an evidence reference,
now and then a word of marketing filler. ``plain`` turns those into the words the screens use and
leaves everything else as the agent wrote it; requirement ids stay, they are what a product
manager looks up. The stored JSON keeps
the original; the brief is a reading of it. The result is plain text: the screens render it as
text, never as HTML or Markdown, so nothing in it can become a link or a heading.
"""

from __future__ import annotations

import re
from functools import lru_cache

from tracepoint.briefs.labels import LAYER_SHORT, domain_names
from tracepoint.effort.subsystems import subsystem_names

FIELD_WORDS = {
    "own_impact": "own impact",
    "effort_changes": "change profiles",
    "evidence_refs": "references",
    "related_requirement": "related requirement",
    "changes_vehicle": "changes to the vehicle",
    "portfolio_terms": "catalogue terms",
}
LAYER_CHANGE = {
    "K0": ("configuration change", "configuration changes"),
    "K1": ("add-on", "add-ons"),
    "K2": ("module change", "module changes"),
    "K3": ("platform change", "platform changes"),
}
# Evidence references as the agents cite them (agent/series.py strips the same from its brief),
# alone, in brackets or in parentheses, with the space before them.
_REF = (
    r"(?:\b(?:FND|EXT|MKT|MET|SAL|EQ|SPEC|DOC)-[\w-]+"
    r"|\b(?:verbatim|vclass|metric|external|market|document|sales|equipment|spec|finding"
    r"|aggregate):[\w#:.-]+)"
)
_REF_SPAN = re.compile(rf"\s*\[[^\]]*{_REF}[^\]]*\]|\s*\((?:[^()]*?{_REF}[^()]*?)\)|\s*{_REF}")
_IMPACT = re.compile(
    r"(?:\s+at)?(?:\s+own impact)?\s+(?P<impact>(?:0?\.\d+|1(?:\.0+)?))\s+(?P<layer>K[0-3])\b"
)
_LAYER = re.compile(
    r"(?P<at>\bat\s+)?(?P<open>\()?\b(?P<layer>K[0-3])\b(?P<close>\))?(?P<change>\s+changes?\b)?"
)
# Marketing filler the frontend's forbidden list keeps off a product manager's screen, in plain
# words with the same meaning ("owners report seamless charging": "trouble-free charging").
FILLER = {
    "seamlessly": "without trouble",
    "seamless": "trouble-free",
    "effortlessly": "without effort",
    "effortless": "effort-free",
    "cutting-edge": "latest",
    "supercharges": "boosts",
    "supercharge": "boost",
    "unleashes": "releases",
    "unleash": "release",
    "elevates": "raises",
    "elevate": "raise",
    "simply ": "",
}
_FILLER = re.compile(r"\b(" + "|".join(map(re.escape, FILLER)) + r")", re.I)
_DASH_RANGE = re.compile(r"(?<=\d)\s*[\u2013\u2014]\s*(?=\d)")
_DASH = re.compile(r"\s*[\u2013\u2014]\s*")
_SPACE = re.compile(r"[ \t]{2,}")


@lru_cache(maxsize=1)
def _keys() -> tuple[re.Pattern[str], dict[str, str]]:
    """Code keys that are not ordinary words: the subsystems and domains with an underscore, and
    the field names of the analysis output."""
    names = {k: v for k, v in {**subsystem_names(), **domain_names()}.items() if "_" in k}
    names |= FIELD_WORDS
    alternatives = "|".join(sorted(map(re.escape, names), key=len, reverse=True))
    return re.compile(rf"\b({alternatives})\b"), names


def _layer(m: re.Match[str]) -> str:
    layer = m.group("layer")
    if m.group("at"):
        return f"as a {LAYER_SHORT[layer]}" + (m.group("close") or "")
    if m.group("open") and m.group("close"):
        return f"({layer}, {LAYER_SHORT[layer]})"
    if m.group("change"):
        one, many = LAYER_CHANGE[layer]
        word = many if m.group("change").strip().endswith("s") else one
        return (m.group("open") or "") + f"{word} ({layer})"
    return (m.group("open") or "") + f"{layer} ({LAYER_SHORT[layer]})" + (m.group("close") or "")


def _filler(m: re.Match[str]) -> str:
    word = FILLER[m.group(1).lower()]
    return word[:1].upper() + word[1:] if m.group(1)[:1].isupper() else word


def plain(text: str | None) -> str | None:
    """One sentence or paragraph of an agent in the product manager's words."""
    if text is None:
        return None
    out = _REF_SPAN.sub("", text)
    pattern, names = _keys()
    out = pattern.sub(lambda m: names[m.group(1)], out)
    out = _IMPACT.sub(
        lambda m: f" (own impact {m.group('impact')}, {LAYER_SHORT[m.group('layer')]})", out
    )
    out = _LAYER.sub(_layer, out)
    out = _FILLER.sub(_filler, out)
    out = _DASH_RANGE.sub(" to ", out)
    out = _DASH.sub(", ", out)
    out = _SPACE.sub(" ", out).replace(" ,", ",").replace(" .", ".")
    return out.strip()


def plain_list(items: list[str] | None) -> list[str]:
    return [p for p in (plain(x) for x in items or []) if p]

"""Versioned prompt templates. Changing a template requires a new version string."""

from __future__ import annotations

from collections.abc import Sequence

GAP_PROMPT_VERSION = "gap-classification-v1"
SEG_PROMPT_VERSION = "source-b-segmentation-v1"


def gap_system_prompt(
    level2: Sequence[tuple[str, str | None]], level3: Sequence[tuple[str, str | None]]
) -> str:
    l2_lines = "\n".join(f"- {name} [{domain or 'general'}]" for name, domain in level2)
    l3_lines = "\n".join(f"- {name} [{polarity or '-'}]" for name, polarity in level3)
    return f"""You classify BMW customer feedback into a fixed, canonical taxonomy (VFC).

A verbatim can carry several labels. Each label has:
- feedback_type: one of "Likes", "Difficult to Use", "Defect", "Wants".
  Likes = praise; Difficult to Use = usability complaint or dissatisfaction without a defect;
  Defect = malfunction, damage, failure; Wants = explicit wish or request for something missing.
- level2: the component or topic. Use EXACTLY one name from the LEVEL-2 list below (copy it verbatim).
- level3: the nature of the statement. Use EXACTLY one name from the LEVEL-3 list below.
  The level-3 polarity must fit the feedback type (positive for Likes, request for Wants, negative otherwise).
- confidence: 0.0 to 1.0.
- rationale: one short sentence quoting the words that triggered the label.

Rules:
1. Prefer existing names. Only when no level-2 name fits at all, set new_theme with a proposed name,
   the closest existing name and a reason; still fill level2 with the proposed name.
2. Ignore dealer, sales process, delivery and customer-service content: it is not product feedback.
   If the whole text is not about the product, return is_product_feedback = false and no labels.
3. Do not invent problems that are not in the text. One label per distinct topic.
4. Output JSON only, following the schema.

LEVEL-2 names [vehicle domain]:
{l2_lines}

LEVEL-3 names [polarity]:
{l3_lines}
"""


def gap_user_prompt(
    text: str, examples: Sequence[tuple[str, Sequence[tuple[str, str, str]]]]
) -> str:
    parts = []
    if examples:
        parts.append(
            "Examples of similar verbatims with their given labels (feedback_type | level2 | level3):"
        )
        for ex_text, labels in examples:
            lab = "; ".join(f"{ft} | {l2} | {l3}" for ft, l2, l3 in labels)
            parts.append(f'- "{ex_text}" -> {lab}')
        parts.append("")
    parts.append("Classify this verbatim:")
    parts.append(f'"{text}"')
    return "\n".join(parts)


def seg_system_prompt() -> str:
    return """You split BMW customer-relations call notes into statements.

Each note mixes product feedback (what the customer likes, misses, finds hard to use or defective)
with process content (dealer visits, call handling, 'writer advised', scheduling, courtesy).
Return the note as an ordered list of segments. Each segment is a verbatim span of the note
(keep the original wording, do not paraphrase), flagged is_product_feedback true or false, with a
short reason. Every sentence of the note must belong to exactly one segment. Output JSON only."""


def seg_user_prompt(text: str) -> str:
    return f'Note:\n"""\n{text}\n"""'

"""Lexical few-shot retrieval with PostgreSQL full-text search (replaced by embeddings in WP1.9)."""

from __future__ import annotations

import re

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from tracepoint.db.models import TaxonomyLevel2, TaxonomyLevel3, Verbatim, VerbatimClassification

STOPWORDS = {
    "that",
    "this",
    "with",
    "have",
    "from",
    "they",
    "there",
    "their",
    "what",
    "when",
    "which",
    "would",
    "could",
    "about",
    "very",
    "really",
    "just",
    "like",
    "been",
    "also",
    "were",
    "will",
    "into",
    "than",
    "then",
    "them",
    "your",
    "some",
    "more",
    "much",
    "because",
    "customer",
    "stated",
    "states",
    "said",
    "mentioned",
    "vehicle",
    "car",
    "bmw",
    "does",
    "doesn",
}
_word_re = re.compile(r"[a-zA-Z]{4,}")


def query_terms(text_: str, limit: int = 12) -> list[str]:
    seen: list[str] = []
    for w in _word_re.findall(text_.lower()):
        if w in STOPWORDS or w in seen:
            continue
        seen.append(w)
        if len(seen) >= limit:
            break
    return seen


def nearest_examples(
    session: Session,
    vehicle_code: str,
    text_: str,
    k: int = 8,
    *,
    exclude_ids: set[str] | None = None,
) -> list[tuple[str, list[tuple[str, str, str]]]]:
    """Return up to k canonically classified verbatims of the same vehicle that share vocabulary."""
    terms = query_terms(text_)
    if not terms:
        return []
    tsquery = " | ".join(terms)
    sql = text(
        """
        SELECT v.id, v.text, ts_rank_cd(to_tsvector('english', v.text), q) AS rank
        FROM verbatim v, to_tsquery('english', :q) q
        WHERE v.vehicle_code = :vehicle
          AND to_tsvector('english', v.text) @@ q
          AND v.char_len BETWEEN 30 AND 500
          AND EXISTS (SELECT 1 FROM verbatim_classification c WHERE c.verbatim_id = v.id AND c.status = 'canonical')
          AND NOT EXISTS (SELECT 1 FROM verbatim_classification c WHERE c.verbatim_id = v.id AND c.status = 'unclassified')
        ORDER BY rank DESC, v.char_len ASC
        LIMIT :k
        """
    )
    exclude = exclude_ids or set()
    rows = session.execute(
        sql, {"q": tsquery, "vehicle": vehicle_code, "k": k + len(exclude)}
    ).all()
    ids = [r[0] for r in rows if r[0] not in exclude][:k]
    if not ids:
        return []
    l2 = {t.id: t.name for t in session.scalars(select(TaxonomyLevel2))}
    l3 = {t.id: t.name for t in session.scalars(select(TaxonomyLevel3))}
    by_id = {v.id: v for v in session.scalars(select(Verbatim).where(Verbatim.id.in_(ids)))}
    classes = session.scalars(
        select(VerbatimClassification).where(
            VerbatimClassification.verbatim_id.in_(ids),
            VerbatimClassification.status == "canonical",
        )
    ).all()
    labels: dict[str, list[tuple[str, str, str]]] = {}
    for c in classes:
        if c.level2_id and c.feedback_type:
            labels.setdefault(c.verbatim_id, []).append(
                (c.feedback_type, l2[c.level2_id], l3.get(c.level3_id or "", c.level3_raw or ""))
            )
    return [(by_id[i].text, labels.get(i, [])) for i in ids if i in by_id and labels.get(i)]

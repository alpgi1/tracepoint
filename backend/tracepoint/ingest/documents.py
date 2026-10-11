"""Ingest a prose PDF (the BMW Group Report) as one searchable text row per page.

The report is set in two to four columns. Reading a page line by line across its full width
interleaves the columns, so each page is split at its column gutters first and the columns are
read one after the other.
"""

from __future__ import annotations

import re
import statistics
from typing import Any

import pdfplumber
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.db.models import DocumentPage, Run, Source
from tracepoint.ingest.registry import file_path, register_source, sha256_of, source_id_for

# Layout of the BMW Group Report: the running header (page number, chapter navigation, section
# title) sits in the top 60 pt of every page.
HEADER_HEIGHT = 60.0
MIN_GUTTER = 9.0  # a vertical band at least this wide that no word crosses
# Narrower columns are the number columns of a table and stay with the labels to their left.
MIN_COLUMN = 150.0
HEADLINE_FACTOR = 1.5  # times the median character size of the page

_hyphen_break = re.compile(r"(\w)-\n(\w)")


def _column_edges(words: list[dict[str, Any]], left: float, right: float) -> list[float]:
    lo = int(min(w["x0"] for w in words))
    hi = int(max(w["x1"] for w in words)) + 1
    covered = [False] * (hi - lo + 2)
    for w in words:
        for x in range(int(w["x0"]) - lo, int(w["x1"]) - lo + 1):
            covered[x] = True
    cuts: list[float] = []
    start: int | None = None
    for i, c in enumerate(covered):
        if not c and start is None:
            start = i
        elif c and start is not None:
            if i - start >= MIN_GUTTER:
                cuts.append(lo + (start + i) / 2)
            start = None
    # ponytail: a table whose own columns are wider than MIN_COLUMN is still read column by
    # column (labels first, then the figures); detect table regions if such figures get cited.
    kept = [c for c, nxt in zip(cuts, [*cuts[1:], hi], strict=False) if nxt - c >= MIN_COLUMN]
    return [left, *kept, right]


def page_text(page: Any) -> tuple[str | None, str]:
    """(section title, body text in reading order) of one page."""
    x0, top, x1, bottom = page.bbox
    split = top + HEADER_HEIGHT
    header = (page.crop((x0, top, x1, split)).extract_text() or "").splitlines()
    body = page.crop((x0, split, x1, bottom))
    parts: list[str] = []
    section = None
    if header and header[0].split()[:1] == [str(page.page_number)]:
        section = header[1].strip() if len(header) > 1 else None
    else:  # no running header (cover, back page): the top of the page is content
        parts += header
    if body.chars:
        # Headlines are set large and run across the gutters; they are read first and kept out
        # of the column detection.
        large = HEADLINE_FACTOR * statistics.median(c["size"] for c in body.chars)
        parts.append(body.filter(lambda o: o.get("size", 0) > large).extract_text() or "")
        prose = body.filter(lambda o: o.get("size", 0) <= large)
        words = prose.extract_words()
        if words:
            edges = _column_edges(words, x0, x1)
            parts += [
                prose.crop((a, split, b, bottom)).extract_text() or ""
                for a, b in zip(edges, edges[1:], strict=False)
            ]
    text = "\n\n".join(p.strip() for p in parts if p.strip())
    # words hyphenated at a line break are joined so that full-text search finds them
    return section, _hyphen_break.sub(r"\1\2", text)


def ingest_document(
    session: Session, run: Run, key: str = "group_report", *, max_pages: int | None = None
) -> dict[str, int]:
    sid = source_id_for(key)
    path = file_path(key)
    existing = session.scalar(
        select(func.count()).select_from(DocumentPage).where(DocumentPage.source_id == sid)
    )
    known = session.get(Source, sid)
    # Parsing takes about a minute, so an unchanged file is not parsed again; `db reset`
    # forces a rebuild after a change to the parser.
    if max_pages is None and existing and known and known.checksum == sha256_of(path):
        return {"pages": existing, "skipped": 1}
    source = register_source(session, run, key)
    session.execute(delete(DocumentPage).where(DocumentPage.source_id == sid))
    prefix = "DOC-" + key.upper().replace("_", "-")
    stats = {"pages": 0, "empty_pages": 0, "chars": 0}
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages[:max_pages]:
            section, text = page_text(page)
            page.flush_cache()
            if not text:
                stats["empty_pages"] += 1
                continue
            session.add(
                DocumentPage(
                    id=f"{prefix}-{page.page_number:04d}",
                    source_id=source.id,
                    page=page.page_number,
                    section=section,
                    text=text,
                    char_len=len(text),
                    locator={"file": path.name, "page": page.page_number},
                    created_run_id=run.id,
                )
            )
            stats["pages"] += 1
            stats["chars"] += len(text)
    session.flush()
    record_event(
        session,
        actor_type="system",
        actor_id="ingest.documents",
        action="document.ingested",
        entity_type="source",
        entity_id=source.id,
        run_id=run.id,
        after=stats,
        rationale=f"Parsed {path.name} page by page, columns read in order, running header removed",
    )
    return stats

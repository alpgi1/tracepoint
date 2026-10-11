"""Engine and session helpers."""

from __future__ import annotations

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from tracepoint.core.settings import get_settings
from tracepoint.db.models import Base


def make_engine(url: str | None = None) -> Engine:
    return create_engine(url or get_settings().database_url, future=True)


def make_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, expire_on_commit=False)


FTS_INDEX_SQL = (
    "CREATE INDEX IF NOT EXISTS ix_verbatim_fts ON verbatim "
    "USING GIN (to_tsvector('english', text))"
)


DOCUMENT_FTS_INDEX_SQL = (
    "CREATE INDEX IF NOT EXISTS ix_document_page_fts ON document_page "
    "USING GIN (to_tsvector('english', text))"
)


def init_schema(engine: Engine) -> None:
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text(FTS_INDEX_SQL))
        conn.execute(text(DOCUMENT_FTS_INDEX_SQL))


def drop_schema(engine: Engine) -> None:
    Base.metadata.drop_all(engine)

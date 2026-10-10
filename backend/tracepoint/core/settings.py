"""Application settings (environment variables with the TRACEPOINT_ prefix, optional .env)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="TRACEPOINT_",
        env_file=(REPO_ROOT / ".env", REPO_ROOT / "backend" / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://tracepoint:tracepoint@localhost:5432/tracepoint"
    test_database_url: str = (
        "postgresql+psycopg://tracepoint:tracepoint@localhost:5432/tracepoint_test"
    )

    docs_dir: Path = REPO_ROOT / "docs"
    config_dir: Path = REPO_ROOT / "config"
    data_dir: Path = REPO_ROOT / "data"

    # LLM / embedding provider settings. The team will provide the values in a later step;
    # nothing in Phase 1 ingestion calls an external API.
    llm_provider: str = "openai"
    openai_api_key: str | None = None
    openai_model: str = ""
    embedding_model: str = ""

    # Default human actor for audit events created through the CLI / API.
    human_actor_id: str = "pm"


@lru_cache
def get_settings() -> Settings:
    return Settings()

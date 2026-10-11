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
    openai_base_url: str | None = None
    openai_model: str = ""  # reasoning jobs (findings narration, requirements, challenges)
    openai_model_bulk: str = (
        ""  # bulk jobs (classification, segmentation); falls back to openai_model
    )
    embedding_model: str = ""
    llm_max_cost_usd_per_run: float = 25.0
    # Across all runs of the last 24 hours; every API request for an analysis is its own run, so
    # the per-run cap alone would not bound repeated requests. 0 switches it off.
    llm_max_cost_usd_per_day: float = 50.0
    llm_concurrency: int = 4
    llm_timeout_seconds: float = 120.0
    llm_max_attempts: int = 4
    llm_temperature: float = 0.0

    # Default human actor for audit events created through the CLI / API.
    human_actor_id: str = "pm"


@lru_cache
def get_settings() -> Settings:
    return Settings()

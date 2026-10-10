"""SQLAlchemy models for the Tracepoint evidence store (Phase 1 subset).

Every evidence row carries a source reference, a locator back to the original file position and
the run that created it. Identifiers are stable and human-readable (see core.ids).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# --------------------------------------------------------------------------------------------
# Reference data
# --------------------------------------------------------------------------------------------


class Vehicle(Base):
    __tablename__ = "vehicle"

    code: Mapped[str] = mapped_column(String(8), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    series: Mapped[str] = mapped_column(String(40))
    generation: Mapped[str | None] = mapped_column(String(80))
    segment: Mapped[str | None] = mapped_column(String(80))
    tier: Mapped[str | None] = mapped_column(String(40))
    notes: Mapped[str | None] = mapped_column(Text)

    variants: Mapped[list[VehicleVariant]] = relationship(back_populates="vehicle")


class VehicleVariant(Base):
    __tablename__ = "vehicle_variant"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vehicle_code: Mapped[str] = mapped_column(ForeignKey("vehicle.code"))
    name: Mapped[str] = mapped_column(String(80))
    powertrain: Mapped[str | None] = mapped_column(String(16))  # ICE / MHEV / PHEV / BEV
    fuel: Mapped[str | None] = mapped_column(String(16))  # petrol / diesel / electric
    drive: Mapped[str | None] = mapped_column(String(16))  # front / rear / all-wheel
    power_kw: Mapped[int | None] = mapped_column(Integer)
    base_price_eur: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    column_order: Mapped[int | None] = mapped_column(Integer)
    source_id: Mapped[str | None] = mapped_column(ForeignKey("source.id"))
    locator: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))

    vehicle: Mapped[Vehicle] = relationship(back_populates="variants")


class Market(Base):
    __tablename__ = "market"

    code: Mapped[str] = mapped_column(String(8), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    notes: Mapped[str | None] = mapped_column(Text)


class Country(Base):
    __tablename__ = "country"

    code: Mapped[str] = mapped_column(String(2), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    market_code: Mapped[str] = mapped_column(ForeignKey("market.code"))


class Source(Base):
    __tablename__ = "source"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    kind: Mapped[str] = mapped_column(String(32))  # internal_file / web_page / manual
    name: Mapped[str] = mapped_column(String(200))
    path_or_url: Mapped[str] = mapped_column(Text)
    format: Mapped[str | None] = mapped_column(String(32))
    layer: Mapped[str | None] = mapped_column(String(40))
    checksum: Mapped[str | None] = mapped_column(String(80))
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reliability: Mapped[str | None] = mapped_column(String(40))
    notes: Mapped[str | None] = mapped_column(Text)
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))


# --------------------------------------------------------------------------------------------
# Taxonomy (canonical VFC lists)
# --------------------------------------------------------------------------------------------


class TaxonomyLevel2(Base):
    __tablename__ = "taxonomy_level2"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    domain_key: Mapped[str | None] = mapped_column(String(40))
    origin: Mapped[str] = mapped_column(String(16), default="given")  # given / proposed
    status: Mapped[str] = mapped_column(String(16), default="canonical")
    notes: Mapped[str | None] = mapped_column(Text)


class TaxonomyLevel3(Base):
    __tablename__ = "taxonomy_level3"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    polarity: Mapped[str | None] = mapped_column(
        String(16)
    )  # positive / negative / request / neutral
    origin: Mapped[str] = mapped_column(String(16), default="given")
    status: Mapped[str] = mapped_column(String(16), default="canonical")
    notes: Mapped[str | None] = mapped_column(Text)


# --------------------------------------------------------------------------------------------
# Evidence: verbatims
# --------------------------------------------------------------------------------------------


class Verbatim(Base):
    __tablename__ = "verbatim"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)  # given ID, e.g. G60-0123
    vehicle_code: Mapped[str] = mapped_column(ForeignKey("vehicle.code"))
    source_label: Mapped[str] = mapped_column(String(16))  # Source A–D
    country_code: Mapped[str | None] = mapped_column(ForeignKey("country.code"))
    market_code: Mapped[str | None] = mapped_column(ForeignKey("market.code"))
    powertrain: Mapped[str | None] = mapped_column(String(16))
    brand: Mapped[str | None] = mapped_column(String(40))
    sales_description: Mapped[str | None] = mapped_column(String(80))
    text: Mapped[str] = mapped_column(Text)
    char_len: Mapped[int] = mapped_column(Integer)
    source_id: Mapped[str] = mapped_column(ForeignKey("source.id"))
    locator: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))

    classifications: Mapped[list[VerbatimClassification]] = relationship(back_populates="verbatim")


class VerbatimClassification(Base):
    __tablename__ = "verbatim_classification"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)  # e.g. G60-0123#1
    verbatim_id: Mapped[str] = mapped_column(ForeignKey("verbatim.id"))
    row_no: Mapped[int | None] = mapped_column(Integer)  # Excel row of the given classification
    feedback_type: Mapped[str | None] = mapped_column(String(32))
    level2_id: Mapped[str | None] = mapped_column(ForeignKey("taxonomy_level2.id"))
    level3_id: Mapped[str | None] = mapped_column(ForeignKey("taxonomy_level3.id"))
    level2_raw: Mapped[str | None] = mapped_column(String(200))
    level3_raw: Mapped[str | None] = mapped_column(String(200))
    combined_raw: Mapped[str | None] = mapped_column(String(400))
    origin: Mapped[str] = mapped_column(String(16))  # given / llm / human
    status: Mapped[str] = mapped_column(
        String(16)
    )  # canonical / unclassified / proposed / rejected
    confidence: Mapped[float | None] = mapped_column(Float)
    rationale: Mapped[str | None] = mapped_column(Text)
    model_id: Mapped[str | None] = mapped_column(String(80))
    prompt_version: Mapped[str | None] = mapped_column(String(40))
    run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))
    locator: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    verbatim: Mapped[Verbatim] = relationship(back_populates="classifications")


class VerbatimSegment(Base):
    __tablename__ = "verbatim_segment"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)
    verbatim_id: Mapped[str] = mapped_column(ForeignKey("verbatim.id"))
    seq: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    is_product_feedback: Mapped[bool | None] = mapped_column(Boolean)
    reason: Mapped[str | None] = mapped_column(Text)
    model_id: Mapped[str | None] = mapped_column(String(80))
    run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))


# --------------------------------------------------------------------------------------------
# Evidence: studies, sales, equipment, technical data
# --------------------------------------------------------------------------------------------


class StudyMetric(Base):
    __tablename__ = "study_metric"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    vehicle_code: Mapped[str] = mapped_column(ForeignKey("vehicle.code"))
    market_code: Mapped[str] = mapped_column(ForeignKey("market.code"))
    study: Mapped[str] = mapped_column(String(40))  # CN_EU_2025 / US_2025
    attribute_raw: Mapped[str] = mapped_column(String(200))
    attribute_key: Mapped[str | None] = mapped_column(String(80))
    domain_key: Mapped[str | None] = mapped_column(String(40))
    stat_kind: Mapped[str] = mapped_column(String(16))  # mean / distribution
    mean: Mapped[float | None] = mapped_column(Float)
    distribution: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    scale_note: Mapped[str | None] = mapped_column(String(200))
    source_id: Mapped[str] = mapped_column(ForeignKey("source.id"))
    locator: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))


class SalesVolume(Base):
    __tablename__ = "sales_volume"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    vehicle_code: Mapped[str] = mapped_column(ForeignKey("vehicle.code"))
    market_code: Mapped[str] = mapped_column(ForeignKey("market.code"))
    year: Mapped[int] = mapped_column(Integer)
    units: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(16))  # actual / forecast
    note: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str] = mapped_column(ForeignKey("source.id"))
    locator: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))


class EquipmentItem(Base):
    __tablename__ = "equipment_item"

    id: Mapped[str] = mapped_column(String(24), primary_key=True)  # EQ-G60-0001
    vehicle_code: Mapped[str] = mapped_column(ForeignKey("vehicle.code"))
    sa_code: Mapped[str | None] = mapped_column(String(16))
    name_de: Mapped[str] = mapped_column(String(300))
    name_en: Mapped[str | None] = mapped_column(String(300))
    section: Mapped[str] = mapped_column(String(80))  # catalogue chapter
    group_key: Mapped[str | None] = mapped_column(String(80))  # normalised equipment group
    domain_key: Mapped[str | None] = mapped_column(String(40))
    description_de: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    price_eur: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    price_note: Mapped[str | None] = mapped_column(String(80))  # standard / no_cost_option / ...
    source_id: Mapped[str] = mapped_column(ForeignKey("source.id"))
    locator: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))

    availability: Mapped[list[EquipmentAvailability]] = relationship(back_populates="item")
    dependencies: Mapped[list[EquipmentDependency]] = relationship(back_populates="item")


class EquipmentAvailability(Base):
    __tablename__ = "equipment_availability"
    __table_args__ = (UniqueConstraint("equipment_item_id", "variant_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    equipment_item_id: Mapped[str] = mapped_column(ForeignKey("equipment_item.id"))
    variant_id: Mapped[str] = mapped_column(ForeignKey("vehicle_variant.id"))
    status: Mapped[str] = mapped_column(
        String(24)
    )  # standard / optional / no_cost_option / not_available
    note: Mapped[str | None] = mapped_column(Text)

    item: Mapped[EquipmentItem] = relationship(back_populates="availability")


class EquipmentDependency(Base):
    __tablename__ = "equipment_dependency"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    equipment_item_id: Mapped[str] = mapped_column(ForeignKey("equipment_item.id"))
    kind: Mapped[str] = mapped_column(String(24))  # requires / excludes / included_in / note
    text: Mapped[str] = mapped_column(Text)

    item: Mapped[EquipmentItem] = relationship(back_populates="dependencies")


class TechSpec(Base):
    __tablename__ = "tech_spec"

    id: Mapped[str] = mapped_column(String(96), primary_key=True)
    vehicle_code: Mapped[str] = mapped_column(ForeignKey("vehicle.code"))
    variant_id: Mapped[str | None] = mapped_column(ForeignKey("vehicle_variant.id"))
    attribute_key: Mapped[str] = mapped_column(String(80))
    attribute_raw: Mapped[str | None] = mapped_column(String(200))
    value: Mapped[str] = mapped_column(String(120))
    value_num: Mapped[float | None] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(24))
    source_id: Mapped[str] = mapped_column(ForeignKey("source.id"))
    locator: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))


class Embedding(Base):
    """Vector store (provider and model to be decided by the team; filled in a later step)."""

    __tablename__ = "embedding"

    evidence_ref: Mapped[str] = mapped_column(String(120), primary_key=True)
    model: Mapped[str] = mapped_column(String(80), primary_key=True)
    dim: Mapped[int] = mapped_column(Integer)
    vector: Mapped[bytes] = mapped_column(LargeBinary)
    text_hash: Mapped[str] = mapped_column(String(64))
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))


# --------------------------------------------------------------------------------------------
# Findings (Phase 3): layer-specific, quantified signals with linked evidence
# --------------------------------------------------------------------------------------------


class Finding(Base):
    __tablename__ = "finding"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    vehicle_code: Mapped[str] = mapped_column(ForeignKey("vehicle.code"))
    market_code: Mapped[str | None] = mapped_column(ForeignKey("market.code"))
    powertrain: Mapped[str | None] = mapped_column(String(16))
    layer: Mapped[str] = mapped_column(String(40))  # evidence layer key
    kind: Mapped[str] = mapped_column(
        String(40)
    )  # recurring_complaint / unmet_need / strength / metric_gap / ...
    domain_key: Mapped[str | None] = mapped_column(String(40))
    theme_level2_id: Mapped[str | None] = mapped_column(ForeignKey("taxonomy_level2.id"))
    attribute_key: Mapped[str | None] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(300))
    statement: Mapped[str] = mapped_column(Text)
    quantification: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    severity_score: Mapped[float | None] = mapped_column(Float)
    evidence_level: Mapped[str | None] = mapped_column(String(2))  # A / B / C / D
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        String(16), default="proposed"
    )  # proposed / approved / rejected / merged
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[str] = mapped_column(String(80))
    created_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))
    updated_run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))

    evidence: Mapped[list[FindingEvidence]] = relationship(
        back_populates="finding", cascade="all, delete-orphan"
    )


class FindingEvidence(Base):
    __tablename__ = "finding_evidence"
    __table_args__ = (UniqueConstraint("finding_id", "evidence_ref"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    finding_id: Mapped[str] = mapped_column(ForeignKey("finding.id"))
    evidence_ref: Mapped[str] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(24))  # quantifies / example / supports / compares
    weight: Mapped[float | None] = mapped_column(Float)
    note: Mapped[str | None] = mapped_column(Text)

    finding: Mapped[Finding] = relationship(back_populates="evidence")


class FindingLink(Base):
    __tablename__ = "finding_link"
    __table_args__ = (UniqueConstraint("from_finding_id", "to_finding_id", "kind"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    from_finding_id: Mapped[str] = mapped_column(ForeignKey("finding.id"))
    to_finding_id: Mapped[str] = mapped_column(ForeignKey("finding.id"))
    kind: Mapped[str] = mapped_column(String(24))  # supports / contradicts / explains / same_topic
    rationale: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(String(80))
    run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))


# --------------------------------------------------------------------------------------------
# Runs, LLM calls, audit
# --------------------------------------------------------------------------------------------


class Run(Base):
    __tablename__ = "run"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    kind: Mapped[str] = mapped_column(String(40))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(16))  # running / finished / failed
    config_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    code_version: Mapped[str | None] = mapped_column(String(40))
    model_ids: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    notes: Mapped[str | None] = mapped_column(Text)


class LlmCall(Base):
    __tablename__ = "llm_call"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"))
    purpose: Mapped[str] = mapped_column(String(80))
    provider: Mapped[str] = mapped_column(String(40))
    model: Mapped[str] = mapped_column(String(80))
    prompt_version: Mapped[str | None] = mapped_column(String(40))
    input_hash: Mapped[str] = mapped_column(String(64), index=True)
    input_tokens: Mapped[int | None] = mapped_column(Integer)
    cached_tokens: Mapped[int | None] = mapped_column(Integer)
    output_tokens: Mapped[int | None] = mapped_column(Integer)
    cost_estimate_usd: Mapped[float | None] = mapped_column(Float)
    request: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    response: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(16), default="ok")  # ok / error
    error: Mapped[str | None] = mapped_column(Text)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    attempts: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuditEvent(Base):
    __tablename__ = "audit_event"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    run_id: Mapped[str | None] = mapped_column(ForeignKey("run.id"), index=True)
    actor_type: Mapped[str] = mapped_column(String(16))  # human / agent / system
    actor_id: Mapped[str] = mapped_column(String(80))
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str] = mapped_column(String(40), index=True)
    entity_id: Mapped[str] = mapped_column(String(120), index=True)
    before: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    after: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    rationale: Mapped[str | None] = mapped_column(Text)
    model_id: Mapped[str | None] = mapped_column(String(80))
    prompt_version: Mapped[str | None] = mapped_column(String(40))
    parent_event_id: Mapped[int | None] = mapped_column(BigInteger)

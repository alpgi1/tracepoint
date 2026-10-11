"""Ingestion tests pin the exact counts established in reports/step-01 and spot-check rows."""

from __future__ import annotations

from decimal import Decimal

import pytest
from sqlalchemy import func, select

from tracepoint.db.models import (
    AuditEvent,
    EquipmentAvailability,
    EquipmentItem,
    Run,
    SalesVolume,
    StudyMetric,
    TaxonomyLevel2,
    TaxonomyLevel3,
    VehicleVariant,
    Verbatim,
    VerbatimClassification,
)

EXPECTED_VERBATIMS = {"F70": (4076, 2128, 1087), "G60": (5005, 4000, 725), "G70": (4690, 4000, 670)}


@pytest.mark.parametrize("vehicle", list(EXPECTED_VERBATIMS))
def test_verbatim_counts(session, ingested, vehicle):
    rows, uniques, unclassified = EXPECTED_VERBATIMS[vehicle]
    st = ingested[f"verbatims_{vehicle}"]
    assert (st["rows"], st["verbatims"], st["unclassified"]) == (rows, uniques, unclassified)
    assert st["canonical"] + st["unclassified"] == rows  # every row resolved or marked unclassified
    assert "dq_unresolved_level2" not in st
    n = session.scalar(
        select(func.count()).select_from(Verbatim).where(Verbatim.vehicle_code == vehicle)
    )
    assert n == uniques


def test_every_verbatim_has_locator_market_and_run(session):
    bad = session.scalar(
        select(func.count())
        .select_from(Verbatim)
        .where((Verbatim.locator.is_(None)) | (Verbatim.created_run_id.is_(None)))
    )
    assert bad == 0
    no_market = session.scalar(
        select(func.count()).select_from(Verbatim).where(Verbatim.market_code.is_(None))
    )
    assert no_market == 0


def test_taxonomy_is_canonical_and_mapped(session):
    canonical = TaxonomyLevel2.status == "canonical"
    assert session.scalar(select(func.count()).select_from(TaxonomyLevel2).where(canonical)) == 225
    assert session.scalar(select(func.count()).select_from(TaxonomyLevel3)) == 84
    no_domain = (
        select(func.count())
        .select_from(TaxonomyLevel2)
        .where(canonical, TaxonomyLevel2.domain_key.is_(None))
    )
    assert session.scalar(no_domain) == 0
    no_polarity = (
        select(func.count()).select_from(TaxonomyLevel3).where(TaxonomyLevel3.polarity.is_(None))
    )
    assert session.scalar(no_polarity) == 0
    unresolved = (
        select(func.count())
        .select_from(VerbatimClassification)
        .where(VerbatimClassification.status == "unresolved")
    )
    assert session.scalar(unresolved) == 0


def test_study_metrics(session, ingested):
    st = ingested["studies"]
    assert st["cn_eu_means"] == 185 and st["us_distributions"] == 206
    assert st["unmapped_attributes"] == 0
    assert "dq_us_distribution_sum_off" not in st
    g60_us = session.scalars(
        select(StudyMetric).where(
            StudyMetric.vehicle_code == "G60", StudyMetric.market_code == "US"
        )
    ).all()
    assert len(g60_us) == 103
    sample = next(m for m in g60_us if m.attribute_key == "voice_recognition")
    shares = sample.distribution["shares"]
    assert abs(sum(shares.values()) - 1.0) < 0.02
    eu_f70 = session.scalar(
        select(StudyMetric).where(
            StudyMetric.vehicle_code == "F70",
            StudyMetric.market_code == "EU",
            StudyMetric.attribute_key == "cargo_capacity",
        )
    )
    assert eu_f70 is not None and round(eu_f70.mean, 2) == 7.07


def test_sales(session, ingested):
    assert ingested["sales"]["rows"] == 36
    f70_us_2025 = session.scalar(select(SalesVolume).where(SalesVolume.id == "SAL-F70-US-2025"))
    assert f70_us_2025.units == 0
    g60_eu_2030 = session.scalar(select(SalesVolume).where(SalesVolume.id == "SAL-G60-EU-2030"))
    assert g60_eu_2030.units == 127000 and g60_eu_2030.kind == "forecast" and g60_eu_2030.note


def test_variants(session):
    counts = {
        code: session.scalar(
            select(func.count())
            .select_from(VehicleVariant)
            .where(VehicleVariant.vehicle_code == code)
        )
        for code in ("F70", "G60", "G70")
    }
    assert counts == {"F70": 6, "G60": 10, "G70": 7}
    i5 = session.get(VehicleVariant, "G60-i5_edrive40")
    assert (
        i5.powertrain == "BEV" and i5.base_price_eur == Decimal("70900.00") and i5.power_kw == 250
    )
    m70 = session.get(VehicleVariant, "G70-i7_m70_xdrive")
    assert m70.base_price_eur == Decimal("182400.00")
    v120 = session.get(VehicleVariant, "F70-120")
    assert v120.powertrain == "MHEV" and v120.fuel == "petrol"


def _availability(session, vehicle, sa_code, section="Sonderausstattungen"):
    item = session.scalar(
        select(EquipmentItem).where(
            EquipmentItem.vehicle_code == vehicle,
            EquipmentItem.sa_code == sa_code,
            EquipmentItem.section == section,
        )
    )
    assert item is not None, f"{vehicle} {sa_code} not found"
    rows = session.scalars(
        select(EquipmentAvailability).where(EquipmentAvailability.equipment_item_id == item.id)
    ).all()
    names = {
        v.id: v.name
        for v in session.scalars(
            select(VehicleVariant).where(VehicleVariant.vehicle_code == vehicle)
        )
    }
    return item, {names[r.variant_id]: r.status for r in rows}


def test_equipment_spot_checks(session):
    item, av = _availability(session, "F70", "248")
    assert item.price_eur == Decimal("250.00") and item.name_en == "Steering wheel heating"
    assert set(av.values()) == {"optional"} and len(av) == 6
    item, av = _availability(session, "F70", "674")
    assert (
        item.price_eur == Decimal("600.00")
        and av["M135 xDrive"] == "standard"
        and av["116"] == "optional"
    )
    item, av = _availability(session, "F70", "5DW")
    assert av["120d"] == "optional" and av["116"] == "not_available"
    item, av = _availability(session, "G60", "5DW")
    assert item.price_eur == Decimal("1150.00") and set(av.values()) == {"optional"}
    item, av = _availability(session, "G70", "3CD")
    assert item.price_eur == Decimal("1600.00") and item.name_en == "Automatic doors"
    item, av = _availability(session, "F70", "1H5", section="Räder und Reifen")
    assert (
        item.price_note == "no_cost_option"
        and av["M135 xDrive"] == "standard"
        and av["116"] == "no_cost_option"
    )


def test_equipment_translated_and_located(session):
    untranslated = session.scalar(
        select(func.count()).select_from(EquipmentItem).where(EquipmentItem.name_en.is_(None))
    )
    assert untranslated == 0
    no_locator = session.scalar(
        select(func.count()).select_from(EquipmentItem).where(EquipmentItem.locator.is_(None))
    )
    assert no_locator == 0
    no_domain = session.scalar(
        select(func.count()).select_from(EquipmentItem).where(EquipmentItem.domain_key.is_(None))
    )
    assert no_domain == 0


def test_runs_and_audit_events(session):
    runs = session.scalars(select(Run)).all()
    assert runs and all(r.status == "finished" for r in runs)
    actions = {a for (a,) in session.execute(select(AuditEvent.action).distinct())}
    assert {
        "run.started",
        "run.finished",
        "source.registered",
        "verbatims.ingested",
        "studies.ingested",
        "sales.ingested",
        "optionlist.ingested",
        "taxonomy.loaded",
    } <= actions
    for e in session.scalars(select(AuditEvent).limit(50)):
        assert e.actor_type in ("human", "agent", "system") and e.ts is not None and e.entity_id


def test_group_report_pages_read_in_column_order():
    import pdfplumber

    from tracepoint.ingest.documents import page_text
    from tracepoint.ingest.registry import file_path

    with pdfplumber.open(file_path("group_report")) as pdf:
        section, table_page = page_text(pdf.pages[60])
        _, headline_page = page_text(pdf.pages[64])
    assert section == "Overview of the BMW Group"
    # the prose column is not interleaved with the table beside it, and table rows stay whole
    assert "and Rolls-Royce\nMotor Cars for 5,385 units" in table_page
    assert "Spartanburg (USA) 412,799 396,117 4.2" in table_page
    # a headline across the gutters does not merge the columns; line-break hyphens are joined
    assert "reductions in research and development expenditure" in headline_page.replace("\n", " ")


def test_group_report_ingestion_and_search(session):
    from tracepoint.agent.tools import call_tool
    from tracepoint.core.runs import start_run
    from tracepoint.db.models import DocumentPage
    from tracepoint.ingest.documents import ingest_document

    for _ in range(2):  # a second run replaces the pages
        with start_run(session, "test.ingest.documents") as run:
            assert ingest_document(session, run, max_pages=5)["pages"] == 5
    pages = session.scalars(
        select(DocumentPage)
        .where(DocumentPage.source_id == "SRC-GROUP-REPORT")  # external pages sit beside it
        .order_by(DocumentPage.page)
    ).all()
    assert [p.page for p in pages] == [1, 2, 3, 4, 5]
    assert all(p.locator["page"] == p.page and p.created_run_id for p in pages)
    hit = call_tool(session, "search_documents", {"query": "strategic goals all-electric"})
    assert hit["items"][0]["evidence_ref"] == "document:DOC-GROUP-REPORT-0003"
    # no page holds every word: any-word matching takes over
    assert call_tool(session, "search_documents", {"query": "zzzunknown strategic"})["total"]
    session.rollback()

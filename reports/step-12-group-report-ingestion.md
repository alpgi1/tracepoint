# Step 12 – Ingestion of the BMW Group Report 2025

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – 434 pages in the database, searchable by the agents; 45 tests passed |
| Why | A check of `docs/` against the source registry showed nine files and eight registered sources: the Group Report had been added to `docs/` but no parser read it |

## 1. Delivered

* **Source** `SRC-GROUP-REPORT` in the registry (layer Portfolio & Offering), decision D-062.
* **Table `document_page`**: one row per page with section title, text, character count, locator
  (`file`, `page`) and creating run. Identifiers `DOC-GROUP-REPORT-0001` … `0434`.
* **Parser** `ingest/documents.py`. The report is set in two to four columns, and reading a page
  across its full width interleaves them. Each page is therefore split at its column gutters
  (vertical bands no word crosses) and read column by column. Columns narrower than 150 pt are
  the number columns of a table and stay with the labels to their left, so table rows remain
  whole. Headlines (more than 1.5 times the median character size) are read first and kept out
  of the gutter detection. The running header is removed and its second line kept as the
  section title; words hyphenated at a line break are joined.
* **CLI** `tracepoint ingest documents`, also the last parsing step of `ingest all`. Parsing takes
  about 55 seconds, so the step is skipped while the file checksum is unchanged.
* **Agent tool** `search_documents(query, limit)` (ninth tool): full-text search over the pages
  with a GIN index. Pages that contain every query word are ranked by cover density; if no page
  does, any word may match. Each hit carries `document:<id>`, page, section and up to three
  passages. Logged like every other tool call.

## 2. Verification

| Check | Result |
|---|---|
| Pages | 434 of 434 stored, 0 empty, 1,504,210 characters; 423 pages with a section title |
| Second run | `{"pages": 434, "skipped": 1}` |
| Page 61 (prose beside a table) | prose column contiguous; row `Spartanburg (USA) 412,799 396,117 4.2` intact |
| Page 65 (headline across three columns) | three columns read in order |
| Search, every-word path | "automobile production by plant Spartanburg" → page 61; "BMW 5 Series deliveries" → page 79 (deliveries by model series); "share of all-electric cars in deliveries 2030" → page 3; 4–50 ms per call |
| Search, fallback path | a query with an unknown word still returns pages (about 90 ms) |
| Tests / lint | 45 passed; `ruff check` and `ruff format --check` clean |

## 3. Known limitations

* A table whose own columns are wider than 150 pt is read column by column (labels, then
  figures); seen on page 296 (earnings per share).
* On the infographic pages (2, 3) the large figures are listed before their labels.
* Search is lexical, like `search_evidence` (D-059).
* The report is evidence the agents can cite, but no finding or requirement uses it yet, and the
  context packs do not include it.
* The PDF metadata carries a "CONFIDENTIAL" footer marking from the authoring template. Passages
  returned by `search_documents` go to the LLM provider once an agent loop uses the tool; the
  team should confirm that this file may be sent.

## 4. Next step

The agent loop (tool calling through the LLM gateway), which is what the nine tools are waiting
for.

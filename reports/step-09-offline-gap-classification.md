# Step 09 – Offline gap classification and reproducible local database

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – clean rebuild (`./start.sh --reset`) verified on Fedora with Podman; 26 tests passed |
| Why | The team wants the backend running locally with the data ingested and classified, without spending OpenAI credits, and without losing database content when the stack is rebuilt or started on another machine |

## 1. Delivered

* **Gap classification without an API call.** The 2,482 verbatims that carry an unclassified
  row (F70 1,087, G60 725, G70 670) were read and labelled by the assistant against the canonical
  VFC taxonomy, following the rules of the `gap-classification-v1` prompt (canonical names only,
  level-3 polarity matching the feedback type, dealer and process content marked as not product
  feedback). No new themes were proposed.
* **Labels as committed files.** `config/classifications/{F70,G60,G70}_gaps.jsonl`, one line per
  verbatim: `{"id", "is_product_feedback", "labels": [{feedback_type, level2, level3,
  confidence, rationale}], "note"}`. The rationale quotes the words that triggered the label.
* **`tracepoint classify import [--vehicle …]`** (`classify/gap.py: import_gap_file`) applies a
  file through the existing `apply_result` path: rows get origin `llm`, model id
  `assistant:claude-opus-5-5`, prompt version `gap-classification-v1`, one audit event per
  verbatim plus a summary event. Given labels are never overwritten, duplicates of existing
  (type, level 2, level 3) triples are skipped, verbatims already labelled are skipped, so the
  command is idempotent.
* **`ingest all` ends with the import.** Re-ingesting a vehicle deletes all its classification
  rows; the import puts the labels back in the same run, so `./start.sh` and `--reset` always
  produce the classified database.
* `docker-compose.yml`: SELinux label `z` on the init-script mount (ignored where SELinux is
  off), needed for Podman / Fedora. Root README: Podman instructions and a short "where the data
  lives" section. Decisions D-056 and D-057.
* Test `test_import_gap_file_is_idempotent`.

## 2. Verification

| Check | Result |
|---|---|
| Labels in files | 2,438 verbatims, 4,479 labels; 199 verbatims marked not product feedback (dealer, finance, delivery) |
| Validation | every level-2 / level-3 name exists in the canonical taxonomy and every level-3 polarity matches its feedback type (script check before writing the files) |
| Import on a fresh database | 4,433 labels added (Likes 2,396, Difficult to Use 1,113, Wants 502, Defect 422), 46 duplicates of given labels skipped |
| Idempotency | `ingest all` run twice: `llm` rows stay at 4,433, total classification rows 18,204 |
| Findings G60 US | 226 (before 211) |
| Findings F70 EU | 123 (before 90) |
| Findings G70 US | 269 (before 263) |
| Findings G60 EU | 35 (before 31) |
| Tests / lint | 26 passed; `ruff check` and `ruff format --check` clean |

44 targeted verbatims have no line in the files: their only topics were already covered by the
given labels of the same verbatim.

## 3. Known limitations

* The labels are one assistant's reading, not a blind-validated model run; confidence values are
  the assistant's own estimate. `classify validate` against `config/validation/` can measure
  agreement once an API key is available.
* The given `unclassified` rows stay in the table with status `unclassified` (the existing LLM
  path behaves the same); baseline reports still count them as unclassified rows.
* Source B segmentation (G60 2,626 and G70 2,853 call-centre notes) is not done: nothing
  downstream consumes segments yet.
* The database itself is not committed (D-057). Data that only exists in the database, such as
  future PM decisions, needs a file export before it can survive a rebuild.

## 4. Open items for the team

1. Spot-check the label files (they are plain JSON lines, one verbatim per line) and correct any
   label by editing the file, then `./start.sh --reset` or `tracepoint ingest all`.
2. Decide whether Source B segmentation should also be done offline.

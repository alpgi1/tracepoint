# Step 05 – One-command local start, Docker PostgreSQL, dump and restore

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – verified end to end in the development container (`--no-docker` path, 60 seconds, 25 tests passed); the Docker path could not be exercised here because the container has no Docker daemon |
| Why | The cloud container's database is ephemeral and not reachable from the team's machines; the team needs the full stack on their own computers with one command |

## 1. Delivered

* `docker-compose.yml`: PostgreSQL 16 in container `tracepoint-postgres` with the persistent
  volume `tracepoint-pgdata`, health check, host port `TRACEPOINT_PG_PORT` (default 5432);
  `scripts/db/init/01-test-database.sql` creates `tracepoint_test` on first start.
* `start.sh` (macOS / Linux / WSL) and `start.ps1` (Windows PowerShell): prerequisites
  (installs `uv` if missing, checks Docker), database start and readiness wait, `.env` creation
  with the right connection strings, `uv sync`, schema, taxonomy extraction, ingestion of
  `docs/`, finding extraction for four scopes, baseline and finding reports under
  `data/reports/`, test suite, optional LLM validation (`--with-llm`, `--llm-full`), status
  summary, optional API start (`--api`). Idempotent; `--reset` rebuilds from scratch;
  `--no-docker` uses an existing PostgreSQL.
* `scripts/db-dump.sh` / `scripts/db-restore.sh`: custom-format dump of the database to
  `backups/` (git-ignored) and restore, through the compose container or `--local`.
* `tracepoint status`: row counts of the main tables and the last runs.
* Root `README.md` with the quick start; Makefile targets `start` and `status`.
* Finding extraction made fully deterministic across sessions (ordered queries, sorted
  breakdowns, identifier tie-breaks), so re-runs report `updated: 0` instead of spurious
  version bumps.

## 2. Verification

| Check | Result |
|---|---|
| `./start.sh --no-docker` in the development container | all eight steps completed in 60 s; 25 tests passed; status shows 10,128 verbatims, 13,771 classifications, 391 metrics, 36 sales rows, 463 equipment items, 342 specs, 599 findings, 217 links |
| Finding re-extraction (G70 US, twice) | 263 unchanged, 0 updated |
| `scripts/db-dump.sh --local` | 1.6 MB dump written |
| `bash -n` on all shell scripts | syntax clean |
| Docker path | not testable here (no daemon); compose file and commands follow the standard `postgres:16` image contract |

## 3. Notes for the team

* First run on a laptop takes a few minutes (Docker image pull, Python environment); later runs
  about one minute.
* If port 5432 is busy: `TRACEPOINT_PG_PORT=5433 ./start.sh`.
* The cloud container's data does not need to be transferred: everything is rebuilt from
  `docs/`; LLM outputs produced later can be shared with the dump scripts.

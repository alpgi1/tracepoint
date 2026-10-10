# Tracepoint

AI-powered customer requirements platform for BMW product managers (hackathon prototype).
Evidence from customer verbatims, studies, sales volumes, equipment catalogues and (later) external
sources is ingested into a traceable evidence store, turned into findings and requirements, and
reviewed by a product manager with a complete audit trail.

* Plans and decisions: `plan/`
* Step reports: `reports/` (baseline, findings and validation samples in sub-folders)
* Raw inputs (read-only): `docs/`
* Backend: `backend/` (see `backend/README.md` for the commands)

## Quick start (one command)

Requirements: Docker Desktop (or Docker Engine) and an internet connection. `uv` is installed
automatically if missing.

```bash
./start.sh            # macOS / Linux / WSL
.\start.ps1           # Windows PowerShell
```

The script starts PostgreSQL 16 in Docker (persistent volume `tracepoint-pgdata`), creates `.env`
from `.env.example`, installs the backend, creates the schema, ingests the eight files under
`docs/`, extracts findings for four vehicle × market scopes, writes fresh reports under `data/reports/` (the committed samples under `reports/` stay
unchanged) and runs the test suite. It is safe to re-run.

| Option | Effect |
|---|---|
| `--reset` / `-Reset` | drop the database volume and rebuild everything |
| `--no-docker` | use a PostgreSQL already running on `localhost:$TRACEPOINT_PG_PORT` (role `tracepoint`, databases `tracepoint` and `tracepoint_test`) |
| `--with-llm` / `-WithLlm` | run a 50-verbatim classifier validation per vehicle (needs the OpenAI key in `.env`) |
| `--llm-full` | full validation, gap classification and segmentation (costs tokens) |
| `--skip-tests` / `-SkipTests` | skip pytest |
| `--api` / `-Api` | start the read API on http://localhost:8000/docs afterwards |

Set `TRACEPOINT_PG_PORT=5433` before starting if port 5432 is taken on your machine.

## After the start

```bash
cd backend
uv run tracepoint status                                   # table counts
uv run uvicorn tracepoint.api.app:app --reload             # http://localhost:8000/docs
uv run tracepoint classify validate --vehicle G60 --limit 50
scripts/db-dump.sh                                         # backup to backups/
scripts/db-restore.sh backups/<file>.dump                  # restore
```

LLM steps need `TRACEPOINT_OPENAI_API_KEY`, `TRACEPOINT_OPENAI_MODEL` and
`TRACEPOINT_OPENAI_MODEL_BULK` in `.env` (see `.env.example`).

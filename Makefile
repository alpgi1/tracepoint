.PHONY: start setup db-start db-create db-init db-reset ingest test lint format api audit-export status

BACKEND=backend
UV=cd $(BACKEND) && uv

start:            ## one-shot local start (Docker PostgreSQL, ingestion, findings, reports, tests)
	./start.sh

status:           ## table counts and last runs
	$(UV) run tracepoint status

setup:            ## install the backend with its dev dependencies
	$(UV) sync --all-groups

db-start:         ## start the local PostgreSQL 16 cluster (development container)
	pg_ctlcluster 16 main start || true

db-create:        ## create the application role and databases (idempotent, needs postgres superuser)
	su postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='tracepoint'\"" | grep -q 1 || \
	  su postgres -c "psql -c \"CREATE ROLE tracepoint LOGIN PASSWORD 'tracepoint' CREATEDB\""
	for db in tracepoint tracepoint_test; do \
	  su postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='$$db'\"" | grep -q 1 || \
	  su postgres -c "createdb -O tracepoint $$db"; done

db-init:          ## create the schema in the application database
	$(UV) run tracepoint db init

db-reset:         ## drop and recreate the schema
	$(UV) run tracepoint db reset --yes

ingest:           ## ingest all internal files from docs/
	$(UV) run tracepoint ingest all

test:             ## run the test suite (uses the test database)
	$(UV) run pytest -q

lint:             ## lint and check formatting
	$(UV) run ruff check . && $(UV) run ruff format --check .

format:           ## format the code
	$(UV) run ruff format .

api:              ## run the API locally
	$(UV) run uvicorn tracepoint.api.app:app --reload --port 8000

audit-export:     ## export the audit log as JSON to data/exports/
	$(UV) run tracepoint audit export --format json --out ../data/exports/audit_events.json

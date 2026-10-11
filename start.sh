#!/usr/bin/env bash
# Tracepoint one-shot start: infrastructure, dependencies, schema, ingestion, findings, reports,
# tests. Safe to re-run; every step is idempotent.
#
#   ./start.sh                 first start (Docker PostgreSQL, ingest docs/, findings, reports, tests)
#   ./start.sh --reset         drop and rebuild the database from scratch
#   ./start.sh --no-docker     use a PostgreSQL that already runs on localhost:$TRACEPOINT_PG_PORT
#   ./start.sh --with-llm      additionally run a 50-verbatim classifier validation per vehicle (needs API key)
#   ./start.sh --llm-full      full validation, gap classification and segmentation (needs API key, costs tokens)
#   ./start.sh --skip-tests    do not run the test suite
#   ./start.sh --api           start the read API on http://localhost:8000/docs at the end
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
ROOT="$(pwd)"

RESET=0; NO_DOCKER=0; WITH_LLM=0; LLM_FULL=0; SKIP_TESTS=0; START_API=0
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=1 ;;
    --no-docker) NO_DOCKER=1 ;;
    --with-llm) WITH_LLM=1 ;;
    --llm-full) LLM_FULL=1; WITH_LLM=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
    --api) START_API=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg"; exit 2 ;;
  esac
done

PG_PORT="${TRACEPOINT_PG_PORT:-5432}"
export TRACEPOINT_PG_PORT="$PG_PORT"
log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ok: %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m    error: %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------------------------
log "1/8 Prerequisites"
if ! command -v uv >/dev/null 2>&1; then
  echo "    installing uv (Python package manager) ..."
  curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null
  export PATH="$HOME/.local/bin:$PATH"
fi
command -v uv >/dev/null 2>&1 || fail "uv is not on PATH; open a new shell or add ~/.local/bin to PATH"
ok "uv $(uv --version | awk '{print $2}')"
if [ "$NO_DOCKER" -eq 0 ]; then
  command -v docker >/dev/null 2>&1 || fail "Docker is not installed (install Docker Desktop) or use --no-docker with your own PostgreSQL"
  docker info >/dev/null 2>&1 || fail "Docker daemon is not running; start Docker Desktop or use --no-docker"
  docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
  ok "docker $(docker --version | sed 's/Docker version //; s/,.*//') with compose"
fi

# ---------------------------------------------------------------------------------------------
log "2/8 PostgreSQL"
if [ "$NO_DOCKER" -eq 0 ]; then
  if [ "$RESET" -eq 1 ]; then
    echo "    removing the existing database volume (--reset) ..."
    docker compose down -v >/dev/null 2>&1 || true
  fi
  docker compose up -d >/dev/null
  echo -n "    waiting for the database "
  for _ in $(seq 1 40); do
    if docker compose exec -T postgres pg_isready -U tracepoint -d tracepoint >/dev/null 2>&1; then break; fi
    echo -n "."; sleep 2
  done
  echo
  docker compose exec -T postgres pg_isready -U tracepoint -d tracepoint >/dev/null 2>&1 || fail "PostgreSQL did not become ready (docker compose logs postgres)"
  # the test database is created by the init script on a fresh volume; make sure it exists on old volumes too
  if ! docker compose exec -T postgres psql -U tracepoint -d tracepoint -tAc "SELECT 1 FROM pg_database WHERE datname='tracepoint_test'" | grep -q 1; then
    docker compose exec -T postgres psql -U tracepoint -d tracepoint -c "CREATE DATABASE tracepoint_test OWNER tracepoint" >/dev/null
  fi
  ok "PostgreSQL 16 running in container tracepoint-postgres on port $PG_PORT (volume tracepoint-pgdata)"
else
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h localhost -p "$PG_PORT" >/dev/null 2>&1 || fail "no PostgreSQL on localhost:$PG_PORT"
  fi
  ok "using the existing PostgreSQL on localhost:$PG_PORT (databases tracepoint and tracepoint_test must exist, role tracepoint/tracepoint)"
fi

# ---------------------------------------------------------------------------------------------
log "3/8 Configuration (.env)"
if [ ! -f .env ]; then
  cp .env.example .env
  ok "created .env from .env.example (add TRACEPOINT_OPENAI_API_KEY and model names for the LLM steps)"
else
  ok ".env exists"
fi
DB_URL="postgresql+psycopg://tracepoint:tracepoint@localhost:${PG_PORT}/tracepoint"
TEST_URL="postgresql+psycopg://tracepoint:tracepoint@localhost:${PG_PORT}/tracepoint_test"
if grep -q '^TRACEPOINT_DATABASE_URL=' .env; then
  sed -i.bak "s#^TRACEPOINT_DATABASE_URL=.*#TRACEPOINT_DATABASE_URL=${DB_URL}#; s#^TRACEPOINT_TEST_DATABASE_URL=.*#TRACEPOINT_TEST_DATABASE_URL=${TEST_URL}#" .env && rm -f .env.bak
else
  printf 'TRACEPOINT_DATABASE_URL=%s\nTRACEPOINT_TEST_DATABASE_URL=%s\n' "$DB_URL" "$TEST_URL" >> .env
fi
export TRACEPOINT_DATABASE_URL="$DB_URL" TRACEPOINT_TEST_DATABASE_URL="$TEST_URL"

# ---------------------------------------------------------------------------------------------
log "4/8 Backend dependencies"
(cd backend && uv sync --all-groups --quiet)
ok "backend/.venv ready"
tp() { (cd backend && uv run --quiet tracepoint "$@"); }

# ---------------------------------------------------------------------------------------------
log "5/8 Schema, taxonomy and ingestion of docs/"
if [ "$RESET" -eq 1 ]; then tp db reset --yes; else tp db init; fi
tp taxonomy extract
tp ingest all | sed 's/, "page_kinds.*//'
ok "internal files ingested"

# ---------------------------------------------------------------------------------------------
log "6/8 Findings and reports"
for scope in "G60 US" "F70 EU" "G70 US" "G60 EU" "F70 RoW" "G60 RoW" "G70 RoW" "G70 EU" "G68 CN" "G70 CN"; do
  set -- $scope
  tp findings extract --vehicle "$1" --market "$2" | sed 's/, "findings".*//'
done
tp requirements import | sed 's/, "excluded".*//'
OUT="$ROOT/data/reports"; mkdir -p "$OUT/baseline" "$OUT/findings"
for scope in "F70 EU" "G60 US" "G60 EU" "G70 US"; do
  set -- $scope
  tp report baseline --vehicle "$1" --market "$2" --out-dir "$OUT/baseline" >/dev/null
done
for scope in "G60 US" "F70 EU"; do
  set -- $scope
  tp findings report --vehicle "$1" --market "$2" --out-dir "$OUT/findings" >/dev/null
done
ok "reports written to data/reports/baseline and data/reports/findings (committed samples stay under reports/)"
tp agent packs
tp requirements export
ok "agent context packs written to data/context_packs (tools: cd backend && uv run tracepoint agent tools)"

# ---------------------------------------------------------------------------------------------
log "7/8 Tests"
if [ "$SKIP_TESTS" -eq 1 ]; then
  ok "skipped (--skip-tests)"
else
  (cd backend && uv run --quiet pytest -q)
fi

# ---------------------------------------------------------------------------------------------
log "8/8 LLM steps"
if [ "$WITH_LLM" -eq 1 ]; then
  KEY="$(grep '^TRACEPOINT_OPENAI_API_KEY=' .env | cut -d= -f2-)"
  [ -n "$KEY" ] || fail "TRACEPOINT_OPENAI_API_KEY is empty in .env"
  for v in F70 G60 G70; do
    [ -f "config/validation/blind_sample_${v}.yaml" ] || tp classify prepare-sample --vehicle "$v" >/dev/null
    if [ "$LLM_FULL" -eq 1 ]; then
      tp classify validate --vehicle "$v"
      tp classify gaps --vehicle "$v"
      tp classify segments --vehicle "$v"
    else
      tp classify validate --vehicle "$v" --limit 50
    fi
  done
  ok "LLM steps finished (see reports/validation)"
else
  ok "skipped (use --with-llm or --llm-full)"
fi

log "Status"
tp status
echo
echo "Next: cd backend && uv run uvicorn tracepoint.api.app:app --reload   # http://localhost:8000/docs"
echo "      ./start.sh --help for options; scripts/db-dump.sh to back up the database"
if [ "$START_API" -eq 1 ]; then
  log "Starting the API on http://localhost:8000/docs (Ctrl+C to stop)"
  (cd backend && uv run uvicorn tracepoint.api.app:app --port 8000)
fi

#!/usr/bin/env bash
# Restore a dump produced by scripts/db-dump.sh into the Tracepoint database (replaces its content).
#   scripts/db-restore.sh backups/tracepoint-YYYYMMDD-HHMMSS.dump [--local]
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
DUMP="${1:?usage: scripts/db-restore.sh <dump file> [--local]}"
[ -f "$DUMP" ] || { echo "no such file: $DUMP" >&2; exit 1; }
if [ "${2:-}" = "--local" ]; then
  PGPASSWORD="${PGPASSWORD:-tracepoint}" pg_restore -h "${PGHOST:-localhost}" -p "${PGPORT:-${TRACEPOINT_PG_PORT:-5432}}" -U tracepoint -d tracepoint --clean --if-exists --no-owner "$DUMP"
else
  docker compose exec -T postgres pg_restore -U tracepoint -d tracepoint --clean --if-exists --no-owner < "$DUMP"
fi
echo "restored $DUMP"

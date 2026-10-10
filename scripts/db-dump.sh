#!/usr/bin/env bash
# Dump the Tracepoint database (schema + data, custom format) to backups/.
#   scripts/db-dump.sh              uses the docker compose container
#   scripts/db-dump.sh --local      uses pg_dump on this machine (PG* env or defaults)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
mkdir -p backups
OUT="backups/tracepoint-$(date +%Y%m%d-%H%M%S).dump"
if [ "${1:-}" = "--local" ]; then
  PGPASSWORD="${PGPASSWORD:-tracepoint}" pg_dump -h "${PGHOST:-localhost}" -p "${PGPORT:-${TRACEPOINT_PG_PORT:-5432}}" -U tracepoint -d tracepoint -Fc -f "$OUT"
else
  docker compose exec -T postgres pg_dump -U tracepoint -d tracepoint -Fc > "$OUT"
fi
echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"

#!/bin/sh
# Empire Shop — Postgres backup script (Phase 4 production readiness).
#
# Dumps the configured database to /backups as a gzipped custom-format
# archive with a timestamped filename, then prunes files older than
# $BACKUP_RETENTION_DAYS (default 14). Designed for cron and the
# docker-compose backup sidecar. Requires pg_dump on PATH.
set -eu

: "${PGHOST:?PGHOST is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGDATABASE:?PGDATABASE is required}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/empire_shop_${STAMP}.dump.gz"

mkdir -p "$BACKUP_DIR"
echo "[backup] $(date -u +%FT%TZ) dumping $PGDATABASE -> $OUT"
pg_dump --format=custom --no-owner --no-privileges "$PGDATABASE" | gzip -9 > "$OUT"

# Verify the archive is non-empty.
if [ ! -s "$OUT" ]; then
  echo "[backup] ERROR: dump produced an empty file"; rm -f "$OUT"; exit 1
fi

# Prune old dumps.
find "$BACKUP_DIR" -type f -name 'empire_shop_*.dump.gz' -mtime "+${RETENTION_DAYS}" -print -delete || true

echo "[backup] done ($(du -h "$OUT" | awk '{print $1}'))"

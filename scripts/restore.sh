#!/bin/sh
# Restore a pg_dump archive produced by scripts/backup.sh.
# Usage: scripts/restore.sh /backups/empire_shop_YYYYMMDDTHHMMSSZ.dump.gz
set -eu

FILE="${1:-}"
[ -n "$FILE" ] || { echo "usage: $0 <dump.gz>"; exit 2; }
[ -f "$FILE" ] || { echo "file not found: $FILE"; exit 2; }

: "${PGHOST:?PGHOST is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGDATABASE:?PGDATABASE is required}"

echo "[restore] restoring $FILE -> $PGDATABASE on $PGHOST"
gunzip -c "$FILE" | pg_restore --clean --if-exists --no-owner --no-privileges -d "$PGDATABASE"
echo "[restore] done"

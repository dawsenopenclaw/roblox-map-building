#!/usr/bin/env bash
# PostgreSQL backup script — daily pg_dump to S3
# Required env vars: DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, BACKUP_S3_BUCKET
# Schedule: Run via Fly.io machine cron or external scheduler (e.g. cron.io)
# Retention: 30 days (managed by S3 lifecycle rule)

set -euo pipefail

# ─── Config ────────────────────────────────────────────────────────────────────
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"
: "${AWS_REGION:=us-east-1}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
BACKUP_FILE="/tmp/robloxforge-backup-${TIMESTAMP}.sql.gz"
S3_KEY="backups/${TIMESTAMP}.sql.gz"

# ─── Dump + compress ──────────────────────────────────────────────────────────
echo "[backup] Starting PostgreSQL dump at ${TIMESTAMP}"
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"
echo "[backup] Dump complete: $(du -sh "${BACKUP_FILE}" | cut -f1)"

# ─── Upload to S3 ─────────────────────────────────────────────────────────────
echo "[backup] Uploading to s3://${BACKUP_S3_BUCKET}/${S3_KEY}"
aws s3 cp "${BACKUP_FILE}" "s3://${BACKUP_S3_BUCKET}/${S3_KEY}" \
  --region "${AWS_REGION}" \
  --sse aws:kms \
  --storage-class STANDARD_IA

# ─── Cleanup ──────────────────────────────────────────────────────────────────
rm -f "${BACKUP_FILE}"
echo "[backup] Done. Backup stored at s3://${BACKUP_S3_BUCKET}/${S3_KEY}"

# ─── Optional: prune local old backups (S3 lifecycle handles remote) ──────────
echo "[backup] S3 lifecycle rule should handle 30-day retention automatically."

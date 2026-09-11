#!/bin/sh
set -e

mkdir -p /app/data
export DATABASE_URL="${DATABASE_URL:-file:/app/data/delta.db}"

echo "[delta] prisma db push"
npx prisma db push --skip-generate

echo "[delta] seed (idempotent upsert)"
npx tsx prisma/seed.ts

echo "[delta] starting next.js on ${PORT:-3000}"
exec npm start

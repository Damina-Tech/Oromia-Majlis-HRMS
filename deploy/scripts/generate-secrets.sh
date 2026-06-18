#!/usr/bin/env bash
# Generate strong secrets for first-time VPS setup
set -euo pipefail

gen() { openssl rand -base64 48 | tr -d '/+=' | head -c 48; }

echo "POSTGRES_PASSWORD=$(gen)"
echo "REDIS_PASSWORD=$(gen)"
echo "JWT_ACCESS_SECRET=$(gen)"
echo "JWT_REFRESH_SECRET=$(gen)"

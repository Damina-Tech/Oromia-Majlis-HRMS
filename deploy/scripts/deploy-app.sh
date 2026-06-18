#!/usr/bin/env bash
# Deploy / update HRMS on the VPS (run from /var/www/hrms after clone)
# Usage: bash deploy/scripts/deploy-app.sh [git-branch]
set -euo pipefail

APP_DIR="/var/www/hrms"
BRANCH="${1:-main}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/Damina-Tech/Oromia-Majlis-HRMS.git}"

cd "$APP_DIR"

echo "==> Pulling latest code (${BRANCH})..."
if [ -d .git ]; then
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$GITHUB_REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Starting PostgreSQL + Redis..."
if [ ! -f deploy/env/postgres.env ]; then
  echo "ERROR: Create deploy/env/postgres.env from deploy/env/postgres.env.example"
  exit 1
fi
docker compose --env-file deploy/env/postgres.env -f deploy/docker-compose.yml up -d

echo "==> Waiting for database..."
for i in $(seq 1 30); do
  if docker exec hrms-postgres pg_isready -U hrms >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Backend: install, migrate, build..."
cd "$APP_DIR/backend"
if [ ! -f .env ]; then
  echo "ERROR: Create backend/.env from deploy/env/backend.env.example"
  exit 1
fi
chmod 600 .env
npm ci
# Linux VPS: lockfile from Windows may omit @napi-rs/canvas native binding
CANVAS_VER="$(node -e "console.log(require('@napi-rs/canvas/package.json').version)" 2>/dev/null || echo "0.1.82")"
npm install "@napi-rs/canvas-linux-x64-gnu@${CANVAS_VER}" --no-save
npx prisma generate
npx prisma migrate deploy
npm run build

mkdir -p uploads/tasks uploads/expenses uploads/documents uploads/halal uploads/document-template-sources uploads/document-certificate-assets
chmod -R 750 uploads

echo "==> Frontend: build..."
cd "$APP_DIR/frontend"
if [ ! -f .env.production ]; then
  echo "WARN: frontend/.env.production missing — copying example"
  cp "$APP_DIR/deploy/env/frontend.env.example" .env.production
fi
npm ci
npm run build

echo "==> Restart API with PM2..."
cd "$APP_DIR"
pm2 startOrReload deploy/pm2/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "==> Reload Nginx..."
nginx -t
systemctl reload nginx

echo "==> Deployment finished."
echo "Health: curl -s http://127.0.0.1:4000/health"
echo "Site:   open your public URL in a browser"

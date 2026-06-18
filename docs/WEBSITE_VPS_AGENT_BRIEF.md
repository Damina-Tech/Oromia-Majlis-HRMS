# Agent Brief: Oromia Majlis Public Website — Repo Prep & VPS Deployment

**Purpose:** Give this document to the AI agent working on the **website monorepo** (Next.js + Strapi). The agent must prepare the repository for production deployment on the **same VPS** that already hosts the live HRMS, **without disrupting** `system.oriasc.org`.

**Copy this file into the website project root as `AGENT_DEPLOY_BRIEF.md` or paste into the agent chat.**

---

## 1. Context — what already exists on the VPS

| Item | Value |
|------|--------|
| VPS IP | `91.98.149.16` |
| OS | Ubuntu 22.04 |
| HRMS path | `/var/www/hrms` |
| HRMS domain | `https://system.oriasc.org` |
| HRMS API | Node/Express on `127.0.0.1:4000` (PM2: `hrms-api`) |
| HRMS DB/Redis | Docker: `hrms-postgres` (:5432), `hrms-redis` (:6379) |
| Reverse proxy | Nginx + Let's Encrypt (Certbot) |
| Process manager | PM2 |
| HRMS deploy script | `/var/www/hrms/deploy/scripts/deploy-app.sh dev` |

**Rule:** Do not modify HRMS code, env files, ports, or Nginx config for `system.oriasc.org` unless explicitly requested.

---

## 2. Target architecture for the website stack

```text
Internet
   │
   ▼
Nginx (:443)
   │
   ├─ system.oriasc.org      → HRMS (EXISTING — do not change)
   ├─ oriasc.org / www       → Next.js public website (:3000)
   └─ cms.oriasc.org         → Strapi CMS + admin (:1337)
```

| Service | Repo path | VPS path | Port | PM2 name |
|---------|-----------|----------|------|----------|
| Next.js frontend | `frontend/` | `/var/www/website/frontend` | 3000 | `oriasc-web` |
| Strapi backend | `backend/` | `/var/www/website/backend` | 1337 | `oriasc-strapi` |
| Strapi PostgreSQL | — | Docker `strapi-postgres` | 5433 (host) | — |
| Deploy configs | `deploy/` | `/var/www/website/deploy` | — | — |

**VPS layout (sibling to HRMS):**

```text
/var/www/
├── hrms/                    # existing HRMS — do not change
└── website/                 # this repo clone root
    ├── frontend/            # Next.js
    ├── backend/             # Strapi
    └── deploy/              # nginx, pm2, docker, scripts
```

---

## 3. Required repository structure

Reorganize the monorepo so **repo root = `/var/www/website`** with three top-level folders:

```text
<repo-root>/                 # clone to /var/www/website
├── frontend/                 # Next.js (App Router)
│   ├── package.json
│   ├── next.config.ts
│   ├── .env.example
│   └── .env.production       # gitignored
├── backend/                  # Strapi v4 or v5
│   ├── package.json
│   ├── config/
│   ├── .env.example
│   └── .env                  # gitignored
├── deploy/
│   ├── docker-compose.yml    # Strapi Postgres only (port 5433)
│   ├── env/
│   │   ├── postgres.env.example
│   │   ├── strapi.env.example
│   │   └── frontend.env.example
│   ├── nginx/
│   │   ├── oriasc.org.conf       # Next.js
│   │   └── cms.oriasc.org.conf   # Strapi
│   ├── pm2/
│   │   └── ecosystem.config.cjs
│   └── scripts/
│       ├── vps-bootstrap-website.sh   # optional one-time extras
│       ├── deploy-backend.sh
│       ├── deploy-frontend.sh
│       ├── deploy-all.sh
│       └── generate-secrets.sh
├── .gitignore                # .env, node_modules, .next, build, uploads
├── DEPLOYMENT.md
└── README.md
```

**Agent tasks:**
1. Move Next.js app → `frontend/` at repo root (use `git mv` to preserve history).
2. Move Strapi app → `backend/` at repo root.
3. Place all deployment assets in `deploy/` at repo root (same level as `frontend/` and `backend/`).
4. Fix all relative paths, CI, and import paths after the move.
5. Add root `.gitignore` entries for secrets and build artifacts.

---

## 4. Environment variables

### 4.1 `deploy/env/postgres.env` (Docker — gitignored)

```env
POSTGRES_USER=strapi
POSTGRES_PASSWORD=<strong-random>
POSTGRES_DB=strapi_cms
```

Host port **5433** (not 5432 — HRMS uses 5432).

### 4.2 `backend/.env` (Strapi — gitignored)

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
URL=https://cms.oriasc.org

APP_KEYS=<comma-separated-keys>
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
TRANSFER_TOKEN_SALT=<random>
JWT_SECRET=<random>

DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5433
DATABASE_NAME=strapi_cms
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=<same-as-postgres.env>
DATABASE_SSL=false
```

Generate secrets: `openssl rand -base64 32` (repeat for each field).

### 4.3 `frontend/.env.production` (Next.js — gitignored)

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://oriasc.org
STRAPI_URL=https://cms.oriasc.org
STRAPI_API_TOKEN=<read-only-strapi-token>
```

- Prefer fetching Strapi **server-side** (RSC, `fetch` in Server Components, or Route Handlers).
- Do not expose write tokens in `NEXT_PUBLIC_*` variables.

---

## 5. Docker Compose (Strapi database only)

`deploy/docker-compose.yml`:

- Service: `strapi-postgres` (postgres:16-alpine)
- Bind: `127.0.0.1:5433:5432`
- Volume: `strapi_pg_data`
- **Do not** use ports 5432 or 6379 (reserved by HRMS).

Start (from repo root `/var/www/website`):

```bash
docker compose --env-file deploy/env/postgres.env -f deploy/docker-compose.yml up -d
```

---

## 6. PM2 (`deploy/pm2/ecosystem.config.cjs`)

Two independent apps:

```js
module.exports = {
  apps: [
    {
      name: "oriasc-strapi",
      cwd: "/var/www/website/backend",
      script: "npm",
      args: "run start",
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: { NODE_ENV: "production" },
      error_file: "/var/log/website/strapi-error.log",
      out_file: "/var/log/website/strapi-out.log",
    },
    {
      name: "oriasc-web",
      cwd: "/var/www/website/frontend",
      script: "npm",
      args: "run start",
      instances: 1,
      autorestart: true,
      max_memory_restart: "750M",
      env: { NODE_ENV: "production", PORT: 3000 },
      error_file: "/var/log/website/web-error.log",
      out_file: "/var/log/website/web-out.log",
    },
  ],
};
```

Create log dir on VPS: `mkdir -p /var/log/website`

---

## 7. Nginx

### 7.1 `deploy/nginx/oriasc.org.conf`

- `server_name oriasc.org www.oriasc.org`
- SSL via Certbot (certificate paths under `/etc/letsencrypt/live/oriasc.org/`)
- `location /` → `proxy_pass http://127.0.0.1:3000`
- Headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`
- `client_max_body_size` as needed (e.g. 25m)

### 7.2 `deploy/nginx/cms.oriasc.org.conf`

- `server_name cms.oriasc.org`
- `location /` → `proxy_pass http://127.0.0.1:1337`
- `client_max_body_size 50m` (Strapi media uploads)

Install (run from `/var/www/website`):

```bash
cp deploy/nginx/oriasc.org.conf /etc/nginx/sites-available/oriasc.org
cp deploy/nginx/cms.oriasc.org.conf /etc/nginx/sites-available/cms.oriasc.org
ln -sf /etc/nginx/sites-available/oriasc.org /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/cms.oriasc.org /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**Certbot order:** Use HTTP-only configs first (like HRMS `hrms-certbot-init.conf` pattern), then:

```bash
certbot --nginx -d oriasc.org -d www.oriasc.org -d cms.oriasc.org
```

### 7.3 DNS (before Certbot)

| Host | Type | Value |
|------|------|-------|
| `oriasc.org` | A | `91.98.149.16` |
| `www.oriasc.org` | A or CNAME | `91.98.149.16` or `oriasc.org` |
| `cms.oriasc.org` | A | `91.98.149.16` |
| `system.oriasc.org` | A | (already set) |

---

## 8. Deploy scripts

All scripts assume **repo root** is `/var/www/website` and paths are `frontend/`, `backend/`, `deploy/`.

### 8.1 `deploy/scripts/deploy-backend.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/var/www/website"
BRANCH="${1:-main}"
cd "$APP_DIR"
git fetch origin && git checkout "$BRANCH" && git pull origin "$BRANCH"
docker compose --env-file deploy/env/postgres.env -f deploy/docker-compose.yml up -d
cd backend
test -f .env || { echo "Missing backend/.env"; exit 1; }
chmod 600 .env
npm ci
npm run build
cd "$APP_DIR"
pm2 startOrReload deploy/pm2/ecosystem.config.cjs --only oriasc-strapi
pm2 save
echo "Strapi: curl -s http://127.0.0.1:1337/_health"
```

### 8.2 `deploy/scripts/deploy-frontend.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/var/www/website"
BRANCH="${1:-main}"
cd "$APP_DIR"
git fetch origin && git checkout "$BRANCH" && git pull origin "$BRANCH"
cd frontend
test -f .env.production || { echo "Missing frontend/.env.production"; exit 1; }
npm ci
npm run build
cd "$APP_DIR"
pm2 startOrReload deploy/pm2/ecosystem.config.cjs --only oriasc-web
pm2 save
nginx -t && systemctl reload nginx
echo "Site: https://oriasc.org"
```

### 8.3 `deploy/scripts/deploy-all.sh`

Calls `deploy-backend.sh` then `deploy-frontend.sh`.

---

## 9. First-time VPS setup (website only)

Run **after** HRMS is already live:

```bash
# 1. Clone website repo (sibling to hrms)
git clone <GITHUB_WEBSITE_REPO_URL> /var/www/website
cd /var/www/website

# 2. Secrets
bash deploy/scripts/generate-secrets.sh
cp deploy/env/postgres.env.example deploy/env/postgres.env
cp deploy/env/strapi.env.example backend/.env
cp deploy/env/frontend.env.example frontend/.env.production
# Edit all three with real values; chmod 600

# 3. Docker Postgres for Strapi
docker compose --env-file deploy/env/postgres.env -f deploy/docker-compose.yml up -d

# 4. Nginx HTTP-first, then Certbot (see section 7)

# 5. First deploy
bash deploy/scripts/deploy-backend.sh main
bash deploy/scripts/deploy-frontend.sh main

# 6. Strapi first-time admin at https://cms.oriasc.org/admin
```

---

## 10. Ongoing publish workflow

**Local:**

```bash
git add . && git commit -m "..." && git push origin main
```

**VPS:**

```bash
cd /var/www/website

# Frontend only
bash deploy/scripts/deploy-frontend.sh main

# Strapi / content model changes
bash deploy/scripts/deploy-backend.sh main

# Both
bash deploy/scripts/deploy-all.sh main
```

---

## 11. Security checklist

- [ ] All `.env` files gitignored; `chmod 600` on VPS
- [ ] Strapi DB on port **5433**, not shared with HRMS
- [ ] Unique JWT/APP_KEYS for Strapi (not copied from HRMS)
- [ ] Strapi CORS: allow only `https://oriasc.org` and `https://www.oriasc.org`
- [ ] Read-only API token in Next.js for public content
- [ ] Consider IP restriction or Cloudflare for `cms.oriasc.org` admin
- [ ] `NODE_ENV=production` for both apps
- [ ] Persistent volume for Strapi `backend/public/uploads`
- [ ] UFW already allows 80/443; do not expose 3000/1337/5433 publicly

---

## 12. Resource constraints

VPS may have **2 GB RAM**. HRMS + Strapi + Next.js is tight.

- Add **2 GB swap** if `free -h` shows < 2 GB available
- Build Strapi on VPS may OOM — build in CI or locally and deploy artifacts if needed
- Monitor: `pm2 monit`, `docker stats`, `free -h`

---

## 13. Strapi ↔ Next.js integration

- Strapi is **headless CMS**; Next.js is the public face
- Content types managed in Strapi admin
- Next.js fetches via REST or GraphQL from `STRAPI_URL`
- Use `next: { revalidate: 60 }` or webhooks for on-publish revalidation (optional phase 2)
- Link to HRMS portal: `https://system.oriasc.org/login` (external link, no shared auth unless SSO added later)

---

## 14. Agent deliverables (definition of done)

The agent must produce:

1. Repo restructured with **`frontend/`**, **`backend/`**, and **`deploy/`** as siblings at repo root
2. VPS clone path: `/var/www/website` (not nested `website/website/...`)
3. Complete `deploy/` folder (compose, nginx, pm2, scripts, env examples)
4. `DEPLOYMENT.md` with step-by-step VPS instructions
5. `.env.example` files in `frontend/` and `backend/` (no secrets committed)
6. `next.config` configured for production domain (`oriasc.org`)
7. Strapi `config/server.ts` / `config/middlewares.ts` with correct `url` and CORS
8. Verified build locally: `npm run build` in both `frontend/` and `backend/`
9. Documented PM2 process names and health-check URLs
10. No changes to `/var/www/hrms` or HRMS deployment files

---

## 15. Reference — HRMS deploy pattern (mirror this)

The HRMS project at `Damina-Tech/Oromia-Majlis-HRMS` uses:

- `deploy/docker-compose.yml` — Postgres + Redis
- `deploy/scripts/deploy-app.sh` — pull, migrate, build, PM2, nginx reload
- `deploy/nginx/hrms-certbot-init.conf` — HTTP before SSL
- `deploy/pm2/ecosystem.config.cjs`
- `DEPLOYMENT.md` — full operator guide

**Mirror the same patterns** for the website repo; keep stacks independent. HRMS uses `backend/` + `frontend/` + `deploy/` under `/var/www/hrms` — website follows the same flat layout under `/var/www/website`.

---

## 16. Domains summary

| URL | App |
|-----|-----|
| https://system.oriasc.org | HRMS (existing) |
| https://oriasc.org | Next.js marketing site |
| https://www.oriasc.org | Next.js (redirect or same) |
| https://cms.oriasc.org | Strapi admin + API |

---

*End of agent brief.*

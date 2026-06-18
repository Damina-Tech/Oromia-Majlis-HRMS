# VPS deployment — Oromia Majlis HRMS

Deploy to **Ubuntu 22.04/24.04** on `91.98.149.16` (or any VPS) by cloning from GitHub.

> **Security:** Never commit `.env` files or passwords. Rotate the VPS root password immediately if it was shared in chat. Use SSH keys and disable password login after setup.

**Repository:** `https://github.com/Damina-Tech/Oromia-Majlis-HRMS.git`

---

## Architecture

```
Internet → Nginx (:443) → static frontend (dist/)
                       → /api/* → Node backend (:4000, PM2)
                       → /uploads/* → backend
            PostgreSQL + Redis (Docker, localhost only)
```

---

## Prerequisites

| Item | Notes |
|------|--------|
| VPS | Ubuntu 22.04+, 2+ GB RAM, 20+ GB disk |
| Domain (recommended) | e.g. `hrms.oromiamajlis.gov.et` → A record → `91.98.149.16` |
| GitHub access | Public repo or deploy key for private repo |
| SMTP / Chapa / SMS keys | Optional; add to `backend/.env` |

---

## Step 1 — Connect to the VPS

From your local machine:

```bash
ssh root@91.98.149.16
```

**First:** add your SSH public key (recommended):

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "YOUR_PUBLIC_SSH_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## Step 2 — Bootstrap the server (one time)

```bash
apt-get update && apt-get install -y git
git clone https://github.com/Damina-Tech/Oromia-Majlis-HRMS.git /var/www/hrms
cd /var/www/hrms
bash deploy/scripts/vps-bootstrap.sh
```

This installs: Node 20, Docker, Nginx, PM2, UFW (ports 22/80/443), fail2ban.

---

## Step 3 — Generate secrets

```bash
cd /var/www/hrms
bash deploy/scripts/generate-secrets.sh
```

Save the output. Use it in the next step.

---

## Step 4 — Configure environment files

### PostgreSQL + Redis

```bash
cp deploy/env/postgres.env.example deploy/env/postgres.env
nano deploy/env/postgres.env   # paste generated POSTGRES_PASSWORD and REDIS_PASSWORD
chmod 600 deploy/env/postgres.env
```

### Backend

```bash
cp deploy/env/backend.env.example backend/.env
nano backend/.env
chmod 600 backend/.env
```

Set at minimum:

- `DATABASE_URL` — use postgres password from `postgres.env`
- `REDIS_URL` — `redis://:REDIS_PASSWORD@127.0.0.1:6379`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — from generate-secrets.sh
- `CORS_ORIGIN`, `APP_BASE_URL`, `FRONTEND_URL` — your public URL (see below)

**If using a domain with HTTPS:**

```env
CORS_ORIGIN=https://hrms.yourdomain.gov.et
APP_BASE_URL=https://hrms.yourdomain.gov.et
FRONTEND_URL=https://hrms.yourdomain.gov.et
TRUST_PROXY=1
NODE_ENV=production
```

**If testing by IP only (temporary):**

```env
CORS_ORIGIN=http://91.98.149.16
APP_BASE_URL=http://91.98.149.16
FRONTEND_URL=http://91.98.149.16
```

### Frontend

```bash
cp deploy/env/frontend.env.example frontend/.env.production
nano frontend/.env.production
```

For same-origin via Nginx (recommended), leave empty:

```env
VITE_API_URL=
```

Or set explicitly: `VITE_API_URL=https://hrms.yourdomain.gov.et`

---

## Step 5 — Configure Nginx

### Option A — Domain + HTTPS (production)

**Do not use `hrms.conf` before certificates exist** — it references SSL files that are not there yet and Nginx will fail.

#### Step 1 — HTTP-only config (first time)

```bash
cd /var/www/hrms
mkdir -p /var/www/certbot

# Remove broken symlink if present
rm -f /etc/nginx/sites-enabled/hrms

# Install HTTP-only site (replace domain in file)
sed 's/hrms.yourdomain.gov.et/system.oriasc.org/g' deploy/nginx/hrms-certbot-init.conf \
  | tee /etc/nginx/sites-available/hrms

ln -sf /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/hrms
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Confirm DNS: `system.oriasc.org` A record → your VPS IP (`dig +short system.oriasc.org`).

#### Step 2 — Obtain certificate

```bash
certbot --nginx -d system.oriasc.org
```

Certbot will add HTTPS to the active site. Then reload:

```bash
nginx -t && systemctl reload nginx
```

#### Step 3 (optional) — Full production config

After certs exist, you may switch to `deploy/nginx/hrms.conf` (with your domain substituted) for extra security headers and HTTP→HTTPS redirect — only if cert paths match:

```bash
sed 's/hrms.yourdomain.gov.et/system.oriasc.org/g' deploy/nginx/hrms.conf \
  | tee /etc/nginx/sites-available/hrms
nginx -t && systemctl reload nginx
```

### Option B — IP only (smoke test)

```bash
cp deploy/nginx/hrms-ip-only.conf /etc/nginx/sites-available/hrms
ln -sf /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/hrms
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## Step 6 — Deploy the application

```bash
cd /var/www/hrms
bash deploy/scripts/deploy-app.sh main
```

Use `dev` if that is your production branch:

```bash
bash deploy/scripts/deploy-app.sh dev
```

### First-time database seed (optional)

```bash
cd /var/www/hrms/backend
npm run prisma:seed
# Or division RBAC only:
npx tsx prisma/seed-divisions-only.ts
```

**Change default admin passwords immediately after seeding.**

---

## Step 7 — Verify

```bash
curl -s http://127.0.0.1:4000/health
curl -sI http://91.98.149.16/health
pm2 status
docker ps
```

Open in browser: `https://hrms.yourdomain.gov.et` or `http://91.98.149.16`

---

## Updating after code changes

```bash
cd /var/www/hrms
bash deploy/scripts/deploy-app.sh main
```

---

## Security checklist

| Task | Status |
|------|--------|
| Strong `postgres.env` + `backend/.env` secrets | Required |
| `chmod 600` on all `.env` files | Required |
| HTTPS via Let's Encrypt | Strongly recommended |
| UFW: only 22, 80, 443 open | Done by bootstrap |
| PostgreSQL/Redis bound to `127.0.0.1` only | Done by docker-compose |
| JWT secrets ≠ default `your-access-secret` | Required |
| Rotate VPS password; use SSH keys | Required |
| Disable SSH password auth after keys work | Recommended |
| Change seeded admin passwords | Required |
| `NODE_ENV=production` | Required |
| Secure HTTP-only cookies (auto in production) | Built-in |
| Rate limiting on `/api` | Built-in |
| fail2ban | Installed by bootstrap |

### Harden SSH (after SSH key works)

```bash
nano /etc/ssh/sshd_config
# PasswordAuthentication no
# PermitRootLogin prohibit-password
systemctl reload ssh
```

### Firewall check

```bash
ufw status
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `502 Bad Gateway` | `pm2 logs hrms-api` — check backend `.env` and DB |
| DB connection refused | `docker ps` — ensure postgres is healthy |
| CORS errors | Match `CORS_ORIGIN` to exact browser URL (scheme + host) |
| Login works locally but not on VPS | Ensure HTTPS + `TRUST_PROXY=1` for cookies |
| Prisma migrate fails | Check `DATABASE_URL`; run `npx prisma migrate deploy` manually |
| Frontend calls localhost API | Rebuild frontend with correct `.env.production` |

```bash
pm2 logs hrms-api --lines 100
docker logs hrms-postgres
journalctl -u nginx -n 50
```

---

## File reference

| Path | Purpose |
|------|---------|
| `deploy/docker-compose.yml` | PostgreSQL + Redis |
| `deploy/nginx/hrms.conf` | Production Nginx + SSL |
| `deploy/nginx/hrms-ip-only.conf` | HTTP-only for IP testing |
| `deploy/pm2/ecosystem.config.cjs` | PM2 process manager |
| `deploy/scripts/vps-bootstrap.sh` | One-time server setup |
| `deploy/scripts/deploy-app.sh` | Clone/pull, build, restart |
| `deploy/scripts/generate-secrets.sh` | Random passwords/secrets |
| `deploy/env/*.example` | Environment templates |

---

## What not to put in Git

- `backend/.env`
- `deploy/env/postgres.env`
- `frontend/.env.production`
- VPS passwords, API keys, JWT secrets

All of these are in `.gitignore`.

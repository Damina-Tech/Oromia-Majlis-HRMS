# Seed test users — Oromia Majlis HRMS

All seed accounts use the **`@oriasc.org`** domain (production: https://system.oriasc.org).

Re-seed on VPS after pulling changes:

```bash
cd /var/www/hrms/backend
npm run prisma:seed
# or division admins only:
npx tsx prisma/seed-divisions-only.ts
```

Users must **log out and log in again** after re-seed if already authenticated.

---

## Super admin

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@oriasc.org` | `Admin12345!` | ADMIN | Full system |

---

## HR / managers / employees

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `hr@oriasc.org` | `HrUser123!` | HR | HR module |
| `manager@oriasc.org` | `Manager123!` | MANAGER | HR department manager |
| `finance.manager@oriasc.org` | `FinanceMgr123!` | MANAGER | Finance department |
| `employee@oriasc.org` | `Employee123!` | EMPLOYEE | IT department |
| `john.doe@oriasc.org` | `Employee123!` | EMPLOYEE | IT department |
| `finance.emp@oriasc.org` | `FinanceEmp123!` | EMPLOYEE | Finance department |

---

## Division admins (scoped RBAC)

Default password for all: **`Division@12345`** (override with env `DIVISION_ADMIN_PASSWORD`).

| Email | Division | Role | Scope |
|-------|----------|------|--------|
| `hr.admin@oriasc.org` | HR | HR_DIVISION_ADMIN | Employees, leave, attendance, sectors |
| `halal.admin@oriasc.org` | Halal | HALAL_DIVISION_ADMIN | Halal certification |
| `membership.admin@oriasc.org` | Membership | MEMBERSHIP_DIVISION_ADMIN | Majlis membership |
| `institution.admin@oriasc.org` | Institution | INSTITUTION_DIVISION_ADMIN | Institutions & assignments |
| `multi.admin@oriasc.org` | HR + Halal | HR + HALAL division admin | Multi-department admin test |

---

## Membership portal

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `member@oriasc.org` | `Member123!` | MEMBER | Member self-service portal |

---

## Suggested test flows

1. **Super admin** — `admin@oriasc.org` → Access Control, user management, all modules.
2. **HR division only** — `hr.admin@oriasc.org` → employees/leave; should **not** see Halal admin areas.
3. **Halal division only** — `halal.admin@oriasc.org` → Halal module only.
4. **Multi-department** — `multi.admin@oriasc.org` → HR + Halal menus.
5. **Employee** — `employee@oriasc.org` → self-service leave, attendance, profile.

---

## Email migration

Re-running seed migrates existing users from legacy domains when the local part matches:

- `@oromiamajlis.org`
- `@oromia.gov.et`
- `@ciro.gov.et`

Example: `admin@ciro.gov.et` → `admin@oriasc.org`.

---

## Security

Change all default passwords on production immediately after first login.

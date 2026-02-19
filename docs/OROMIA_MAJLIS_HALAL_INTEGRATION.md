# Oromia Majlis – Halal Certification Integration Guide

This document describes how to integrate the Halal Certification module with the Oromia Majlis website so businesses can access the HRMS Halal system through a shared link.

---

## 1. Overview

### Workflow

1. Business users visit the Oromia Majlis website
2. They click a "Halal Certification" link that points to the HRMS
3. New users **register** (create account); returning users **log in**
4. After successful auth, users are redirected to the appropriate HRMS dashboard
5. Business owners land on `/halal/dashboard` and can register their business and complete certification

### Key Points

- **Registration**: Users who register via this flow receive the **HALAL_BUSINESS** role and can access only Halal-related features.
- **Login/Registration**: Majlis already has login and registration UIs. Integration uses the HRMS auth APIs.
- **Redirect**: After auth, users are sent to `/halal/dashboard` (business owners) or `/dashboard` (other roles).

---

## 2. API Base URL

Configure the HRMS API base URL for your environment:

| Environment | URL (example) |
|-------------|---------------|
| Development | `http://localhost:4000/api/v1` |
| Production | `https://your-hrms-api.example.com/api/v1` |

---

## 3. Authentication APIs

### 3.1 Register (Business Owner Self-Registration)

**Endpoint:** `POST /auth/register`

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "business@example.com",
  "password": "SecurePass123",
  "firstName": "Ahmed",
  "lastName": "Mohammed"
}
```

**Success Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "business@example.com",
    "firstName": "Ahmed",
    "lastName": "Mohammed",
    "roles": ["HALAL_BUSINESS"],
    "permissions": ["dashboard.view", "profile.read", "profile.write", "halal.business"],
    "employeeId": null,
    "avatarUrl": null
  },
  "redirectTo": "/halal/dashboard"
}
```

**Cookies:** `refreshToken` is set in an HTTP-only cookie.

**Error Responses:**
- `400`: Invalid input or "Email already registered. Please log in instead."
- `500`: Registration failed or Halal not configured (HALAL_BUSINESS role missing).

---

### 3.2 Login

**Endpoint:** `POST /auth/login`

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "business@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "business@example.com",
    "firstName": "Ahmed",
    "lastName": "Mohammed",
    "roles": ["HALAL_BUSINESS"],
    "permissions": ["dashboard.view", "profile.read", "profile.write", "halal.business"],
    "employeeId": null,
    "avatarUrl": null
  }
}
```

**Cookies:** `refreshToken` is set in an HTTP-only cookie.

**Error Responses:**
- `401`: Invalid credentials
- `403`: Account inactive

---

### 3.3 Refresh Token

**Endpoint:** `POST /auth/refresh`

**Authentication:** `refreshToken` cookie (from login/register)

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

## 4. Integration Options

### Option A: Redirect to HRMS Login Page (Recommended)

Majlis does not host the login form. It redirects users to the HRMS login page.

**Steps:**

1. Add a link on Majlis:  
   `https://your-hrms.example.com/login?redirect=/halal/dashboard`
2. User logs in (or registers via HRMS link) on the HRMS site.
3. HRMS redirects to `/halal/dashboard` after successful auth (or to the `redirect` value for non‑business users).

**Pros:** Simple, HRMS controls all auth UI and logic.  
**Cons:** User leaves Majlis briefly.

---

### Option B: Majlis Hosts Login/Register, Then Redirects to HRMS

Majlis implements its own login/register forms and calls HRMS auth APIs.

**Registration flow:**

1. User fills Majlis registration form.
2. Majlis calls `POST /auth/register` with `{ email, password, firstName, lastName }`.
3. On success, Majlis receives `accessToken` and `user`.
4. Redirect to HRMS auth callback with token in fragment:
   ```
   https://your-hrms.example.com/auth/callback#accessToken=<accessToken>
   ```
5. HRMS `/auth/callback` validates the token, stores auth, and redirects to `/halal/dashboard`.

**Login flow:**

1. User fills Majlis login form.
2. Majlis calls `POST /auth/login` with `{ email, password }`.
3. On success, Majlis receives `accessToken`.
4. Redirect as above:
   ```
   https://your-hrms.example.com/auth/callback#accessToken=<accessToken>
   ```

**Optional `redirect` query param:**
```
https://your-hrms.example.com/auth/callback?redirect=/halal/dashboard#accessToken=<accessToken>
```

---

### Option C: Token in Query (Less Secure)

If the fragment cannot be used:

```
https://your-hrms.example.com/auth/callback?token=<accessToken>&redirect=/halal/dashboard
```

Tokens in URLs can appear in logs and referrers. Prefer Option B with fragment.

---

## 5. CORS Configuration

If Majlis and HRMS are on different origins, enable CORS for the HRMS API.

Example (Express):

```javascript
app.use(cors({
  origin: ['https://majlis.oromia.gov.et', 'https://your-hrms.example.com'],
  credentials: true  // Required for cookies (refresh token)
}));
```

And ensure cookies use:

- `SameSite=None` (if cross-site) or `SameSite=Lax` (same-site)
- `Secure=true` in production

---

## 6. Halal Certification Link on Majlis

Add a clear entry point for Halal certification:

```html
<a href="https://your-hrms.example.com/login?redirect=/halal/dashboard">
  Apply for Halal Certification
</a>
```

Or, if Majlis hosts login/register:

```html
<a href="https://majlis.oromia.gov.et/halal-login">
  Apply for Halal Certification
</a>
```

---

## 7. Role-Based Redirects

| Role            | Default Redirect      |
|-----------------|------------------------|
| HALAL_BUSINESS  | `/halal/dashboard`     |
| ADMIN, HR, etc. | `/dashboard`           |

If a `redirect` query param is provided and is a valid internal path (e.g. `/halal/dashboard`), it overrides the default.

---

## 8. Security Checklist

- [ ] Use HTTPS in production.
- [ ] Ensure `accessToken` is not logged or exposed in URLs when possible; prefer fragment over query.
- [ ] Configure CORS to allow only Majlis and HRMS origins.
- [ ] Keep `refreshToken` HttpOnly and Secure.
- [ ] Set appropriate token lifetimes (e.g. 2h access, 14d refresh).
- [ ] Run database seed so HALAL_BUSINESS role exists: `npx prisma db seed`.

---

## 9. Testing

### Manual Test: Registration

```bash
curl -X POST https://your-hrms-api/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@business.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

Expect `201` with `accessToken` and `user` including `HALAL_BUSINESS`.

### Manual Test: Login

```bash
curl -X POST https://your-hrms-api/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@business.com","password":"Test123!"}'
```

Expect `200` with `accessToken` and `user`.

### Manual Test: Auth Callback

1. Log in or register to obtain `accessToken`.
2. Open:  
   `https://your-hrms.example.com/auth/callback#accessToken=<YOUR_ACCESS_TOKEN>`
3. You should be logged in and redirected to `/halal/dashboard`.

---

## 10. Summary of Endpoints

| Endpoint              | Method | Auth | Purpose                        |
|-----------------------|--------|------|--------------------------------|
| `/auth/register`      | POST   | No   | Create Halal business account  |
| `/auth/login`         | POST   | No   | Log in                         |
| `/auth/refresh`       | POST   | Cookie | Refresh access token        |
| `/auth/forgot-password` | POST | No   | Request password reset        |
| `/auth/reset-password`  | POST | No   | Reset password with token      |

Frontend route used for token handoff:

| Route            | Purpose                                     |
|------------------|---------------------------------------------|
| `/auth/callback` | Accept token, store auth, redirect to app   |

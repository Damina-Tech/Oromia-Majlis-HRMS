# Membership Management Module

## Main feature

The **Membership Management** module supports **Majlis online membership**: registration, subscription plans, payments (Chapa or manual/cash), certificate generation, and a **member portal** where linked users can view their profile and certificates. Expiry reminders are sent automatically (30 and 7 days before certificate expiry) to members with linked accounts.

**In short:** Staff register members, collect payment (online or manual), and issue certificates; members with linked accounts sign in to see their profile and download certificates; the system reminds them before expiry.

---

## How to use

### Staff (admin or representative)

1. **Dashboard** — **Membership → Dashboard** (`/majlis/membership`). View analytics: total members, revenue, category distribution, recent activity.
2. **Register a member** — **Membership → Register member** (`/majlis/membership/register`). Complete the 3-step form (basic info → category → plan). Then either:
   - **Pay with Chapa** — member pays online; after success, subscription becomes active and a certificate is generated.
   - **Mark manual / cash payment** — confirm payment (optional receipt), then the system generates the certificate.
3. **View and manage members** — **Membership → Members** (`/majlis/membership/members`). Search and filter by category; click **View** to open member details.
4. **Member details** — On a member’s page you can:
   - **Mark manual payment** for any subscription with status *PENDING_PAYMENT* (opens a modal; optional receipt).
   - **Link to user (portal access)** — select a user and click **Save**. That user can then sign in and use **My Membership** to see this member’s profile and certificates.

### Members (linked users)

- **My Membership** — **Membership → My Membership** (`/my-membership`). Shown only when the logged-in user has the **majlis.member** permission and a member record is linked to their account. They can:
  - View profile and category.
  - See subscriptions and current certificate.
  - **Download** the current certificate.
  - Use the **Renew** link to start renewal (if implemented).

If no member is linked, the page explains that and offers a link to public registration.

### Public (no login)

- **Register** — `/register/membership`. Anyone can register for membership (same fields as staff registration); payment can be completed via Chapa.
- **Verify certificate** — `/verify/membership` or `/verify/membership/:certificateId`. Check that a certificate ID is valid.

---

## Roles and access

| Role / permission              | Access |
|--------------------------------|--------|
| **majlis.membership.admin**    | Full membership admin: dashboard, members list, register, manual payment, link member to user. |
| **majlis.membership.register** | Register members and mark manual payment (no “link to user”). |
| **majlis.membership.view**    | View dashboard and members list only. |
| **majlis.member**              | Access **My Membership** (profile, certificates, renewal). User must have a member record linked via **Link to user** in member details. |

---

## Plans and certificates

- **Plans** (e.g. Monthly, Quarterly, Yearly) are configured in the system; staff or public registration selects a plan.
- After payment is confirmed (Chapa or manual), a **membership certificate** is generated and can be downloaded from member detail or from **My Membership**.
- **Expiry reminders** run on a schedule (e.g. hourly); in-app notifications are sent to linked users when their certificate expires in 30 or 7 days.

For test users and credentials, see [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md).

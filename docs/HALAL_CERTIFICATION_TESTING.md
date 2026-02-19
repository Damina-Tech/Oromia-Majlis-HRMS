# Halal Certification Module – Testing Guide

This document provides detailed testing steps for the Halal Certification module across all user roles.

---

## 1. Prerequisites

- Database seeded with Halal permissions and HALAL_BUSINESS role: `npx prisma db seed`
- Roles and permissions: ADMIN, HR, MANAGER, EMPLOYEE, HALAL_BUSINESS (if Majlis integration is used)
- Backend and frontend servers running

---

## 2. User Roles & Permissions

| Role | Halal Permissions | Access |
|------|------------------|--------|
| **ADMIN** | halal.admin, halal.business, halal.inspector, halal.review, halal.renew | Full access: approve, assign inspections, violations, renewals |
| **HR** | halal.business, halal.review, halal.inspector | Applications, assign inspections, review |
| **HALAL_BUSINESS** | halal.business | Register business, apply, view certificates (Business Owner) |
| **MANAGER** | None (or limited Majlis) | No Halal access by default |
| **EMPLOYEE** | None | No Halal access |
| **HALAL_BUSINESS** | halal.business | Business owners from Majlis – register, apply, certificates |

---

## 3. Testing Steps by Role

### 3.1 Business Owner (halal.business)

**Login as:** User with HALAL_BUSINESS role or HR/ADMIN with halal.business

#### 3.1.1 Dashboard
1. Go to `/halal/dashboard`
2. Verify cards: Businesses, Applications, Pending, Certificates
3. Verify “Register Business” and “New Application” buttons
4. Verify “Certificates” link

#### 3.1.2 Register Business
1. Click “Register Business” or go to `/halal/register`
2. Fill: Name, Category (FOOD/DRINKS/etc.), Contact Name, Email, Phone
3. Optionally: Region, Zone, Woreda, Kebele, Address
4. Submit
5. Verify redirect to dashboard
6. Verify business appears under “My Businesses”

#### 3.1.3 Apply for Certification
1. Go to `/halal/apply`
2. Select business from dropdown
3. Add products (name, description)
4. Add ingredients (name, source, halal status)
5. Add supplier info
6. Add documents (name, URL)
7. Submit application
8. Verify status “DRAFT” on dashboard

#### 3.1.4 Submit Application
1. Open application from “Recent Applications”
2. Edit if needed
3. Click “Submit” (when implemented) or ensure application has SUBMITTED status
4. Verify status changes to SUBMITTED

#### 3.1.5 Certificates
1. Go to `/halal/certificates`
2. Verify list of issued certificates
3. For VALID certificates with PDF: click “Download PDF”
4. Click “View” to open public verification page

#### 3.1.6 Renewal (if halal.renew)
1. Go to `/halal/renew`
2. Select valid certificate
3. Enter new expiry date
4. Submit renewal

---

### 3.2 Inspector (halal.inspector)

**Login as:** User with halal.inspector (e.g. HR in seed)

#### 3.2.1 Assign Inspection (as Admin/Inspector)
1. Go to `/admin/halal/inspections`
2. Select application (SUBMITTED or REVIEW)
3. Select inspector
4. Optionally set scheduled date
5. Submit
6. Verify success toast

#### 3.2.2 Complete Inspection
- Uses API: `PATCH /api/v1/halal/inspections/:id/complete`
- Body: `{ checklistData, evidence, notes, gpsLat, gpsLng }`
- Test via API client (e.g. Postman) or inspector mobile view when implemented

---

### 3.3 Reviewer (halal.review)

**Login as:** HR (has halal.review)

#### 3.3.1 View Applications
1. Go to `/admin/halal/applications`
2. Filter by status (All, SUBMITTED, REVIEW, etc.)
3. Click application to view details

#### 3.3.2 Assign Inspection
1. From application detail or `/admin/halal/inspections`
2. Assign inspector to application

#### 3.3.3 Cannot Approve/Reject
- halal.review does NOT include halal.admin or halal.approve
- Approve/Reject buttons should be hidden for reviewers

---

### 3.4 Admin (halal.admin)

**Login as:** admin@ciro.gov.et (or ADMIN user)

#### 3.4.1 Full Application Flow
1. Go to `/admin/halal/applications`
2. Filter and open application
3. Verify: Business info, Products, Ingredients, Documents, Inspections

#### 3.4.2 Approve Application
1. On application in SUBMITTED/REVIEW/INSPECTION
2. Click “Approve”
3. Add optional notes
4. Confirm
5. Verify certificate is created

#### 3.4.3 Reject Application
1. Click “Reject”
2. Enter rejection reason (required)
3. Confirm
4. Verify status REJECTED

#### 3.4.4 Assign Inspection
1. Go to `/admin/halal/inspections`
2. Assign inspection to application

#### 3.4.5 Violations
1. Go to `/admin/halal/violations`
2. Select certificate (VALID or SUSPENDED)
3. Enter description, severity (MINOR/MAJOR/CRITICAL)
4. Optionally set action (WARNING/SUSPENSION/REVOCATION)
5. Submit

#### 3.4.6 Renewals
1. Go to `/halal/renew`
2. Select certificate, enter new expiry
3. Submit

#### 3.4.7 Certificate Download
1. Go to `/halal/certificates`
2. Click “Download PDF” for valid certificates with PDF

---

### 3.5 Other Stakeholders (No Halal Permission)

**Login as:** EMPLOYEE or MANAGER without halal permissions

#### 3.5.1 Halal Not Visible
1. Verify “Halal Certification” does NOT appear in sidebar
2. Direct navigation to `/halal/dashboard` should redirect or show 403 (based on route guards)

---

## 4. Public Verification (No Login)

#### 4.1 Verify Certificate
1. Open `/verify/halal` or `/verify/halal/HAL-2025-0001`
2. Enter or use certificate ID in URL
3. Verify: valid status, business name, expiry
4. For invalid/expired: verify appropriate message

---

## 5. API Testing Checklist

| Endpoint | Method | Auth | Role | Test |
|----------|--------|------|------|------|
| `/halal/verify/:certificateId` | GET | None | - | Public verification |
| `/halal/businesses` | POST | Yes | halal.business | Register business |
| `/halal/businesses` | GET | Yes | halal.business | List businesses |
| `/halal/applications` | POST | Yes | halal.business | Create application |
| `/halal/applications/:id/submit` | POST | Yes | halal.business | Submit application |
| `/halal/applications/:id/approve` | POST | Yes | halal.admin | Approve/Reject |
| `/halal/inspectors` | GET | Yes | halal.inspector/admin/review | List inspectors |
| `/halal/inspections` | POST | Yes | halal.inspector/admin | Assign inspection |
| `/halal/inspections/:id/complete` | PATCH | Yes | halal.inspector/admin | Complete inspection |
| `/halal/certificates/:id/download` | GET | Yes | halal.* | Download PDF |
| `/halal/renewals` | POST | Yes | halal.admin/renew | Create renewal |
| `/halal/violations` | POST | Yes | halal.admin | Record violation |

---

## 6. Mobile Responsiveness

Test on narrow viewport (e.g. 375px):

1. **Admin Applications** – Card layout on mobile, table on desktop
2. **Inspection Assignment** – Form stacks vertically
3. **Application Detail** – Sections readable, buttons accessible
4. **Renewal/Violation** – Forms usable

---

## 7. Security

- [ ] Unauthenticated users cannot access protected Halal routes
- [ ] Business owners see only their own businesses
- [ ] Inspectors can complete only their assigned inspections
- [ ] Admins can approve; reviewers cannot
- [ ] Certificate verification is public and read-only

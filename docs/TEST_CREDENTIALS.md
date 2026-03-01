# 🧪 HRMS Test User Credentials

This document contains all test user credentials for different roles in the HRMS system.

## 📋 Summary

- **1 Admin User** - Full system access
- **2 Department Managers** - Department management access
- **3 Employee Users** - Basic employee access
- **1 HR User** - HR management access

---

## 🔴 ADMIN ROLE

**Purpose:** Full system administrator with complete access to all features.

| Field | Value |
|-------|-------|
| **Email** | `admin@ciro.gov.et` |
| **Password** | `Admin12345!` |
| **Name** | System Admin |
| **Department** | IT |
| **Employee Code** | EMP-000000 |
| **Designation** | System Administrator |
| **Permissions** | All 38 permissions |
| **Can Access** | All pages, all features, user management, system settings |

**What to Test:**
- ✅ Full access to all sidebar menu items
- ✅ Employee management (create, edit, delete)
- ✅ User management
- ✅ System settings
- ✅ All reports and analytics
- ✅ Can view all departments and manage organization

---

## 🟡 DEPARTMENT MANAGER ROLES

### Manager 1: HR Department Manager

**Purpose:** Test department manager access for HR team.

| Field | Value |
|-------|-------|
| **Email** | `manager@ciro.gov.et` |
| **Password** | `Manager123!` |
| **Name** | Main Manager |
| **Department** | HR |
| **Employee Code** | EMP-000001 |
| **Designation** | Department Manager |
| **Permissions** | 21 manager permissions |
| **Team Members** | Test Employee (EMP-000003), John Doe (EMP-000005) |

**What to Test:**
- ✅ Can view employees in their department
- ✅ Can approve/reject leave requests from team members
- ✅ Can view attendance records for team
- ✅ Can view and approve timesheets
- ✅ Limited access to user management
- ❌ Cannot access system settings
- ❌ Cannot delete employees

### Manager 2: Finance Department Manager

**Purpose:** Test department manager access for Finance team.

| Field | Value |
|-------|-------|
| **Email** | `finance.manager@ciro.gov.et` |
| **Password** | `FinanceMgr123!` |
| **Name** | Finance Manager |
| **Department** | Finance |
| **Employee Code** | EMP-000004 |
| **Designation** | Finance Department Manager |
| **Permissions** | 21 manager permissions |
| **Team Members** | Finance Employee (EMP-000007) |

**What to Test:**
- ✅ Can view employees in Finance department only
- ✅ Can approve/reject leave requests from Finance team
- ✅ Can view payroll for their department
- ✅ Can view attendance for Finance team
- ❌ Cannot see employees from other departments
- ❌ Cannot access system settings

---

## 🟢 EMPLOYEE ROLES

### Employee 1: IT Department

**Purpose:** Standard employee user for testing basic features.

| Field | Value |
|-------|-------|
| **Email** | `employee@ciro.gov.et` |
| **Password** | `Employee123!` |
| **Name** | Test Employee |
| **Department** | IT |
| **Employee Code** | EMP-000003 |
| **Designation** | Software Developer |
| **Manager** | Main Manager (manager@ciro.gov.et) |
| **Permissions** | 11 employee permissions |
| **Salary** | 25,000 |

**What to Test:**
- ✅ Can view own profile and information
- ✅ Can apply for leave
- ✅ Can mark own attendance
- ✅ Can view own timesheet
- ✅ Can view own payroll
- ❌ Cannot view other employees
- ❌ Cannot approve leave requests
- ❌ Cannot access admin features

### Employee 2: IT Department (Senior Developer)

**Purpose:** Another employee for testing team dynamics.

| Field | Value |
|-------|-------|
| **Email** | `john.doe@ciro.gov.et` |
| **Password** | `Employee123!` |
| **Name** | John Doe |
| **Department** | IT |
| **Employee Code** | EMP-000005 |
| **Designation** | Senior Developer |
| **Manager** | Main Manager (manager@ciro.gov.et) |
| **Permissions** | 11 employee permissions |
| **Salary** | 28,000 |

**What to Test:**
- ✅ All employee features work
- ✅ Manager can see this employee in their team
- ✅ Can submit leave requests to manager

### Employee 3: Finance Department

**Purpose:** Employee in Finance department reporting to Finance Manager.

| Field | Value |
|-------|-------|
| **Email** | `finance.emp@ciro.gov.et` |
| **Password** | `FinanceEmp123!` |
| **Name** | Finance Employee |
| **Department** | Finance |
| **Employee Code** | EMP-000007 |
| **Designation** | Accountant |
| **Manager** | Finance Manager (finance.manager@ciro.gov.et) |
| **Permissions** | 11 employee permissions |
| **Salary** | 23,000 |

**What to Test:**
- ✅ All employee features work
- ✅ Finance Manager can see this employee
- ✅ HR Manager cannot see this employee (different department)
- ✅ Department-based access control

---

## 🔵 HR ROLE

**Purpose:** HR specialist with HR management permissions.

| Field | Value |
|-------|-------|
| **Email** | `hr@ciro.gov.et` |
| **Password** | `HrUser123!` |
| **Name** | HR Specialist |
| **Department** | HR |
| **Employee Code** | EMP-000006 |
| **Designation** | HR Specialist |
| **Permissions** | 34 HR permissions |
| **Salary** | 30,000 |

**What to Test:**
- ✅ Can view all employees across departments
- ✅ Can manage employee records
- ✅ Can process leave requests
- ✅ Can view attendance records
- ✅ Can manage departments
- ✅ Can access onboarding features
- ❌ Cannot access system settings
- ❌ Limited user management

---

## 🧪 Testing Checklist

### 1. Login & Authentication
- [ ] Admin can login successfully
- [ ] Manager can login successfully  
- [ ] Employee can login successfully
- [ ] HR user can login successfully
- [ ] Invalid credentials are rejected

### 2. Sidebar & Navigation
- [ ] Admin sees all menu items
- [ ] Manager sees appropriate menu items (no admin-only)
- [ ] Employee sees basic menu items only
- [ ] HR sees HR-specific menu items

### 3. Employee Management
- [ ] Admin can create/edit/delete employees
- [ ] Manager can view employees in their department
- [ ] Manager cannot see employees from other departments
- [ ] Employee cannot view other employees
- [ ] HR can view all employees

### 4. Leave Management
- [ ] Employee can apply for leave
- [ ] Manager can approve/reject leave for their team
- [ ] Employee cannot approve leave
- [ ] HR can view all leave requests

### 5. Attendance
- [ ] Employee can mark own attendance
- [ ] Manager can view attendance for their team
- [ ] Admin can view all attendance
- [ ] Department-based filtering works

### 6. Payroll
- [ ] Admin can view all payroll
- [ ] Manager can view payroll for their department
- [ ] Employee can view own payroll only
- [ ] HR can view all payroll

### 7. Permissions
- [ ] Actions requiring permissions show/hide correctly
- [ ] Users cannot access pages without permissions
- [ ] API endpoints validate permissions correctly

---

## 📝 Quick Reference

| Role | Email | Password | Key Feature |
|------|-------|----------|-------------|
| Admin | `admin@ciro.gov.et` | `Admin12345!` | Full access |
| HR Manager | `manager@ciro.gov.et` | `Manager123!` | Department management |
| Finance Manager | `finance.manager@ciro.gov.et` | `FinanceMgr123!` | Finance team oversight |
| IT Employee | `employee@ciro.gov.et` | `Employee123!` | Basic employee features |
| IT Employee 2 | `john.doe@ciro.gov.et` | `Employee123!` | Team member |
| Finance Employee | `finance.emp@ciro.gov.et` | `FinanceEmp123!` | Finance team member |
| HR User | `hr@ciro.gov.et` | `HrUser123!` | HR management |

---

## 🔐 Notes

- All passwords follow the pattern: `{Role}{Number}123!`
- All users are in ACTIVE status
- All employees have associated employee records
- Department relationships are properly set up
- Manager-employee relationships are configured
- Permissions are seeded and assigned to roles

---

**Generated:** $(Get-Date)
**Database:** PostgreSQL
**Backend:** Node.js/Express
**Frontend:** React/Vite

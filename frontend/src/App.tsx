import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth, getLoginRedirect } from "./contexts/AuthContext";
import {
  isHalalBusinessPortalOnly,
  isHalalCompetencyPortalOnly,
  isMemberPortalOnly,
} from "./lib/division-access";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Layout from "./components/layout/Layout";
import "./i18n/config";

import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import Dashboard from "./pages/dashboard/Dashboard";
import EmployeesPage from "./pages/employees/EmployeesPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import AttendanceRecordsPage from "./pages/attendance/AttendanceRecordsPage";
import LeaveManagement from "./pages/leave/LeaveManagement";
import LeaveBalancesPage from "./pages/leave/LeaveBalancesPage";
import LeaveRequestsPage from "./pages/leave/LeaveRequestsPage";
import PayrollPage from "./pages/payroll/PayrollPage";
import PayrollRunsPage from "./pages/payroll/PayrollRunsPage";
import PayrollRunItemsPage from "./pages/payroll/PayrollRunItemsPage";
import SalaryGradesPage from "./pages/payroll/SalaryGradesPage";
import LoansPage from "./pages/payroll/LoansPage";
import AdvancesPage from "./pages/payroll/AdvancesPage";
import AllowancesPage from "./pages/payroll/AllowancesPage";
import TaxPensionPage from "./pages/payroll/TaxPensionPage";
import EmployeeSalaryPortal from "./pages/payroll/EmployeeSalaryPortal";
import OrganizationPage from "./pages/organization/OrganizationPage";
import TimesheetPage from "./pages/timesheet/TimesheetPage";
import AssetManagementPage from "./pages/assets/AssetManagementPage";
import AssetDashboardPage from "./pages/assets/AssetDashboardPage";
import DocumentTemplatesPage from "./pages/documents/DocumentTemplatesPage";
import DocumentGenerationPage from "./pages/documents/DocumentGenerationPage";
import DocumentSettingsPage from "./pages/documents/DocumentSettingsPage";
import DocumentRequestsPage from "./pages/documents/DocumentRequestsPage";
import AnnouncementsPage from "./pages/announcements/AnnouncementsPage";
import CreateAnnouncementPage from "./pages/announcements/CreateAnnouncementPage";
import AnnouncementDetailPage from "./pages/announcements/AnnouncementDetailPage";
import TasksKanbanPage from "./pages/tasks/TasksKanbanPage";
import TasksListPage from "./pages/tasks/TasksListPage";
import TaskDetailPage from "./pages/tasks/TaskDetailPage";
import TasksDashboardPage from "./pages/tasks/TasksDashboardPage";
import MyExpensesPage from "./pages/expenses/MyExpensesPage";
import ExpenseApprovalQueuePage from "./pages/expenses/ExpenseApprovalQueuePage";
import AllExpensesPage from "./pages/expenses/AllExpensesPage";
import ExpenseDetailPage from "./pages/expenses/ExpenseDetailPage";
import DocumentsPage from "./pages/documents/DocumentsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import ReportBuilder from "./components/reports/ReportBuilder";
import ReportViewer from "./components/reports/ReportViewer";
import OnboardingPage from "./pages/onboarding/OnboardingPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import UsersPage from "./pages/admin/UsersPage";
import AccessControlPage from "./pages/admin/AccessControlPage";
import SettingsPage from "./pages/admin/SettingsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import NotFound from "./pages/common/NotFound";
import LeadsPage from "./pages/leads/LeadsPage";
import LeadDetailPage from "./pages/leads/LeadDetailPage";
import MajlisInstitutionsPage from "./pages/majlis/MajlisInstitutionsPage";
import MajlisDashboardPage from "./pages/majlis/MajlisDashboardPage";
import InstitutionDetailPage from "./pages/majlis/InstitutionDetailPage";
import EditInstitutionPage from "./pages/majlis/EditInstitutionPage";
import MajlisAssignmentsPage from "./pages/majlis/MajlisAssignmentsPage";
import MajlisReportsPage from "./pages/majlis/MajlisReportsPage";
import HalalDashboardPage from "./pages/halal/HalalDashboardPage";
import HalalRegisterPage from "./pages/halal/HalalRegisterPage";
import HalalRegisterFormPage from "./pages/halal/HalalRegisterFormPage";
import HalalBusinessDetailPage from "./pages/halal/HalalBusinessDetailPage";
import HalalApplyPage from "./pages/halal/HalalApplyPage";
import HalalApplyFormPage from "./pages/halal/HalalApplyFormPage";
import HalalCertificatesPage from "./pages/halal/HalalCertificatesPage";
import HalalMyApplicationDetailPage from "./pages/halal/HalalApplicationDetailPage";
import HalalBusinessWorkerCompetencyProgressPage from "./pages/halal/HalalBusinessWorkerCompetencyProgressPage";
import HalalInspectionAssignmentPage from "./pages/halal/HalalInspectionAssignmentPage";
import HalalInspectionCompletePage from "./pages/halal/HalalInspectionCompletePage";
import HalalMyInspectionsPage from "./pages/halal/HalalMyInspectionsPage";
import HalalViolationPage from "./pages/halal/HalalViolationPage";
import HalalProductCertificateNewPage from "./pages/halal/HalalProductCertificateNewPage";
import HalalProductCertificateDetailPage from "./pages/halal/HalalProductCertificateDetailPage";
import HalalCompetencyListPage from "./pages/halal/HalalCompetencyListPage";
import HalalCompetencyNewPage from "./pages/halal/HalalCompetencyNewPage";
import HalalCompetencyDetailPage from "./pages/halal/HalalCompetencyDetailPage";
import HalalReportsPage from "./pages/halal/HalalReportsPage";
import MembershipRegisterPage from "./pages/membership/MembershipRegisterPage";
import MembershipDashboardPage from "./pages/membership/MembershipDashboardPage";
import MembershipMembersPage from "./pages/membership/MembershipMembersPage";
import MemberDetailPage from "./pages/membership/MemberDetailPage";
import MyMembershipPage from "./pages/membership/MyMembershipPage";
import VerifyCertificatePage from "./pages/verify/VerifyCertificatePage";

const queryClient = new QueryClient();

/** Redirect legacy typed verify URLs to the unified /verify/:code page. */
function LegacyVerifyRedirect({ paramKey }: { paramKey: string }) {
  const params = useParams();
  const code = params[paramKey];
  if (!code) return <Navigate to="/verify" replace />;
  return <Navigate to={`/verify/${encodeURIComponent(code)}`} replace />;
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-id="0rn4wtog7"
        data-path="src/App.tsx"
      >
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"
          data-id="uy1pv2s5w"
          data-path="src/App.tsx"
        ></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace data-id="ei2k2ox77" data-path="src/App.tsx" />
  );
}

function PermissionRoute({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  const { user, hasPermission } = useAuth();
  const allowed = permissions.some((p) => hasPermission(p));
  if (!allowed) {
    return <Navigate to={user ? getLoginRedirect(user) : "/dashboard"} replace />;
  }
  return <>{children}</>;
}

// Dashboard: only divert portal-only accounts away from the main HR dashboard
function DashboardOrRedirect() {
  const { user } = useAuth();
  if (!user) return <Dashboard />;
  if (isMemberPortalOnly(user)) {
    return <Navigate to="/my-membership" replace />;
  }
  if (isHalalCompetencyPortalOnly(user)) {
    return <Navigate to="/halal/competency" replace />;
  }
  if (isHalalBusinessPortalOnly(user)) {
    return <Navigate to="/halal/dashboard" replace />;
  }
  return <Dashboard />;
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-id="mq2yu2ezr"
        data-path="src/App.tsx"
      >
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"
          data-id="4bdea3p0u"
          data-path="src/App.tsx"
        ></div>
      </div>
    );
  }

  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate
      to={user ? getLoginRedirect(user) : "/dashboard"}
      replace
      data-id="k95po2qvw"
      data-path="src/App.tsx"
    />
  );
}

function AppRoutes() {
  const halalModulePermissions = [
    "halal.business",
    "halal.competency",
    "halal.review",
    "halal.admin",
    "halal.supervisor",
    "halal.inspector",
    "halal.renew",
    "halal.audit",
    "halal.committee",
    "halal.finance",
  ];

  const halalCompetencyPermissions = [
    "halal.competency",
    "halal.admin",
    "halal.supervisor",
    "halal.committee",
    "halal.review",
    "halal.finance",
    "halal.audit",
  ];

  const halalReportPermissions = [
    "halal.admin",
    "halal.supervisor",
    "halal.finance",
    "halal.audit",
    "halal.committee",
    "halal.review",
  ];

  return (
    <Routes data-id="i983waa44" data-path="src/App.tsx">
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute data-id="yc840oype" data-path="src/App.tsx">
            <LoginPage data-id="9odqvnmuu" data-path="src/App.tsx" />
          </PublicRoute>
        }
        data-id="ib57t12xi"
        data-path="src/App.tsx"
      />

      <Route
        path="/"
        element={
          <PublicRoute data-id="84ngdx3xx" data-path="src/App.tsx">
            <LoginPage data-id="gutnnsp9c" data-path="src/App.tsx" />
          </PublicRoute>
        }
        data-id="fxqgzvjvo"
        data-path="src/App.tsx"
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute data-id="reset-password-route" data-path="src/App.tsx">
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Oromia Majlis auth callback: receives token from fragment/query, stores auth, redirects */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Public: unified certificate verification (+ legacy typed URL redirects) */}
      <Route path="/verify" element={<VerifyCertificatePage />} />
      <Route path="/verify/halal" element={<Navigate to="/verify" replace />} />
      <Route path="/verify/halal/:certificateId" element={<LegacyVerifyRedirect paramKey="certificateId" />} />
      <Route path="/verify/halal-product/:certificateNumber" element={<LegacyVerifyRedirect paramKey="certificateNumber" />} />
      <Route path="/verify/halal-competency/:certificateNumber" element={<LegacyVerifyRedirect paramKey="certificateNumber" />} />
      <Route path="/verify/membership" element={<Navigate to="/verify" replace />} />
      <Route path="/verify/membership/:certificateId" element={<LegacyVerifyRedirect paramKey="certificateId" />} />
      <Route path="/verify/institution-recognition" element={<Navigate to="/verify" replace />} />
      <Route
        path="/verify/institution-recognition/:certificateNumber"
        element={<LegacyVerifyRedirect paramKey="certificateNumber" />}
      />
      <Route path="/verify/:code" element={<VerifyCertificatePage />} />

      {/* Public: Majlis membership registration (redirects to dashboard if already logged in) */}
      <Route
        path="/register/membership"
        element={
          <PublicRoute>
            <MembershipRegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute data-id="qs8378pjz" data-path="src/App.tsx">
            <Layout data-id="u98l29eoe" data-path="src/App.tsx" />
          </ProtectedRoute>
        }
        data-id="40tdjnt43"
        data-path="src/App.tsx"
      >
        <Route path="dashboard" element={<DashboardOrRedirect />} />
        <Route
          path="employees"
          element={
            <EmployeesPage data-id="oexgbak3e" data-path="src/App.tsx" />
          }
          data-id="gfpbgf4gj"
          data-path="src/App.tsx"
        />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:leadId" element={<LeadDetailPage />} />
        <Route path="majlis/dashboard" element={<MajlisDashboardPage />} />
        <Route path="majlis/institutions" element={<MajlisInstitutionsPage />} />
        <Route path="majlis/institutions/:id/edit" element={<EditInstitutionPage />} />
        <Route path="majlis/institutions/:id" element={<InstitutionDetailPage />} />
        <Route path="majlis/assignments" element={<MajlisAssignmentsPage />} />
        <Route path="majlis/reports" element={<MajlisReportsPage />} />
        <Route path="majlis/membership" element={<MembershipDashboardPage />} />
        <Route path="majlis/membership/register" element={<MembershipRegisterPage />} />
        <Route path="majlis/membership/members" element={<MembershipMembersPage />} />
        <Route path="majlis/membership/members/:id" element={<MemberDetailPage />} />
        <Route path="my-membership" element={<MyMembershipPage />} />
        <Route path="halal/dashboard" element={<PermissionRoute permissions={halalModulePermissions}><HalalDashboardPage /></PermissionRoute>} />
        <Route path="halal/reports" element={<PermissionRoute permissions={halalReportPermissions}><HalalReportsPage /></PermissionRoute>} />
        <Route path="halal/register" element={<PermissionRoute permissions={["halal.business", "halal.admin", "halal.supervisor"]}><HalalRegisterPage /></PermissionRoute>} />
        <Route path="halal/register/new" element={<PermissionRoute permissions={["halal.business"]}><HalalRegisterFormPage /></PermissionRoute>} />
        <Route path="halal/register/:id/edit" element={<PermissionRoute permissions={["halal.business", "halal.admin", "halal.supervisor"]}><HalalRegisterFormPage /></PermissionRoute>} />
        <Route path="halal/businesses/:id" element={<PermissionRoute permissions={halalModulePermissions}><HalalBusinessDetailPage /></PermissionRoute>} />
        <Route path="halal/apply" element={<PermissionRoute permissions={["halal.business", "halal.admin", "halal.supervisor", "halal.inspector"]}><HalalApplyPage /></PermissionRoute>} />
        <Route path="halal/apply/new" element={<PermissionRoute permissions={["halal.business"]}><HalalApplyFormPage /></PermissionRoute>} />
        <Route path="halal/certificates" element={<PermissionRoute permissions={halalModulePermissions}><HalalCertificatesPage /></PermissionRoute>} />
        <Route path="halal/product-certificates/new" element={<PermissionRoute permissions={["halal.business"]}><HalalProductCertificateNewPage /></PermissionRoute>} />
        <Route path="halal/product-certificates/:id" element={<PermissionRoute permissions={halalModulePermissions}><HalalProductCertificateDetailPage /></PermissionRoute>} />
        <Route path="halal/competency" element={<PermissionRoute permissions={halalCompetencyPermissions}><HalalCompetencyListPage /></PermissionRoute>} />
        <Route path="halal/competency/new" element={<PermissionRoute permissions={["halal.competency"]}><HalalCompetencyNewPage /></PermissionRoute>} />
        <Route path="halal/competency/:id" element={<PermissionRoute permissions={halalCompetencyPermissions}><HalalCompetencyDetailPage /></PermissionRoute>} />
        <Route path="halal/applications/:id" element={<PermissionRoute permissions={halalModulePermissions}><HalalMyApplicationDetailPage /></PermissionRoute>} />
        <Route path="halal/applications/:id/worker-competency" element={<PermissionRoute permissions={halalModulePermissions}><HalalBusinessWorkerCompetencyProgressPage /></PermissionRoute>} />
        <Route path="admin/halal/applications" element={<PermissionRoute permissions={["halal.admin", "halal.supervisor", "halal.inspector", "halal.committee", "halal.finance"]}><Navigate to="/halal/apply" replace /></PermissionRoute>} />
        <Route path="admin/halal/applications/:id" element={<PermissionRoute permissions={["halal.admin", "halal.supervisor", "halal.inspector", "halal.committee", "halal.finance"]}><HalalMyApplicationDetailPage /></PermissionRoute>} />
        <Route path="admin/halal/applications/:id/worker-competency" element={<PermissionRoute permissions={["halal.admin", "halal.supervisor", "halal.inspector", "halal.committee", "halal.finance"]}><HalalBusinessWorkerCompetencyProgressPage /></PermissionRoute>} />
        <Route path="admin/halal/inspections" element={<PermissionRoute permissions={["halal.admin", "halal.supervisor", "halal.inspector"]}><HalalInspectionAssignmentPage /></PermissionRoute>} />
        <Route path="admin/halal/inspections/:id/complete" element={<PermissionRoute permissions={["halal.admin", "halal.inspector"]}><HalalInspectionCompletePage /></PermissionRoute>} />
        <Route path="admin/halal/my-inspections" element={<PermissionRoute permissions={["halal.admin", "halal.inspector"]}><HalalMyInspectionsPage /></PermissionRoute>} />
        <Route path="admin/halal/violations" element={<PermissionRoute permissions={["halal.admin", "halal.audit", "halal.committee"]}><HalalViolationPage /></PermissionRoute>} />
        <Route
          path="attendance"
          element={
            <AttendancePage data-id="25b8aufj8" data-path="src/App.tsx" />
          }
          data-id="u9467awkg"
          data-path="src/App.tsx"
        />
        <Route
          path="attendance-records"
          element={
            <AttendanceRecordsPage data-id="attendance-records-page" data-path="src/App.tsx" />
          }
          data-id="attendance-records-route"
          data-path="src/App.tsx"
        />
        <Route
          path="organization"
          element={
            <OrganizationPage data-id="8rv66kkd6" data-path="src/App.tsx" />
          }
          data-id="fen8oll56"
          data-path="src/App.tsx"
        />
        <Route
          path="leave"
          element={
            <LeaveManagement data-id="mxpxjn5vk" data-path="src/App.tsx" />
          }
          data-id="wkgyrsdqz"
          data-path="src/App.tsx"
        />
        <Route
          path="leave-balances"
          element={
            <LeaveBalancesPage data-id="leave-balances-page" data-path="src/App.tsx" />
          }
          data-id="leave-balances-route"
          data-path="src/App.tsx"
        />
        <Route
          path="leave-requests"
          element={
            <LeaveRequestsPage data-id="leave-requests-page" data-path="src/App.tsx" />
          }
          data-id="leave-requests-route"
          data-path="src/App.tsx"
        />
        <Route
          path="payroll"
          element={<PayrollPage data-id="gcl3okxuk" data-path="src/App.tsx" />}
          data-id="fxuwv8fkq"
          data-path="src/App.tsx"
        />
        <Route
          path="payroll/runs"
          element={<PayrollRunsPage />}
        />
        <Route
          path="payroll/runs/:runId/items"
          element={<PayrollRunItemsPage />}
        />
        <Route
          path="payroll/salary-grades"
          element={<SalaryGradesPage />}
        />
        <Route
          path="payroll/loans"
          element={<LoansPage />}
        />
        <Route
          path="payroll/advances"
          element={<AdvancesPage />}
        />
        <Route
          path="payroll/allowances"
          element={<AllowancesPage />}
        />
        <Route
          path="payroll/tax-pension"
          element={<TaxPensionPage />}
        />
        <Route
          path="my-salary"
          element={<EmployeeSalaryPortal />}
        />
        <Route
          path="timesheet"
          element={
            <TimesheetPage data-id="g9vxxt490" data-path="src/App.tsx" />
          }
          data-id="nv9eposml"
          data-path="src/App.tsx"
        />
        <Route
          path="assets"
          element={
            <AssetManagementPage data-id="g9v8xt490" data-path="src/App.tsx" />
          }
          data-id="0m10trfeh"
          data-path="src/App.tsx"
        />
        <Route
          path="assets/dashboard"
          element={<AssetDashboardPage />}
        />
          <Route
            path="documents/templates"
            element={<DocumentTemplatesPage />}
          />
          <Route
            path="documents/certificate-templates"
            element={<Navigate to="/documents/templates" replace />}
          />
          <Route
            path="documents/generate"
            element={<DocumentGenerationPage />}
          />
          <Route
            path="documents/settings"
            element={<DocumentSettingsPage />}
          />
          <Route
            path="documents/requests"
            element={<DocumentRequestsPage />}
          />
          <Route
            path="announcements"
            element={<AnnouncementsPage />}
          />
          <Route
            path="announcements/create"
            element={<CreateAnnouncementPage />}
          />
          <Route
            path="announcements/:id"
            element={<AnnouncementDetailPage />}
          />
          <Route
            path="announcements/edit/:id"
            element={<CreateAnnouncementPage />}
          />
          <Route
            path="tasks"
            element={<TasksListPage />}
          />
          <Route
            path="tasks/kanban"
            element={<TasksKanbanPage />}
          />
          <Route
            path="tasks/:id"
            element={<TaskDetailPage />}
          />
          <Route
            path="tasks/dashboard"
            element={<TasksDashboardPage />}
          />
          <Route
            path="expenses"
            element={<MyExpensesPage />}
          />
          <Route
            path="expenses/approval-queue"
            element={<ExpenseApprovalQueuePage />}
          />
          <Route
            path="expenses/all"
            element={<AllExpensesPage />}
          />
          <Route
            path="expenses/:id"
            element={<ExpenseDetailPage />}
          />
        <Route
          path="documents"
          element={
            <DocumentsPage data-id="oib2dwxm7" data-path="src/App.tsx" />
          }
          data-id="dvbtyq3j1"
          data-path="src/App.tsx"
        />
        <Route
          path="reports"
          element={<ReportsPage data-id="x47on150h" data-path="src/App.tsx" />}
          data-id="qrsrojv6u"
          data-path="src/App.tsx"
        />
        <Route
          path="reports/builder"
          element={<ReportBuilder />}
        />
        <Route
          path="reports/view"
          element={<ReportViewer />}
        />
        <Route
          path="onboarding"
          element={
            <OnboardingPage data-id="8znbv4kpt" data-path="src/App.tsx" />
          }
          data-id="e80tgqakd"
          data-path="src/App.tsx"
        />
        <Route
          path="notifications"
          element={
            <NotificationsPage data-id="e8pv2hxkk" data-path="src/App.tsx" />
          }
          data-id="iyhd40h18"
          data-path="src/App.tsx"
        />
        <Route
          path="admin/access-control"
          element={
            <PermissionRoute permissions={["system.admin", "divisions.read", "divisions.manage"]}>
              <AccessControlPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <PermissionRoute permissions={["system.admin", "users.read", "users.write"]}>
              <UsersPage data-id="ynptafeot" data-path="src/App.tsx" />
            </PermissionRoute>
          }
          data-id="hdaqm9k8n"
          data-path="src/App.tsx"
        />
        <Route
          path="admin/settings"
          element={<SettingsPage data-id="k4rvnag8a" data-path="src/App.tsx" />}
          data-id="az0ylb3qd"
          data-path="src/App.tsx"
        />
        <Route
          path="profile"
          element={<ProfilePage data-id="profile-page" data-path="src/App.tsx" />}
          data-id="profile-route"
          data-path="src/App.tsx"
        />
        <Route
          path="settings"
          element={<SettingsPage data-id="settings-page" data-path="src/App.tsx" />}
          data-id="settings-route"
          data-path="src/App.tsx"
        />
      </Route>

      {/* Catch all route */}
      <Route
        path="*"
        element={<NotFound data-id="6u5dynb9d" data-path="src/App.tsx" />}
        data-id="5rf2xij96"
        data-path="src/App.tsx"
      />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider
    client={queryClient}
    data-id="t05dmonz4"
    data-path="src/App.tsx"
  >
    <ThemeProvider>
    <TooltipProvider data-id="mobcb0b0n" data-path="src/App.tsx">
      <AuthProvider data-id="l2tksbrmp" data-path="src/App.tsx">
        <BrowserRouter data-id="lopawu7zf" data-path="src/App.tsx">
          <AppRoutes data-id="uqfa9bkfo" data-path="src/App.tsx" />
        </BrowserRouter>
      </AuthProvider>
      <Toaster data-id="u7pxvax50" data-path="src/App.tsx" />
      <SonnerToaster position="top-right" richColors />
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

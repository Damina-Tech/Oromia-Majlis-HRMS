import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Layout from "./components/layout/Layout";
import "./i18n/config";

import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import AttendancePage from "./pages/AttendancePage";
import AttendanceRecordsPage from "./pages/AttendanceRecordsPage";
import LeaveManagement from "./pages/LeaveManagement";
import LeaveBalancesPage from "./pages/LeaveBalancesPage";
import LeaveRequestsPage from "./pages/LeaveRequestsPage";
import PayrollPage from "./pages/PayrollPage";
import PayrollRunsPage from "./pages/PayrollRunsPage";
import PayrollRunItemsPage from "./pages/PayrollRunItemsPage";
import SalaryGradesPage from "./pages/SalaryGradesPage";
import LoansPage from "./pages/LoansPage";
import AdvancesPage from "./pages/AdvancesPage";
import AllowancesPage from "./pages/AllowancesPage";
import TaxPensionPage from "./pages/TaxPensionPage";
import EmployeeSalaryPortal from "./pages/EmployeeSalaryPortal";
import OrganizationPage from "./pages/OrganizationPage";
import TimesheetPage from "./pages/TimesheetPage";
import AssetManagementPage from "./pages/AssetManagementPage";
import AssetDashboardPage from "./pages/AssetDashboardPage";
import AssetReportsPage from "./pages/AssetReportsPage";
import DocumentTemplatesPage from "./pages/DocumentTemplatesPage";
import DocumentGenerationPage from "./pages/DocumentGenerationPage";
import DocumentSettingsPage from "./pages/DocumentSettingsPage";
import DocumentRequestsPage from "./pages/DocumentRequestsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CreateAnnouncementPage from "./pages/CreateAnnouncementPage";
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage";
import TasksKanbanPage from "./pages/TasksKanbanPage";
import TasksListPage from "./pages/TasksListPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import TasksDashboardPage from "./pages/TasksDashboardPage";
import MyExpensesPage from "./pages/MyExpensesPage";
import ExpenseApprovalQueuePage from "./pages/ExpenseApprovalQueuePage";
import AllExpensesPage from "./pages/AllExpensesPage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";
import DocumentsPage from "./pages/DocumentsPage";
import ReportsPage from "./pages/ReportsPage";
import ReportBuilder from "./components/reports/ReportBuilder";
import ReportViewer from "./components/reports/ReportViewer";
import OnboardingPage from "./pages/OnboardingPage";
import NotificationsPage from "./pages/NotificationsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import MajlisInstitutionsPage from "./pages/MajlisInstitutionsPage";
import MajlisDashboardPage from "./pages/MajlisDashboardPage";
import InstitutionDetailPage from "./pages/InstitutionDetailPage";
import EditInstitutionPage from "./pages/EditInstitutionPage";
import MajlisAssignmentsPage from "./pages/MajlisAssignmentsPage";
import MajlisReportsPage from "./pages/MajlisReportsPage";
import HalalDashboardPage from "./pages/halal/HalalDashboardPage";
import HalalRegisterPage from "./pages/halal/HalalRegisterPage";
import HalalApplyPage from "./pages/halal/HalalApplyPage";
import HalalCertificatesPage from "./pages/halal/HalalCertificatesPage";
import AdminHalalApplicationsPage from "./pages/halal/AdminHalalApplicationsPage";
import HalalApplicationDetailPage from "./pages/halal/HalalApplicationDetailPage";
import HalalInspectionAssignmentPage from "./pages/halal/HalalInspectionAssignmentPage";
import HalalRenewalPage from "./pages/halal/HalalRenewalPage";
import HalalViolationPage from "./pages/halal/HalalViolationPage";
import VerifyHalalPage from "./pages/halal/VerifyHalalPage";

const queryClient = new QueryClient();

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

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

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
      to="/dashboard"
      replace
      data-id="k95po2qvw"
      data-path="src/App.tsx"
    />
  );
}

function AppRoutes() {
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

      {/* Public: Halal certificate verification (no auth required) */}
      <Route path="/verify/halal" element={<VerifyHalalPage />} />
      <Route path="/verify/halal/:certificateId" element={<VerifyHalalPage />} />

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
        <Route
          path="dashboard"
          element={<Dashboard data-id="2qf7vwrd4" data-path="src/App.tsx" />}
          data-id="uyypx0ak2"
          data-path="src/App.tsx"
        />
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
        <Route path="halal/dashboard" element={<HalalDashboardPage />} />
        <Route path="halal/register" element={<HalalRegisterPage />} />
        <Route path="halal/apply" element={<HalalApplyPage />} />
        <Route path="halal/certificates" element={<HalalCertificatesPage />} />
        <Route path="halal/renew" element={<HalalRenewalPage />} />
        <Route path="admin/halal/applications" element={<AdminHalalApplicationsPage />} />
        <Route path="admin/halal/applications/:id" element={<HalalApplicationDetailPage />} />
        <Route path="admin/halal/inspections" element={<HalalInspectionAssignmentPage />} />
        <Route path="admin/halal/violations" element={<HalalViolationPage />} />
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
          path="assets/reports"
          element={<AssetReportsPage />}
        />
          <Route
            path="documents/templates"
            element={<DocumentTemplatesPage />}
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
          path="admin/users"
          element={<UsersPage data-id="ynptafeot" data-path="src/App.tsx" />}
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

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import AttendancePage from "./pages/AttendancePage";
import LeaveManagement from "./pages/LeaveManagement";
import PayrollPage from "./pages/PayrollPage";
import OrganizationPage from "./pages/OrganizationPage";
import TimesheetPage from "./pages/TimesheetPage";
import AssetManagementPage from "./pages/AssetManagementPage";
import ExpenseManagementPage from "./pages/ExpenseManagementPage";
import DocumentsPage from "./pages/DocumentsPage";
import ReportsPage from "./pages/ReportsPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotificationsPage from "./pages/NotificationsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

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
        <Route
          path="attendance"
          element={
            <AttendancePage data-id="25b8aufj8" data-path="src/App.tsx" />
          }
          data-id="u9467awkg"
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
          path="payroll"
          element={<PayrollPage data-id="gcl3okxuk" data-path="src/App.tsx" />}
          data-id="fxuwv8fkq"
          data-path="src/App.tsx"
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
          path="expenses"
          element={
            <ExpenseManagementPage
              data-id="68y9x1ab7"
              data-path="src/App.tsx"
            />
          }
          data-id="0qx63g042"
          data-path="src/App.tsx"
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
    <TooltipProvider data-id="mobcb0b0n" data-path="src/App.tsx">
      <AuthProvider data-id="l2tksbrmp" data-path="src/App.tsx">
        <BrowserRouter data-id="lopawu7zf" data-path="src/App.tsx">
          <AppRoutes data-id="uqfa9bkfo" data-path="src/App.tsx" />
        </BrowserRouter>
      </AuthProvider>
      <Toaster data-id="u7pxvax50" data-path="src/App.tsx" />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import OpsLayout from './components/layout/OpsLayout';
import AlertsPage from './pages/AlertsPage';
import BucketPolicyPage from './pages/BucketPolicyPage';
import AuditPage from './pages/AuditPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RgwPage from './pages/RgwPage';
import SettingsLayout from './components/layout/SettingsLayout';
import SettingsCleanupPage from './pages/settings/SettingsCleanupPage';
import SettingsGeneralPage from './pages/settings/SettingsGeneralPage';
import SettingsRegionsPage from './pages/settings/SettingsRegionsPage';
import SettingsServicesPage from './pages/settings/SettingsServicesPage';
import SettingsTenantLoginPage from './pages/settings/SettingsTenantLoginPage';
import PermissionsPage from './pages/PermissionsPage';
import BucketsPage from './pages/BucketsPage';
import TenantAccountsPage from './pages/TenantAccountsPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <OpsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route
            path="tenant-accounts"
            element={
              <ProtectedRoute requireAdmin>
                <TenantAccountsPage />
              </ProtectedRoute>
            }
          />
          <Route path="tenants" element={<Navigate to="/tenant-accounts" replace />} />
          <Route
            path="buckets"
            element={
              <ProtectedRoute requireAdmin>
                <BucketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute requireAdmin>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="permissions"
            element={
              <ProtectedRoute requireAdmin>
                <PermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bucket-policies"
            element={
              <ProtectedRoute requireAdmin>
                <BucketPolicyPage />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="general" replace />} />
            <Route path="general" element={<SettingsGeneralPage />} />
            <Route path="services" element={<SettingsServicesPage />} />
            <Route path="cleanup" element={<SettingsCleanupPage />} />
            <Route path="tenant-login" element={<SettingsTenantLoginPage />} />
            <Route path="regions" element={<SettingsRegionsPage />} />
          </Route>
          <Route path="rgw" element={<RgwPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="audit" element={<AuditPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

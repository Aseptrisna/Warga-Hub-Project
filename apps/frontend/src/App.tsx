import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RegisterDesaPage from './pages/auth/RegisterDesaPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
import DesaPublicPage from './pages/public/DesaPublicPage';
import DashboardPage from './pages/DashboardPage';
import RegionsPage from './pages/regions/RegionsPage';
import CitizensPage from './pages/citizens/CitizensEnhancedPage';
import CitizenDetailPage from './pages/citizens/CitizenDetailPage';
import CitizenFormPage from './pages/citizens/CitizenFormPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import LettersListPage from './pages/letters/LettersListPage';
import LetterRequestPage from './pages/letters/LetterRequestPage';
import LetterDetailPage from './pages/letters/LetterDetailPage';
import LetterTemplatesPage from './pages/letters/LetterTemplatesPage';
import PatrolPage from './pages/patrol/PatrolPage';
import ReportsPage from './pages/reports/ReportsPage';
import EventsPage from './pages/events/EventsPage';
import PanicPage from './pages/panic/PanicPage';
import SettingsPage from './pages/settings/SettingsPage';
import FamiliesPage from './pages/families/FamiliesPage';
import FamilyDetailPage from './pages/families/FamilyDetailPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import GuestbookPage from './pages/guestbook/GuestbookPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import MyProfilePage from './pages/profile/MyProfilePage';
import WargaActivationPage from './pages/admin/WargaActivationPage';
import DesaProfilePage from './pages/desa/DesaProfilePage';
import DesaLandingPage from './pages/desa/DesaLandingPage';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
        />
        <Route
          path="/register-desa"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterDesaPage />}
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/desa/:subdomain" element={<DesaPublicPage />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* My Profile */}
                  <Route path="/my-profile" element={<MyProfilePage />} />

                  {/* Regions */}
                  <Route path="/regions" element={<RegionsPage />} />

                  {/* Citizens */}
                  <Route path="/citizens" element={<CitizensPage />} />
                  <Route path="/citizens/new" element={<CitizenFormPage />} />
                  <Route path="/citizens/:id/edit" element={<CitizenFormPage />} />
                  <Route path="/citizens/:id" element={<CitizenDetailPage />} />

                  {/* Families */}
                  <Route path="/families" element={<FamiliesPage />} />
                  <Route path="/families/:id" element={<FamilyDetailPage />} />

                  {/* Letters */}
                  <Route path="/letters" element={<LettersListPage />} />
                  <Route path="/letters/request" element={<LetterRequestPage />} />
                  <Route path="/letters/templates" element={<LetterTemplatesPage />} />
                  <Route path="/letters/:id" element={<LetterDetailPage />} />

                  {/* Finance */}
                  <Route path="/finance" element={<PaymentsPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />

                  {/* Guestbook */}
                  <Route path="/guestbook" element={<GuestbookPage />} />

                  {/* Patrol */}
                  <Route path="/patrol" element={<PatrolPage />} />

                  {/* Announcements */}
                  <Route path="/announcements" element={<AnnouncementsPage />} />

                  {/* Reports */}
                  <Route path="/reports" element={<ReportsPage />} />

                  {/* Events */}
                  <Route path="/events" element={<EventsPage />} />

                  {/* Panic Button */}
                  <Route path="/panic" element={<PanicPage />} />

                  {/* Notifications */}
                  <Route path="/notifications" element={<NotificationsPage />} />

                  {/* Desa Management (AdminDesa) */}
                  <Route path="/desa/profile" element={<DesaProfilePage />} />
                  <Route path="/desa/landing" element={<DesaLandingPage />} />

                  {/* Admin - User Management */}
                  <Route path="/admin/users" element={<UserManagementPage />} />

                  {/* Admin - Warga Activation */}
                  <Route path="/admin/activations" element={<WargaActivationPage />} />

                  {/* Audit Log */}
                  <Route path="/audit-logs" element={<AuditLogPage />} />

                  {/* Settings */}
                  <Route path="/settings" element={<SettingsPage />} />

                  <Route path="*" element={<div className="p-6">404 - Page Not Found</div>} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

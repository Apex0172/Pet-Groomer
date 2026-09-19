import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import ManageAppointment from './pages/ManageAppointment';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardCalendar from './pages/admin/DashboardCalendar';
import ActionCenter from './pages/admin/ActionCenter';
import ClientDirectory from './pages/admin/ClientDirectory';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import Settings from './pages/admin/Settings';
import ServicesManager from './pages/admin/ServicesManager';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Multi-Tenant Public Booking Route */}
          <Route path="/book/:businessId" element={<BookingPage />} />
          
          {/* Client Self-Service Portal */}
          <Route path="/manage/:appointmentId" element={<ManageAppointment />} />
          
          {/* Admin CRM Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardCalendar />} />
            <Route path="action-center" element={<ActionCenter />} />
            <Route path="directory" element={<ClientDirectory />} />
            <Route path="services" element={<ServicesManager />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Super Admin Route */}
          <Route path="/superadmin" element={<SuperAdminDashboard />} />

          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

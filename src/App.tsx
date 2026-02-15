import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from './context/ThemeContext';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import SlotSelectionPage from './pages/SlotSelectionPage';
import LocationSelectionPage from './pages/LocationSelectionPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminSeats from './pages/admin/AdminSeats';
import AdminHolidays from './pages/admin/AdminHolidays';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminLocations from './pages/admin/AdminLocations';
import AdminLogin from './pages/admin/AdminLogin';
import MaintenanceGuard from './components/MaintenanceGuard';

/* Protected route — redirects to /admin/login if not authenticated */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin, adminLoading, checkAdmin } = useAuth();

  React.useEffect(() => {
    if (user && !isAdmin && !adminLoading) {
      checkAdmin(user);
    }
  }, [user, isAdmin, adminLoading, checkAdmin]);

  // loading is the main app initial session check
  // adminLoading is the specific check for the admin table
  if (loading || adminLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <MaintenanceGuard>
            <Routes>
              {/* Public */}
              <Route path="/" element={<><Header /><LandingPage /><Footer /></>} />
              <Route path="/slots" element={<><Header /><SlotSelectionPage /><Footer /></>} />
              <Route path="/location" element={<><Header /><LocationSelectionPage /><Footer /></>} />
              <Route path="/details" element={<><Header /><BookingDetailsPage /><Footer /></>} />
              <Route path="/payment" element={<><Header /><PaymentPage /><Footer /></>} />
              <Route path="/confirmation" element={<><Header /><ConfirmationPage /><Footer /></>} />

              {/* Admin login (no layout) */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin (protected) */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="approvals" element={<AdminApprovals />} />
                <Route path="seats" element={<AdminSeats />} />
                <Route path="holidays" element={<AdminHolidays />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="locations" element={<AdminLocations />} />
              </Route>
            </Routes>
          </MaintenanceGuard>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminPricing from './pages/admin/AdminPricing';
import AdminLogin from './pages/admin/AdminLogin';

/* Protected route — redirects to /admin/login if not authenticated */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
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
              <Route path="pricing" element={<AdminPricing />} />
            </Route>
          </Routes>
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

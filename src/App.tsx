// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useUser, UserProvider } from './contexts/UserContext';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MeasurementsPage from './pages/MeasurementsPage';
import ConsultantPage from './pages/ConsultantPage';
import ProductsPage from './pages/ProductsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import OrderPage from './pages/OrderPage';
import AdminManagement from './pages/AdminManagement';

const AppContent: React.FC = () => {
  const { loading, isLoggedIn } = useUser();
  const { toasts, removeToast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoggedIn && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/measurements" element={<MeasurementsPage />} />
        <Route path="/consultant" element={<ConsultantPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/order" element={<OrderPage selectedProducts={[]} />} />
        <Route path="/admin-management" element={<AdminManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppContent />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;

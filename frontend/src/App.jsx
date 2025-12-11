import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './components/pages/Landing';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import VerifyOTP from './components/VerifyOTP';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import Presentation from './components/pages/Presentation';
import PresentMode from './components/pages/PresentMode';
import JoinPresentation from './components/pages/JoinPresentation';
import PricingPage from './components/pages/PricingPage.jsx';
import About from './components/pages/About';
import Careers from './components/pages/Careers';
import Contact from './components/pages/Contact';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsOfService from './components/pages/TermsOfService';
import SuperAdmin from './components/pages/SuperAdmin';
import InstitutionAdmin from './components/pages/InstitutionAdmin';
import InstitutionRegister from './components/pages/InstitutionRegister';
import './index.css';
import { useTranslation } from 'react-i18next';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Allow access if user is authenticated (Firebase) OR if they have institution admin token
  const hasInstitutionAdminToken = sessionStorage.getItem('institutionAdminToken');
  
  return (currentUser || hasInstitutionAdminToken) ? children : <Navigate to="/" replace />;
}

// Public Route Component (redirect to dashboard or previous page if already logged in)
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return currentUser ? <Navigate to={from} replace /> : children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PageTitleUpdater() {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    let title = t('page_titles.home');

    if (path === '/') {
      title = t('page_titles.home_full');
    } else if (path === '/login') {
      title = t('page_titles.login');
    } else if (path === '/register') {
      title = t('page_titles.register');
    } else if (path === '/forgot-password') {
      title = t('page_titles.forgot_password');
    } else if (path === '/verify-otp') {
      title = t('page_titles.verify_otp');
    } else if (path === '/reset-password') {
      title = t('page_titles.reset_password');
    } else if (path === '/dashboard') {
      title = t('page_titles.dashboard');
    } else if (path.startsWith('/presentation/')) {
      title = t('page_titles.editor');
    } else if (path.startsWith('/present/')) {
      title = t('page_titles.live_presentation');
    } else if (path.startsWith('/join/')) {
      title = t('page_titles.join_session');
    } else if (path === '/pricing') {
      title = t('page_titles.pricing');
    } else if (path === '/about') {
      title = t('page_titles.about');
    } else if (path === '/careers') {
      title = t('page_titles.careers');
    } else if (path === '/contact') {
      title = t('page_titles.contact');
    } else if (path === '/privacy-policy') {
      title = t('page_titles.privacy_policy');
    } else if (path === '/terms-of-service') {
      title = t('page_titles.terms_of_service');
    } else if (path === '/super-admin') {
      title = t('page_titles.super_admin');
    } else if (path === '/institution-admin') {
      title = t('page_titles.institution_admin');
    }

    document.title = title;
  }, [location, t]);

  return null;
}

function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <PageTitleUpdater />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute> <Login /> </PublicRoute>} />
            <Route path="/register" element={<PublicRoute> <Register /> </PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute> <ForgotPassword /> </PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute> <VerifyOTP /> </PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute> <ResetPassword /> </PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
            <Route path="/presentation/:id" element={<ProtectedRoute> <Presentation /> </ProtectedRoute>} />
            <Route path="/present/:id" element={<ProtectedRoute> <PresentMode /> </ProtectedRoute>} />
            <Route path="/join/:code" element={<JoinPresentation />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
            <Route path="/institution-admin" element={<InstitutionAdmin />} />
            <Route path="/institution/register" element={<InstitutionRegister />} />
            <Route path="/institution/register/verify" element={<InstitutionRegister />} />
          </Routes>
        </Router>
      </AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
          },
          error: {
            duration: 2500,
          },
        }}
      />
    </>
  );
}

export default App;
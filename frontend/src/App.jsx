import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

// Lazy load pages
const AdminDashboard      = lazy(() => import('./pages/AdminDashboard'));
const ClientDashboard     = lazy(() => import('./pages/ClientDashboard'));
const FournisseurDashboard = lazy(() => import('./pages/FournisseurDashboard'));
const PartenaireDashboard  = lazy(() => import('./pages/PartenaireDashboard'));
const Landing              = lazy(() => import('./components/Landing12'));

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div></div>}>
          <Routes>

            {/* Landing Page — public */}
            <Route path="/" element={<Landing />} />

            {/* Login / Forgot */}
            <Route path="/login"           element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Client */}
            <Route path="/client" element={
              <ProtectedRoute roles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            } />

            {/* Fournisseur */}
            <Route path="/fournisseur" element={
              <ProtectedRoute roles={['fournisseur']}>
                <FournisseurDashboard />
              </ProtectedRoute>
            } />

            {/* Partenaire */}
            <Route path="/partenaire" element={
              <ProtectedRoute roles={['partenaire']}>
                <PartenaireDashboard />
              </ProtectedRoute>
            } />

          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
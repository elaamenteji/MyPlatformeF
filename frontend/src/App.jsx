import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

const AdminDashboard       = lazy(() => import('./pages/AdminDashboard'));
const ClientDashboard      = lazy(() => import('./pages/ClientDashboard'));
const FournisseurDashboard = lazy(() => import('./pages/FournisseurDashboard'));
const PartenaireDashboard  = lazy(() => import('./pages/PartenaireDashboard'));
const Landing              = lazy(() => import('./components/Landing12'));
const SetupRecoveryKey     = lazy(() => import('./pages/SetupRecoveryKey'));
const ResetPassword        = lazy(() => import('./pages/ResetPassword'));
const ForgotPassword       = lazy(() => import('./pages/ForgotPassword'));
const ForgotPasswordUser   = lazy(() => import('./pages/ForgotPasswordUser'));

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div></div>}>
          <Routes>

            <Route path="/" element={<Landing />} />

            <Route path="/login"                element={<Login />} />
            <Route path="/forgot-password"      element={<ForgotPassword />} />
            <Route path="/forgot-password-user" element={<ForgotPasswordUser />} />
            <Route path="/reset-password"       element={<ResetPassword />} />

            <Route path="/setup-recovery-key" element={
              <ProtectedRoute roles={['admin']}>
                <SetupRecoveryKey />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/client" element={
              <ProtectedRoute roles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            } />

            <Route path="/fournisseur" element={
              <ProtectedRoute roles={['fournisseur']}>
                <FournisseurDashboard />
              </ProtectedRoute>
            } />

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
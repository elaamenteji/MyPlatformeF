import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

// Importation dynamique (Lazy Loading) pour toutes les pages
const AdminDashboard       = lazy(() => import('./pages/AdminDashboard'));
const ClientDashboard      = lazy(() => import('./pages/ClientDashboard'));
const FournisseurDashboard = lazy(() => import('./pages/FournisseurDashboard'));
const PartenaireDashboard  = lazy(() => import('./pages/PartenaireDashboard'));
const Landing              = lazy(() => import('./components/Landing12'));
const SetupRecoveryKey     = lazy(() => import('./pages/SetupRecoveryKey'));
const ResetPassword        = lazy(() => import('./pages/ResetPassword'));
const ForgotPassword       = lazy(() => import('./pages/ForgotPassword'));
const ForgotPasswordUser   = lazy(() => import('./pages/ForgotPasswordUser'));

// Ces deux fichiers doivent exister dans src/pages/
const SuiviProjets         = lazy(() => import('./components/SuiviProjets'));
const PlaningDatesClés     = lazy(() => import('./components/PlanningDates'));

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Le fallback est ce qui s'affiche pendant le chargement des composants lazy */}
        <Suspense fallback={<div style={{ padding: 20 }}>Chargement...</div>}>
          <Routes>
            
            {/* ── ROUTES PUBLIQUES ── */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-password-user" element={<ForgotPasswordUser />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── ROUTES ADMIN ── */}
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

            {/* ── ROUTES CLIENT ── */}
            <Route path="/client" element={
              <ProtectedRoute roles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            } />

            <Route path="/client/suivi" element={
              <ProtectedRoute roles={['client']}>
                <SuiviProjets />
              </ProtectedRoute>
            } />

            <Route path="/client/planning" element={
              <ProtectedRoute roles={['client']}>
                <PlaningDatesClés />
              </ProtectedRoute>
            } />

            {/* ── ROUTE FOURNISSEUR ── */}
            <Route path="/fournisseur" element={
              <ProtectedRoute roles={['fournisseur']}>
                <FournisseurDashboard />
              </ProtectedRoute>
            } />

            {/* ── ROUTE PARTENAIRE ── */}
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
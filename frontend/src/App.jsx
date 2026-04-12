import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import FournisseurDashboard from './pages/FournisseurDashboard';
import PartenaireDashboard from './pages/PartenaireDashboard';
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

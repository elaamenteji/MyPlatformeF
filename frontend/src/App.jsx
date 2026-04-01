import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Redirect / lel login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Page login */}
          <Route path="/login" element={<Login />} />

          {/* Mot de passe oublié */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <div>Admin Dashboard — baqi naamlou</div>
            </ProtectedRoute>
          } />

          {/* Client */}
          <Route path="/client" element={
            <ProtectedRoute roles={['client']}>
              <div>Client Dashboard — baqi naamlou</div>
            </ProtectedRoute>
          } />

          {/* Fournisseur */}
          <Route path="/fournisseur" element={
            <ProtectedRoute roles={['fournisseur']}>
              <div>Fournisseur Dashboard — baqi naamlou</div>
            </ProtectedRoute>
          } />

          {/* Partenaire */}
          <Route path="/partenaire" element={
            <ProtectedRoute roles={['partenaire']}>
              <div>Partenaire Dashboard — baqi naamlou</div>
            </ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
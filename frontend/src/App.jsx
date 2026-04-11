import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './components/Landing12.jsx'; // Zid el .jsx bsh yfhemha mlih
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. El Landing Page hiya awel 7aja ychoufha el user */}
          <Route path="/" element={<Landing />} />

          {/* 2. Routes el Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* 3. El Routes el Protected (kol role w blastou) */}
          
          {/* Admin */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute roles={['admin']}>
                <div>Admin Dashboard — baqi naamlou</div>
              </ProtectedRoute>
            } 
          />

          {/* Client */}
          <Route 
            path="/client" 
            element={
              <ProtectedRoute roles={['client']}>
                <div>Client Dashboard — baqi naamlou</div>
              </ProtectedRoute>
            } 
          />

          {/* Fournisseur */}
          <Route 
            path="/fournisseur" 
            element={
              <ProtectedRoute roles={['fournisseur']}>
                <div>Fournisseur Dashboard — baqi naamlou</div>
              </ProtectedRoute>
            } 
          />

          {/* Partenaire */}
          <Route 
            path="/partenaire" 
            element={
              <ProtectedRoute roles={['partenaire']}>
                <div>Partenaire Dashboard — baqi naamlou</div>
              </ProtectedRoute>
            } 
          />

          {/* 4. Redirect ken el path msh mawjoud (404) */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  // Baqi ycharrek — wait
  if (loading) return <div>Chargement...</div>;

  // Mch connecté → roh login
  if (!user) return <Navigate to="/login" replace />;

  // Rôle mch mel7a9 → roh login
  if (roles && !roles.includes(user.role))
    return <Navigate to="/login" replace />;

  // Kol haja sa7i7a → tfeddel
  return children;
};

export default ProtectedRoute;
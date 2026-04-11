import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if      (user.role === 'admin')       navigate('/admin');
      else if (user.role === 'client')      navigate('/client');
      else if (user.role === 'fournisseur') navigate('/fournisseur');
      else                                  navigate('/partenaire');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* ══ GAUCHE : Formulaire ══ */}
      <div className="login-left">

        {/* Logo réel */}
        <div className="login-logo">
          <img
            src="/logo_mitech.png"
            alt="Mitech Tunisie"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Titre */}
        <h1 className="login-greeting">Bienvenue</h1>
        <div className="login-rule" />
        <p className="login-sub">Connectez-vous à votre espace</p>

        {/* Erreur */}
        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>

          {/* Email */}
          <div className="login-field">
            <label className="login-label" htmlFor="email">Adresse email</label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><Mail size={15} /></span>
              <input
                id="email"
                type="email"
                placeholder="votre@mitech.tn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="login-input"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <div className="login-forgot-row">
              <label className="login-label" htmlFor="password">Mot de passe</label>
              <button
                type="button"
                className="login-forgot"
                onClick={() => navigate('/forgot-password')}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="login-input-wrap">
              <span className="login-input-icon"><Lock size={15} /></span>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="login-input"
                required
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter →'}
          </button>

        </form>

        <p className="login-footer">Connexion sécurisée SSL · © 2026 Mitech Tunisie</p>
      </div>

      {/* ══ DROITE : Vraie image ══ */}
      <div className="login-right">
        <img
          className="login-bg"
          src="/car_interior.jpg"
          alt="Mitech leather interior"
        />
        <div className="login-right-overlay" />
        <div className="login-right-content">
          <div className="login-right-line" />
          <h2 className="login-right-title">Excellence<br />&amp; Précision</h2>
          <p className="login-right-sub">
            Plateforme de gestion intégrée pour les équipes Mitech Tunisie.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
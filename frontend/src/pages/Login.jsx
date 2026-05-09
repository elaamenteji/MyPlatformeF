import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
      if (user.role === 'admin' && user.needsRecoverySetup) {
        navigate('/setup-recovery-key');
      } else {
        switch (user.role) {
          case 'admin':       navigate('/admin');       break;
          case 'client':      navigate('/client');      break;
          case 'fournisseur': navigate('/fournisseur'); break;
          case 'partenaire':  navigate('/partenaire');  break;
          default:            navigate('/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (email.toLowerCase() === 'aelament2003@gmail.com') {
      navigate('/forgot-password');
    } else {
      navigate('/forgot-password-user');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── GAUCHE 38% ── */}
      <div style={{ width: '38%', height: '100vh', display: 'flex', flexDirection: 'column', padding: '48px 56px', background: 'white' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'auto' }}>
          <img src="/logo_mitech.png" alt="Mitech" style={{ height: 44, objectFit: 'contain' }} onError={e => e.target.style.display='none'}/>
          <span
            onClick={() => navigate('/')}
            style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
          >
            ← Retour à l'accueil
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.15em', marginBottom: 10 }}>MITECH TUNISIE</p>
          <h1 style={{ fontSize: 42, fontWeight: 300, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.1 }}>Bienvenue</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 40 }}>Connexion à votre espace personnel.</p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            <div>
              <label style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 8 }}>Adresse e-mail</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 8, gap: 10 }}>
                <Mail size={16} color="#94a3b8" style={{ flexShrink: 0 }}/>
                <input
                  type="email"
                  placeholder="votre@mitech.tn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: '#475569' }}>Mot de passe</label>
                <span
                  onClick={handleForgotPassword}
                  style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
                >
                  Mot de passe oublié ?
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 8, gap: 10 }}>
                <Lock size={16} color="#94a3b8" style={{ flexShrink: 0 }}/>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: '#1a1f2c', color: 'white', border: 'none', padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '0.05em', marginTop: 8 }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

          </form>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p style={{ fontSize: 11, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>
            </svg>
            Connexion sécurisée · © 2026 Mitech Tunisie
          </p>
        </div>

      </div>

      {/* ── DROITE 62% ── */}
      <div style={{ width: '62%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <img
          src="/car_interior1.jpg"
          alt="Mitech"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 56px 52px' }}>
          <h2 style={{ fontSize: 40, fontWeight: 500, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>
            Excellence &amp; Précision
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 300, maxWidth: 420, margin: 0 }}>
            Plateforme de gestion intégrée pour les équipes Mitech Tunisie.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
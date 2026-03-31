import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('admin');
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
      if (user.role === 'admin')            navigate('/admin');
      else if (user.role === 'client')      navigate('/client');
      else if (user.role === 'fournisseur') navigate('/fournisseur');
      else                                  navigate('/partenaire');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'admin',       label: 'Administrateur', icon: 'A', colors: { border: '#2563eb', bg: '#eff6ff', color: '#1e40af', iconBg: '#dbeafe' } },
    { key: 'client',      label: 'Client',         icon: 'C', colors: { border: '#16a34a', bg: '#f0fdf4', color: '#166534', iconBg: '#dcfce7' } },
    { key: 'fournisseur', label: 'Fournisseur',     icon: 'F', colors: { border: '#ca8a04', bg: '#fefce8', color: '#854d0e', iconBg: '#fef9c3' } },
    { key: 'partenaire',  label: 'Partenaire',      icon: 'P', colors: { border: '#9333ea', bg: '#fdf4ff', color: '#6b21a8', iconBg: '#fae8ff' } },
  ];

  const activeRole = roles.find(r => r.key === role);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem 2.2rem', width: '100%', maxWidth: '440px', border: '0.5px solid #e2e8f0' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <img
            src="/logo_mitech.png"
            alt="Mitech Tunisie"
            style={{ height: '70px', objectFit: 'contain' }}
          />
        </div>

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#15803d', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '20px', padding: '3px 10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
            Plateforme active
          </div>
        </div>

        <p style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Connexion</p>
        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '1.4rem' }}>Connectez-vous à votre espace personnel</p>

        {/* Roles */}
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '10px' }}>Sélectionnez votre rôle</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.4rem' }}>
          {roles.map(r => (
            <button key={r.key} onClick={() => setRole(r.key)} style={{
              padding: '13px 10px', borderRadius: '12px',
              border: `${role === r.key ? '2px' : '1.5px'} solid ${role === r.key ? r.colors.border : '#cbd5e1'}`,
              background: role === r.key ? r.colors.bg : '#f8fafc',
              color: role === r.key ? r.colors.color : '#1e293b',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              transition: 'all 0.18s', fontFamily: 'sans-serif'
            }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: r.colors.iconBg, color: r.colors.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                {r.icon}
              </span>
              {r.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0.2rem 0 1.3rem' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#cbd5e1' }}></div>
          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>ou</span>
          <div style={{ flex: 1, height: '0.5px', background: '#cbd5e1' }}></div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '0.5px solid #fca5a5', borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Adresse email</div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '0 12px', color: '#64748b', fontSize: '16px', borderRight: '1px solid #e2e8f0', height: '46px', display: 'flex', alignItems: 'center', background: '#f1f5f9' }}>✉</div>
              <input
                type="email"
                placeholder="exemple@mitech.tn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ flex: 1, padding: '12px 14px', background: 'transparent', border: 'none', outline: 'none', color: '#0f172a', fontSize: '14px', fontFamily: 'sans-serif' }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Mot de passe</div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '0 12px', color: '#64748b', fontSize: '16px', borderRight: '1px solid #e2e8f0', height: '46px', display: 'flex', alignItems: 'center', background: '#f1f5f9' }}>🔒</div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ flex: 1, padding: '12px 14px', background: 'transparent', border: 'none', outline: 'none', color: '#0f172a', fontSize: '14px', fontFamily: 'sans-serif' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ padding: '0 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '15px', height: '46px' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Mot de passe oublié */}
          <div style={{ textAlign: 'right', marginBottom: '1.2rem' }}>
            <a href="#" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Mot de passe oublié ?</a>
          </div>

          {/* Bouton Se connecter */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? '#93c5fd' : activeRole.colors.border,
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'sans-serif', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s'
          }}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
            {!loading && (
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>→</span>
            )}
          </button>

        </form>

        <p style={{ fontSize: '12px', color: '#475569', textAlign: 'center', fontWeight: '500' }}>
          En continuant, vous acceptez nos <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Conditions d'utilisation</a>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
          🔒 Connexion sécurisée SSL
        </div>

      </div>
    </div>
  );
};

export default Login;
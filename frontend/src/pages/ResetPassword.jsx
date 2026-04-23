import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [nouveau, setNouveau]       = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showPass2, setShowPass2]   = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const resetToken = localStorage.getItem('resetToken');

  // Ken ma3andouch resetToken → rod lel forgot-password
  useEffect(() => {
    if (!resetToken) navigate('/forgot-password');
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (nouveau.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (nouveau !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password-token', {
        resetToken,
        nouveau
      });

      if (res.data.success) {
        // Nen7iw el resetToken — ma yexhdemch marra okhra
        localStorage.removeItem('resetToken');
        setSuccess(true);
        // Ba3d 3 secondes → rod lel login
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '3rem 2.5rem', maxWidth: '400px', width: '100%', textAlign: 'center', border: '0.5px solid #e2e8f0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
            Mot de passe modifié !
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem' }}>
            Vous allez être redirigé vers la page de connexion...
          </p>
          <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#16a34a', borderRadius: '4px', animation: 'progress 3s linear forwards' }} />
          </div>
          <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
        </div>
      </div>
    );
  }

  // ── Form screen ──
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem 2.2rem', width: '100%', maxWidth: '440px', border: '0.5px solid #e2e8f0' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <img src="/logo_mitech.png" alt="Mitech" style={{ height: '70px', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
        </div>

        {/* Icon + Titre */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Lock size={24} color="#3b5bdb" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 0 6px' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Choisissez un mot de passe sécurisé (min. 8 caractères).
          </p>
        </div>

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Nouveau password */}
          <div>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Nouveau mot de passe
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', gap: '10px' }}>
              <Lock size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={nouveau}
                onChange={e => setNouveau(e.target.value)}
                required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#0f172a', background: 'transparent' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Confirmer le mot de passe
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${confirm && nouveau !== confirm ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px', padding: '10px 14px', gap: '10px' }}>
              <Lock size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                type={showPass2 ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#0f172a', background: 'transparent' }}
              />
              <button type="button" onClick={() => setShowPass2(!showPass2)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                {showPass2 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm && nouveau !== confirm && (
              <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>
                Les mots de passe ne correspondent pas.
              </p>
            )}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '13px', background: '#3b5bdb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem' }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '11px', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' }}
          >
            ← Retour au login
          </button>

        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
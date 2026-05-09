import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [nouveau,   setNouveau]  = useState('');
  const [confirm,   setConfirm]  = useState('');
  const [showPass,  setShowPass] = useState(false);
  const [showPass2, setShowPass2]= useState(false);
  const [error,     setError]    = useState('');
  const [loading,   setLoading]  = useState(false);
  const [success,   setSuccess]  = useState(false);

  const urlToken   = searchParams.get('token');
  const localToken = localStorage.getItem('resetToken');

  const tokenType   = urlToken ? 'email' : localToken ? 'recovery' : null;
  const activeToken = urlToken || localToken;

  // ✅ Fix — attend que les params URL soient lus
  useEffect(() => {
    if (!urlToken && !localToken) {
      navigate('/forgot-password');
    }
  }, [urlToken, localToken]);

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
      let res;

      if (tokenType === 'email') {
        res = await axios.post(`${API}/api/auth/reset-password-email`, {
          token: urlToken,
          nouveau,
        });
      } else {
        res = await axios.post(`${API}/api/auth/reset-password-token`, {
          resetToken: localToken,
          nouveau,
        });
      }

      if (res.data.success) {
        localStorage.removeItem('resetToken');
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur serveur.';
      if (msg.includes('expiré') || msg.includes('invalide')) {
        setError('Ce lien a expiré ou est invalide. Veuillez recommencer.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f0f4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{
          background: '#fff', borderRadius: 20,
          padding: '3rem 2.5rem', maxWidth: 400, width: '100%',
          textAlign: 'center', border: '0.5px solid #e2e8f0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Mot de passe modifié !
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: '1.5rem' }}>
            Vous allez être redirigé vers la page de connexion...
          </p>
          <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#16a34a',
              borderRadius: 4, animation: 'progress 3s linear forwards',
            }} />
          </div>
          <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f4ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        padding: '2.5rem 2.2rem', width: '100%', maxWidth: 440,
        border: '0.5px solid #e2e8f0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>

        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <img
            src="/logo_mitech.png"
            alt="Mitech"
            style={{ height: 70, objectFit: 'contain' }}
            onError={e => e.target.style.display = 'none'}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#eef2ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Lock size={24} color="#3b5bdb" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Choisissez un mot de passe sécurisé (min. 8 caractères).
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 10, padding: '4px 12px',
            background: tokenType === 'email' ? '#eff6ff' : '#f0fdf4',
            border: `1px solid ${tokenType === 'email' ? '#bfdbfe' : '#86efac'}`,
            borderRadius: 20, fontSize: 11, fontWeight: 500,
            color: tokenType === 'email' ? '#1d4ed8' : '#15803d',
          }}>
            {tokenType === 'email' ? '📧 Via lien email' : '🔑 Via code de récupération'}
          </div>
        </div>

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <label style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Nouveau mot de passe
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '10px 14px', gap: 10,
            }}>
              <Lock size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={nouveau}
                onChange={e => setNouveau(e.target.value)}
                required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {nouveau.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 3,
                      background: nouveau.length >= i * 2
                        ? i <= 1 ? '#ef4444' : i <= 2 ? '#f97316' : i <= 3 ? '#eab308' : '#16a34a'
                        : '#e2e8f0',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <span style={{
                  fontSize: 11,
                  color: nouveau.length < 4 ? '#ef4444' : nouveau.length < 6 ? '#f97316' : nouveau.length < 8 ? '#eab308' : '#16a34a',
                }}>
                  {nouveau.length < 4 ? 'Très faible' : nouveau.length < 6 ? 'Faible' : nouveau.length < 8 ? 'Moyen' : 'Fort ✓'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Confirmer le mot de passe
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1px solid ${confirm && nouveau !== confirm ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: 10, padding: '10px 14px', gap: 10,
            }}>
              <Lock size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                type={showPass2 ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }}
              />
              <button type="button" onClick={() => setShowPass2(!showPass2)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                {showPass2 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm && nouveau !== confirm && (
              <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>
                Les mots de passe ne correspondent pas.
              </p>
            )}
            {confirm && nouveau === confirm && confirm.length > 0 && (
              <p style={{ fontSize: 12, color: '#16a34a', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={11} /> Les mots de passe correspondent.
              </p>
            )}
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || nouveau !== confirm || nouveau.length < 8}
            style={{
              width: '100%', padding: 13,
              background: loading || nouveau !== confirm || nouveau.length < 8 ? '#94a3b8' : '#3b5bdb',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              cursor: loading || nouveau !== confirm || nouveau.length < 8 ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem', transition: 'background 0.15s',
            }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: 11,
              background: 'transparent', color: '#64748b',
              border: '1px solid #e2e8f0', borderRadius: 12,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            ← Retour au login
          </button>

        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
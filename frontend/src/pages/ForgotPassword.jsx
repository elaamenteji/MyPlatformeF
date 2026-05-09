import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [mailSent,    setMailSent]    = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailError,   setMailError]   = useState('');

  /* ── Étape 1 : vérifier code secours ── */
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/verify-recovery-key`, {
        email,
        recoveryCode: code,
      });
      if (res.data.success) {
        localStorage.setItem('resetToken', res.data.resetToken);
        navigate('/reset-password');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      setError(msg || 'Code incorrect.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Étape 2 : envoyer lien par mail ── */
  const handleSendMail = async () => {
    if (!email.trim()) {
      setMailError('Entrez votre email d\'abord.');
      return;
    }
    setMailError('');
    setMailLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password-admin`, { email });
      setMailSent(true);
    } catch {
      setMailError('Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setMailLoading(false);
    }
  };

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

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <img src="/logo_mitech.png" alt="Mitech"
            style={{ height: 60, objectFit: 'contain' }}
            onError={e => e.target.style.display = 'none'} />
        </div>

        {/* Titre */}
        <div style={{ textAlign: 'center', fontSize: 44, marginBottom: '0.8rem' }}>🔑</div>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6, textAlign: 'center' }}>
          Mot de passe oublié ?
        </p>
        <p style={{ fontSize: 13, color: '#475569', marginBottom: '1.8rem', textAlign: 'center' }}>
          Utilisez votre code de récupération ou recevez un lien par email.
        </p>

        {/* ── SUCCESS mail envoyé ── */}
        {mailSent ? (
          <>
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 16, padding: '2rem',
              textAlign: 'center', marginBottom: '1.2rem',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
                Email envoyé !
              </div>
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                Un lien de réinitialisation a été envoyé à<br />
                <strong>{email}</strong>
              </div>
              <div style={{
                marginTop: 14, padding: '8px 14px',
                background: '#dcfce7', borderRadius: 8,
                fontSize: 12, color: '#166534',
              }}>
                ⏱ Ce lien expire dans <strong>15 minutes</strong>
              </div>
            </div>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: 12, background: 'transparent',
              color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 12,
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>
              ← Retour au login
            </button>
          </>
        ) : (
          <>
            {/* ── Section 1: Code secours ── */}
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 14, padding: '1.2rem', marginBottom: '1rem',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                🔐 Option 1 — Code de récupération
              </div>

              <form onSubmit={handleVerify}>
                {/* Email */}
                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, fontWeight: 500 }}>
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setMailSent(false); }}
                    required
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1px solid #e2e8f0', borderRadius: 10,
                      fontSize: 13, outline: 'none',
                      boxSizing: 'border-box', color: '#0f172a',
                    }}
                  />
                </div>

                {/* Code */}
                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, fontWeight: 500 }}>
                    Code de récupération (6 chiffres)
                  </label>
                  <input
                    type="text"
                    placeholder="_ _ _ _ _ _"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1px solid #e2e8f0', borderRadius: 10,
                      fontSize: 24, fontWeight: 700,
                      letterSpacing: '0.5em', textAlign: 'center',
                      outline: 'none', boxSizing: 'border-box', color: '#1e293b',
                    }}
                  />
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '8px 12px',
                    fontSize: 12, color: '#dc2626', marginBottom: '0.8rem',
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  style={{
                    width: '100%', padding: 11,
                    background: code.length === 6 ? '#2563eb' : '#94a3b8',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 600,
                    cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? 'Vérification...' : 'Vérifier le code →'}
                </button>
              </form>
            </div>

            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1rem 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* ── Section 2: Email ── */}
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 14, padding: '1.2rem', marginBottom: '1.2rem',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a5f', marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                📧 Option 2 — Lien par email
              </div>

              <p style={{ fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 1.5 }}>
                Recevez un lien de réinitialisation valable <strong>15 minutes</strong> sur votre email.
              </p>

              {mailError && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 8, padding: '8px 12px',
                  fontSize: 12, color: '#dc2626', marginBottom: 10,
                }}>
                  {mailError}
                </div>
              )}

              <button
                onClick={handleSendMail}
                disabled={mailLoading}
                style={{
                  width: '100%', padding: '11px',
                  background: mailLoading ? '#93c5fd' : '#2563eb',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  cursor: mailLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {mailLoading ? 'Envoi en cours...' : '📧 Envoyer le lien par email'}
              </button>
            </div>

            {/* Retour */}
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: 12, background: 'transparent',
              color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 12,
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>
              ← Retour au login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
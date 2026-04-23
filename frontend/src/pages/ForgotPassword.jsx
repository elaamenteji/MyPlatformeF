import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [popupOpen, setPopupOpen]       = useState(false);
  const [popupEmail, setPopupEmail]     = useState('');
  const [popupStep, setPopupStep]       = useState('form');
  const [popupError, setPopupError]     = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-recovery-key', {
        email,
        recoveryCode: code
      });
      if (res.data.success) {
        localStorage.setItem('resetToken', res.data.resetToken);
        navigate('/reset-password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Code incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    if (!popupEmail.trim()) return;
    setPopupStep('loading');
    setPopupError('');
    try {
      const res = await axios.post('http://localhost:5000/api/notifications/reset-request', {
        email: popupEmail.trim()
      });
      if (res.data.success) {
        setPopupStep('success');
      } else {
        setPopupError(res.data.message || 'Erreur.');
        setPopupStep('error');
      }
    } catch (err) {
      setPopupError('Impossible de contacter le serveur.');
      setPopupStep('error');
    }
  };

  const closePopup = () => {
    setPopupOpen(false);
    setPopupEmail('');
    setPopupStep('form');
    setPopupError('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem 2.2rem', width: '100%', maxWidth: '440px', border: '0.5px solid #e2e8f0' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <img src="/logo_mitech.png" alt="Mitech Tunisie" style={{ height: '70px', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
        </div>

        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '1rem' }}>🔑</div>
        <p style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
          Mot de passe oublié ?
        </p>
        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '2rem', textAlign: 'center' }}>
          Entrez votre email et votre code de récupération à 6 chiffres.
        </p>

        <form onSubmit={handleVerify} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              placeholder="admin@mitech.tn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Code de récupération (6 chiffres)
            </label>
            <input
              type="text"
              placeholder="_ _ _ _ _ _"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '22px', fontWeight: '700', letterSpacing: '0.4em', textAlign: 'center', outline: 'none', boxSizing: 'border-box', color: '#1e293b' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{ width: '100%', padding: '13px', background: code.length === 6 ? '#2563eb' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: code.length === 6 ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Vérification...' : 'Vérifier le code →'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>code perdu ?</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '13px', color: '#9a3412', fontWeight: '600', margin: '0 0 6px' }}>
            ⚠️ Support Technique Mitech (DBA)
          </p>
          <p style={{ fontSize: '12px', color: '#9a3412', margin: 0, lineHeight: 1.6 }}>
            En cas de perte du code de secours, veuillez contacter le Support Technique Mitech (DBA) pour une réinitialisation manuelle.
          </p>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>✉️</div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '2px' }}>Email DBA</div>
              <a href="mailto:dba@mitech.tn" style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>dba@mitech.tn</a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📞</div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '2px' }}>Téléphone DBA</div>
              <a href="tel:+21600000000" style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>+216 XX XXX XXX</a>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          style={{ width: '100%', padding: '13px', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
        >
          ← Retour au login
        </button>

      </div>
    </div>
  );
};

export default ForgotPassword;
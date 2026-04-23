import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPasswordUser = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep]   = useState('form');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStep('loading');
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/notifications/reset-request', {
        email: email.trim()
      });
      if (res.data.success) {
        setStep('success');
      } else {
        setError(res.data.message || 'Erreur.');
        setStep('error');
      }
    } catch (err) {
      setError('Impossible de contacter le serveur.');
      setStep('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem 2.2rem', width: '100%', maxWidth: '420px', border: '0.5px solid #e2e8f0' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <img src="/logo_mitech.png" alt="Mitech" style={{ height: '70px', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
        </div>

        {(step === 'form' || step === 'error') && (
          <>
            <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '1rem' }}>📩</div>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
              Mot de passe oublié ?
            </p>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '2rem', textAlign: 'center', lineHeight: 1.6 }}>
              Entrez votre email — une demande sera envoyée à l'administrateur qui vous contactera avec un nouveau mot de passe.
            </p>

            {step === 'error' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  placeholder="votre@email.tn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                style={{ width: '100%', padding: '13px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
              >
                Envoyer la demande
              </button>
            </form>
          </>
        )}

        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Envoi en cours...</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>
              Demande envoyée !
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              Votre demande a été envoyée à l'administrateur.<br />
              <strong>Veuillez le contacter pour récupérer votre nouveau mot de passe.</strong>
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '13px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {step !== 'success' && (
          <button
            onClick={() => navigate('/login')}
            style={{ width: '100%', marginTop: '1rem', padding: '13px', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            ← Retour au login
          </button>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordUser;
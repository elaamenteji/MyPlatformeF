import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function SetupRecoveryKey() {
  const navigate = useNavigate();
  const [step, setStep] = useState('intro');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (recoveryCode.length !== 6) {
      setError('Le code doit contenir exactement 6 chiffres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(
        'http://localhost:5000/api/auth/generate-recovery-key',
        { recoveryCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setStep('show');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!confirmed) return;
    navigate('/admin');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <ShieldCheck size={28} color="#3b5bdb" />
          </div>
          <h1 style={styles.title}>Configuration Recovery Key</h1>
          <p style={styles.subtitle}>
            Configurez votre code de secours avant d'accéder au dashboard.
          </p>
        </div>

        {/* Step: intro — admin yekteb code mte3ou */}
        {step === 'intro' && (
          <div>
            <div style={styles.infoBox}>
              <AlertTriangle size={16} color="#e8590c" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={styles.infoText}>
                Choisissez un code à <strong>6 chiffres</strong> que vous allez mémoriser.
                Il sera utilisé pour réinitialiser votre mot de passe en cas d'oubli.
              </p>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>
                Votre code de récupération (6 chiffres)
              </label>
              <input
                type="text"
                placeholder="• • • • • •"
                value={recoveryCode}
                onChange={e => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '2rem',
                  fontWeight: 700,
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#1e293b',
                  background: '#f8fafc'
                }}
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              onClick={handleSave}
              disabled={loading || recoveryCode.length !== 6}
              style={{
                ...styles.btnPrimary,
                opacity: recoveryCode.length === 6 ? 1 : 0.4,
                cursor: recoveryCode.length === 6 ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer mon code →'}
            </button>
          </div>
        )}

        {/* Step: show — confirmation */}
        {step === 'show' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <CheckCircle size={52} color="#16a34a" />
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#16a34a', margin: '0.8rem 0 0.4rem' }}>
                Code enregistré avec succès !
              </p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Votre code :
              </p>
              <div style={styles.codeBox}>
                {recoveryCode.split('').map((digit, i) => (
                  <span key={i} style={styles.digit}>{digit}</span>
                ))}
              </div>
            </div>

            <div style={styles.warningBox}>
              <AlertTriangle size={15} color="#e8590c" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={styles.warningText}>
                Mémorisez bien ce code. Si vous le perdez, seul le DBA pourra vous débloquer.
              </p>
            </div>

            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                style={{ marginRight: 8, accentColor: '#3b5bdb' }}
              />
              J'ai mémorisé mon code de récupération.
            </label>

            <button
              onClick={handleConfirm}
              disabled={!confirmed}
              style={{
                ...styles.btnPrimary,
                opacity: confirmed ? 1 : 0.4,
                cursor: confirmed ? 'pointer' : 'not-allowed',
                marginTop: '1rem'
              }}
            >
              Accéder au Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: 'Segoe UI, sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  title: {
    fontSize: '1.3rem',
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
  },
  infoBox: {
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '10px',
    padding: '0.9rem 1rem',
    display: 'flex',
    gap: '0.6rem',
    marginBottom: '1.5rem',
  },
  infoText: {
    fontSize: '0.85rem',
    color: '#9a3412',
    margin: 0,
    lineHeight: 1.6,
  },
  warningBox: {
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '10px',
    padding: '0.8rem 1rem',
    display: 'flex',
    gap: '0.6rem',
    margin: '1.2rem 0',
  },
  warningText: {
    fontSize: '0.82rem',
    color: '#9a3412',
    margin: 0,
    lineHeight: 1.5,
  },
  codeBox: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    margin: '0.8rem 0',
  },
  digit: {
    width: 48,
    height: 56,
    background: '#f1f5f9',
    border: '1.5px solid #cbd5e1',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.75rem',
    background: '#3b5bdb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: '0.85rem',
    color: '#475569',
    cursor: 'pointer',
    lineHeight: 1.5,
  },
  error: {
    color: '#dc2626',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
};
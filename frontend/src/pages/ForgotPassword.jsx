import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem 2.2rem', width: '100%', maxWidth: '440px', border: '0.5px solid #e2e8f0' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <img
            src="/logo_mitech.png"
            alt="Mitech Tunisie"
            style={{ height: '70px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Icône */}
        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '1rem' }}>🔑</div>

        {/* Titre */}
        <p style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
          Mot de passe oublié ?
        </p>
        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '2rem', textAlign: 'center' }}>
          Contactez l'administrateur pour réinitialiser votre mot de passe
        </p>

        {/* Card contact */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              ✉️
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '2px' }}>Email administrateur</div>
              <a href="mailto:admin@mitech.tn" style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                admin@mitech.tn
              </a>
            </div>
          </div>

          {/* Téléphone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              📞
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '2px' }}>Téléphone administrateur</div>
              <a href="tel:+21600000000" style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                +216 XX XXX XXX
              </a>
            </div>
          </div>

        </div>

        {/* Info box */}
        <div style={{ background: '#eff6ff', border: '0.5px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>ℹ️</span>
          <p style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '500', margin: 0 }}>
            L'administrateur vous enverra un nouveau mot de passe par email dans les plus brefs délais.
          </p>
        </div>

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%', padding: '14px',
            background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.2s'
          }}>
          ← Retour au login
        </button>

      </div>
    </div>
  );
};

export default ForgotPassword;
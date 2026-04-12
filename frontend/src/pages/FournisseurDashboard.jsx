// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FournisseurDashboard.jsx — Espace Fournisseur
// El page eli ychoufha fournisseur ba3d ma ydhol
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// useAuth → njibou user (nom, prenom) w logout()
import { useAuth } from '../context/AuthContext';

// useNavigate → bech nredirectiw lel /login ba3d logout
import { useNavigate } from 'react-router-dom';

const FournisseurDashboard = () => {

  // Njibou user w logout men AuthContext
  const { user, logout } = useAuth();

  // navigate = GPS mte3 el app
  const navigate = useNavigate();

  // handleLogout — ki fournisseur yclicki "Déconnexion"
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    // El container — full screen
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>

      {/* ── NAVBAR ── */}
      {/* background safra → couleur mte3 fournisseur */}
      <nav style={{
        background: '#d97706',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>

        {/* Yassar — Logo + titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo_mitech.png"
            alt="Mitech"
            style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            onError={e => e.target.style.display = 'none'}
          />
          <span style={{ color: 'white', fontSize: 13 }}>Espace Fournisseur</span>
        </div>

        {/* Yamin — Nom + bouton déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
            👤 {user?.prenom} {user?.nom}
          </span>
          <button
            onClick={handleLogout}
            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{ padding: '40px 32px' }}>

        {/* Titre */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
          Espace Fournisseur 👋
        </h1>

        {/* Sous-titre */}
        <p style={{ color: '#64748b', marginBottom: 32 }}>
          Bienvenue {user?.prenom} — Gestion des commandes disponible dans le Sprint 4.
        </p>

        {/* Stats cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 40
        }}>
          {[
            { label: 'Mes Commandes',   val: '—', color: '#d97706', icon: '📦' },
            { label: 'Factures',        val: '—', color: '#3b82f6', icon: '🧾' },
            { label: 'Payées',          val: '—', color: '#10b981', icon: '✅' },
            { label: 'En attente',      val: '—', color: '#ef4444', icon: '⏳' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'white',
              borderRadius: 14,
              padding: '24px 20px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: '8px 0 4px' }}>
                {s.val}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 12,
          padding: '20px 24px'
        }}>
          <p style={{ color: '#b45309', fontSize: 14, fontWeight: 500, margin: 0 }}>
            ℹ️ Suivi des factures et paiements disponible dans le Sprint 4.
          </p>
        </div>

      </div>
    </div>
  );
};

export default FournisseurDashboard;
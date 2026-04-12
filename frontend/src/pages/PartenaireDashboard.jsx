// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PartenaireDashboard.jsx — Espace Partenaire
// El page eli ychoufha partenaire ba3d ma ydhol
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// useAuth → njibou user (nom, prenom) w logout()
// Bidounha → dashboard mch ta3raf shkoun connecté
import { useAuth } from '../context/AuthContext';

// useNavigate → bech nredirectiw lel /login ba3d logout
// Bidounha → ba3d logout mch yro7 lel login automatiquement
import { useNavigate } from 'react-router-dom';

const PartenaireDashboard = () => {

  // Njibou user w logout men AuthContext (el khzana)
  // user   = { nom, prenom, role, email... }
  // logout = fonction bech tamsah token w tredirect
  const { user, logout } = useAuth();

  // navigate = GPS mte3 el app
  // testa3mlou bech troddi lel /login ba3d logout
  const navigate = useNavigate();

  // handleLogout — ki partenaire yclicki "Déconnexion"
  // await → stanna 7atta logout ykaml (async operation)
  // logout() → yamsah token men DB w localStorage
  // navigate('/login') → yredirect lel login page
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    // El container el kbir
    // minHeight: 100vh → full screen dima même ki content 9sir
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>

      {/* ── NAVBAR ── */}
      {/* background violet → couleur mte3 partenaire */}
      <nav style={{
        background: '#9333ea',            // violet — couleur partenaire
        padding: '16px 32px',
        display: 'flex',                  // yassar w yamin janb b janb
        justifyContent: 'space-between',  // yassar: logo | yamin: nom+bouton
        alignItems: 'center'              // centré verticalement
      }}>

        {/* Yassar — Logo + "Espace Partenaire" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo_mitech.png"
            alt="Mitech"
            style={{
              height: 36,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)' // ybayyed el logo 3al fond violet
            }}
            onError={e => e.target.style.display = 'none'} // ki mch mawjoud → na7iw
          />
          <span style={{ color: 'white', fontSize: 13 }}>Espace Partenaire</span>
        </div>

        {/* Yamin — Nom partenaire + bouton déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* user?.prenom → "?" = optional chaining */}
          {/* Ki user null → mch yaamel erreur */}
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
            👤 {user?.prenom} {user?.nom}
          </span>

          {/* Bouton déconnexion → yclicki → handleLogout */}
          <button
            onClick={handleLogout}
            style={{
              background: '#ef4444',  // rouge — couleur déconnexion
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{ padding: '40px 32px' }}>

        {/* Titre el page */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
          Espace Partenaire 👋
        </h1>

        {/* Sous-titre ma3 nom el partenaire */}
        {/* user?.prenom → yakhoudh prenom men el token */}
        <p style={{ color: '#64748b', marginBottom: 32 }}>
          Bienvenue {user?.prenom} — Accès aux documents disponible dans le Sprint 5.
        </p>

        {/* ── STATS CARDS ── */}
        {/* Ba3d Sprint 5 besh nzidou data réelle men el DB */}
        {/* .map() → yaaml card lkol élément fil lista automatiquement */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          // repeat(auto-fit) → yetqassem automatiquement selon el screen
          // minmax(200px, 1fr) → min 200px, max el ba9i
          gap: 20,
          marginBottom: 40
        }}>
          {[
            { label: 'Documents',       val: '—', color: '#9333ea', icon: '📁' },
            { label: 'KPIs',            val: '—', color: '#3b82f6', icon: '📊' },
            { label: 'Projets liés',    val: '—', color: '#10b981', icon: '🤝' },
            { label: 'Notifications',   val: '—', color: '#f59e0b', icon: '🔔' },
          ].map(s => (
            // key={s.label} → React y7taj key unique lkol élément fil map
            <div key={s.label} style={{
              background: 'white',
              borderRadius: 14,
              padding: '24px 20px',
              border: '1px solid #e2e8f0'
            }}>
              {/* Icon */}
              <div style={{ fontSize: 28 }}>{s.icon}</div>

              {/* Valeur — "—" taw, Sprint 5 besh yiji el 3adad réel */}
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: '8px 0 4px' }}>
                {s.val}
              </div>

              {/* Label */}
              <div style={{ fontSize: 13, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── INFO BOX ── */}
        {/* Message lil jury: Sprint 5 besh yiji el data réelle */}
        <div style={{
          background: '#fdf4ff',        // violet feteh
          border: '1px solid #e9d5ff',  // border violet
          borderRadius: 12,
          padding: '20px 24px'
        }}>
          <p style={{ color: '#7e22ce', fontSize: 14, fontWeight: 500, margin: 0 }}>
            ℹ️ Accès aux documents techniques et KPIs départementaux disponible dans le Sprint 5.
          </p>
        </div>

      </div>
    </div>
  );
};

// Export — bech App.jsx ynajem y3ddiha lel route /partenaire
export default PartenaireDashboard;
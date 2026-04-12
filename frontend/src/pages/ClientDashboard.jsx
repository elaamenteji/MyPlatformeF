// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ClientDashboard.jsx — Espace Client
// El page eli ychoufha client ba3d ma ydhol
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. useAuth → njibou user (nom, prenom) w logout()
//    Bidounha → dashboard mch ta3raf shkoun connecté
import { useAuth } from '../context/AuthContext';

// 2. useNavigate → bech nredirectiw lel /login ba3d logout
//    Bidounha → ba3d logout mch yro7 lel login automatiquement
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {

  // 3. Njibou user w logout men AuthContext
  //    user   = { nom, prenom, role, email... }
  //    logout = fonction bech tamsah token w tredirect
  const { user, logout } = useAuth();

  // 4. navigate = GPS mte3 el app
  const navigate = useNavigate();

  // 5. handleLogout — ki client yclicki "Déconnexion"
  //    await → stanna 7atta logout ykaml (async)
  //    logout() → yamsah token men DB w localStorage
  //    navigate('/login') → yredirect lel login
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    // 6. El container — minHeight: 100vh → full screen dima
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>

      {/* ── 7. NAVBAR ── */}
      {/* background akhdar → couleur mte3 client */}
      <nav style={{
        background: '#16a34a',            // akhdar — couleur client
        padding: '16px 32px',
        display: 'flex',                  // janb b janb
        justifyContent: 'space-between',  // yassar w yamin
        alignItems: 'center'              // centré verticalement
      }}>

        {/* Yassar — Logo + "Espace Client" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo_mitech.png"
            alt="Mitech"
            style={{
              height: 36,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)' // ybayyed el logo 3al fond akhdar
            }}
            onError={e => e.target.style.display = 'none'} // ki mch mawjoud → na7iw
          />
          <span style={{ color: 'white', fontSize: 13 }}>Espace Client</span>
        </div>

        {/* Yamin — Nom client + bouton déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* user?.prenom → "?" = ki user null mch yaamel erreur (optional chaining) */}
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
            👤 {user?.prenom} {user?.nom}
          </span>

          <button
            onClick={handleLogout} // ki yclicki → handleLogout yebda ykhdem
            style={{
              background: '#ef4444', // rouge — couleur déconnexion
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',     // curseur yetbaddel lel main ki tfouq 3liha
              fontSize: 13,
              fontWeight: 600
            }}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ── 8. CONTENT ── */}
      <div style={{ padding: '40px 32px' }}>

        {/* Titre el page */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
          Espace Client 👋
        </h1>

        {/* Sous-titre ma3 nom el client */}
        {/* user?.prenom → yakhoudh prenom men el token */}
        <p style={{ color: '#64748b', marginBottom: 32 }}>
          Bienvenue {user?.prenom} — Suivi de vos projets disponible dans le Sprint 3.
        </p>

        {/* ── 9. CARDS PROJETS ── */}
        {/* Ba3d Sprint 3 besh nzidou projets réels men el DB */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          // repeat(auto-fit) → yetqassem automatiquement
          gap: 20,
          marginBottom: 40
        }}>
          {[
            { label: 'Mes Projets',      val: '—', color: '#3b82f6', icon: '🏗️' },
            { label: 'En cours',         val: '—', color: '#f59e0b', icon: '⚙️' },
            { label: 'Terminés',         val: '—', color: '#10b981', icon: '✅' },
            { label: 'Notifications',    val: '—', color: '#9333ea', icon: '🔔' },
          ].map(s => (
            // .map() → yaaml card lkol élément — mch nktbou 4 cards manuellement
            <div key={s.label} style={{
              background: 'white',
              borderRadius: 14,
              padding: '24px 20px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: '8px 0 4px' }}>
                {s.val} {/* "—" taw — Sprint 3 besh yiji el 3adad réel */}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── 10. INFO BOX ── */}
        {/* Message lil jury: Sprint 3 besh yiji el data réelle */}
        <div style={{
          background: '#f0fdf4',        // akhdar feteh
          border: '1px solid #bbf7d0',  // border akhdar
          borderRadius: 12,
          padding: '20px 24px'
        }}>
          <p style={{ color: '#15803d', fontSize: 14, fontWeight: 500, margin: 0 }}>
            ℹ️ Interface de suivi des projets et chantiers disponible dans le Sprint 3.
          </p>
        </div>

      </div>
    </div>
  );
};

// 11. Export — bech App.jsx ynajem y3ddiha lel route /client
export default ClientDashboard;
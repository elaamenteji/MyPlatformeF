import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileSection from '../components/ProfileSection';
import NotificationBell from '../components/NotificationBell';
import {
  LayoutDashboard, FolderKanban, FileText,
  BarChart2, UserCircle, LogOut,
  Download, Building2,
} from 'lucide-react';

const API = 'http://localhost:5000';

const P = {
  teal:     '#00A09D', tealBg:   '#E6F7F7', tealBd:   '#99DDD9',
  green:    '#17A84A', greenBg:  '#E8F7EE', greenBd:  '#8DD5A8',
  amber:    '#F59E0B', amberBg:  '#FEF3C7', amberBd:  '#FCD34D',
  red:      '#E8454A', redBg:    '#FDECEC', redBd:    '#F9A8A8',
  indigo:   '#6366F1', indigoBg: '#EEF2FF', indigoBd: '#C7D2FE',
  purple:   '#8B5CF6', purpleBg: '#F5F3FF', purpleBd: '#DDD6FE',
};

const T = {
  bg: '#f1f5f9', surface: '#ffffff', border: '#e2e8f0', borderXs: '#f1f5f9',
  txt: '#0f172a', txtMid: '#475569', txtMute: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initiales = (nom, prenom) => ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();

const STATUS_CFG = {
  on_track:  { label: 'En cours',  color: P.teal,  bg: P.tealBg,  border: P.tealBd  },
  at_risk:   { label: 'À risque',  color: P.amber, bg: P.amberBg, border: P.amberBd },
  off_track: { label: 'En retard', color: P.red,   bg: P.redBg,   border: P.redBd   },
  done:      { label: 'Terminé',   color: P.green, bg: P.greenBg, border: P.greenBd },
};

const TYPE_CFG = {
  plan:      { label: 'Plan',      color: P.indigo, bg: P.indigoBg, border: P.indigoBd },
  rapport:   { label: 'Rapport',   color: P.teal,   bg: P.tealBg,   border: P.tealBd   },
  technique: { label: 'Technique', color: P.purple, bg: P.purpleBg, border: P.purpleBd },
  autre:     { label: 'Autre',     color: P.amber,  bg: P.amberBg,  border: P.amberBd  },
};

const DEPT_COLORS = {
  Production: { color: P.teal,   bg: P.tealBg   },
  Commercial: { color: P.indigo, bg: P.indigoBg },
  RH:         { color: P.green,  bg: P.greenBg  },
  Logistique: { color: P.amber,  bg: P.amberBg  },
};

const Badge = ({ config }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 9px', borderRadius: 20,
    fontSize: 10, fontWeight: 600,
    background: config.bg, color: config.color,
    border: `1px solid ${config.border}`,
  }}>{config.label}</span>
);

// ── KPIs Page ──────────────────────────────────────────────────
const KpisPage = ({ token }) => {
  const [kpis,     setKpis]     = useState({});
  const [periodes, setPeriodes] = useState([]);
  const [periode,  setPeriode]  = useState('2026-04');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/partenaire/kpis/periodes`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setPeriodes(r.data.data || [])).catch(() => {});
  }, [token]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/partenaire/kpis?periode=${periode}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setKpis(r.data.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, [periode, token]);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: T.txtMute, fontSize: 13 }}>Chargement…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.txtMid }}>Période :</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {periodes.map(p => (
            <button key={p} onClick={() => setPeriode(p)} style={{
              padding: '5px 14px', fontSize: 12, fontWeight: periode === p ? 600 : 400,
              border: `1px solid ${periode === p ? P.teal : T.border}`,
              borderRadius: 20, cursor: 'pointer',
              background: periode === p ? P.tealBg : T.surface,
              color: periode === p ? P.teal : T.txtMid,
            }}>{p}</button>
          ))}
        </div>
      </div>

      {Object.keys(kpis).length === 0
        ? <div style={{ textAlign: 'center', padding: '60px 0', color: T.txtMute, fontSize: 13 }}>Aucun KPI pour cette période.</div>
        : Object.entries(kpis).map(([dept, items]) => {
          const dc = DEPT_COLORS[dept] || { color: P.indigo, bg: P.indigoBg };
          return (
            <div key={dept} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '4px 14px', borderRadius: 20,
                background: dc.bg, color: dc.color,
                fontSize: 12, fontWeight: 700, marginBottom: 10,
              }}>
                <Building2 size={13} /> {dept}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {items.map(kpi => (
                  <div key={kpi.id} style={{
                    background: T.surface, borderRadius: 12,
                    border: `1px solid ${T.border}`, padding: '16px 18px',
                    boxShadow: T.shadow,
                  }}>
                    <div style={{ fontSize: 11.5, color: T.txtMute, marginBottom: 8 }}>{kpi.indicateur}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 26, fontWeight: 700, color: dc.color }}>
                        {parseFloat(kpi.valeur).toLocaleString('fr-TN')}
                      </span>
                      <span style={{ fontSize: 12, color: T.txtMute }}>{kpi.unite}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      }
    </div>
  );
};

// ── Documents Page ─────────────────────────────────────────────
const DocumentsPage = ({ token }) => {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre,  setFiltre]  = useState('tous');

  useEffect(() => {
    axios.get(`${API}/api/partenaire/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setDocs(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const filtered = filtre === 'tous' ? docs : docs.filter(d => d.type_doc === filtre);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: T.txtMute, fontSize: 13 }}>Chargement…</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {['tous', 'plan', 'rapport', 'technique', 'autre'].map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: '5px 14px', fontSize: 12,
            fontWeight: filtre === f ? 600 : 400,
            border: `1px solid ${filtre === f ? P.teal : T.border}`,
            borderRadius: 20, cursor: 'pointer',
            background: filtre === f ? P.tealBg : T.surface,
            color: filtre === f ? P.teal : T.txtMid,
          }}>
            {f === 'tous' ? 'Tous' : TYPE_CFG[f]?.label || f}
            <span style={{ opacity: 0.6, marginLeft: 4 }}>
              ({f === 'tous' ? docs.length : docs.filter(d => d.type_doc === f).length})
            </span>
          </button>
        ))}
      </div>

      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}` }}>
          {['DOCUMENT', 'TYPE', 'PROJET', 'DATE', 'ACTION'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>{h}</span>
          ))}
        </div>
        {filtered.length === 0
          ? <div style={{ padding: '36px', textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucun document.</div>
          : filtered.map(doc => (
            <div key={doc.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>{doc.titre}</div>
                {doc.description && <div style={{ fontSize: 10, color: T.txtMute, marginTop: 1 }}>{doc.description}</div>}
              </div>
              <Badge config={TYPE_CFG[doc.type_doc] || TYPE_CFG.autre} />
              <div style={{ fontSize: 11, color: T.txtMid }}>{doc.projet_name || '—'}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{fmtDate(doc.created_at)}</div>
              <a href={`${API}${doc.fichier_url}`} target="_blank" rel="noreferrer"
                style={{ padding: '4px 10px', borderRadius: 7, border: `0.5px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: P.teal, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Download size={11} /> Télécharger
              </a>
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ── Projets Page ───────────────────────────────────────────────
const ProjetsPage = ({ token }) => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/partenaire/mes-projets`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setProjets(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: T.txtMute, fontSize: 13 }}>Chargement…</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total projets', value: projets.length,                                                    color: P.teal,  bg: P.tealBg,  bd: P.tealBd  },
          { label: 'En cours',      value: projets.filter(p => p.last_update_status === 'on_track').length,   color: P.green, bg: P.greenBg, bd: P.greenBd },
          { label: 'À risque',      value: projets.filter(p => p.last_update_status === 'at_risk').length,    color: P.amber, bg: P.amberBg, bd: P.amberBd },
        ].map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${c.bd}`, boxShadow: T.shadow }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}` }}>
          {['PROJET', 'RÔLE', 'DÉBUT', 'FIN', 'STATUT'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>{h}</span>
          ))}
        </div>
        {projets.length === 0
          ? <div style={{ padding: '36px', textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucun projet associé.</div>
          : projets.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 10, color: T.txtMute, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{p.description}</div>}
              </div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{p.role_projet || '—'}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{fmtDate(p.date_start)}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{fmtDate(p.date_fin)}</div>
              <Badge config={STATUS_CFG[p.last_update_status] || STATUS_CFG.on_track} />
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN PartenaireDashboard
// ══════════════════════════════════════════════════════════════
const PartenaireDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [kpisSnap,   setKpisSnap]   = useState({});
  const [docsCount,  setDocsCount]  = useState(0);
  const [projCount,  setProjCount]  = useState(0);

  useEffect(() => {
    axios.get(`${API}/api/partenaire/kpis?periode=2026-04`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setKpisSnap(r.data.data || {})).catch(() => {});
    axios.get(`${API}/api/partenaire/documents`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setDocsCount((r.data.data || []).length)).catch(() => {});
    axios.get(`${API}/api/partenaire/mes-projets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setProjCount((r.data.data || []).length)).catch(() => {});
  }, [token]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={15} /> },
    { id: 'projets',   label: 'Mes Projets',     icon: <FolderKanban size={15} />    },
    { id: 'documents', label: 'Documents',        icon: <FileText size={15} />       },
    { id: 'kpis',      label: 'KPIs',             icon: <BarChart2 size={15} />      },
    { id: 'profil',    label: 'Mon Profil',        icon: <UserCircle size={15} />    },
  ];

  const pageTitle = {
    dashboard: 'Tableau de bord',
    projets:   'Mes Projets',
    documents: 'Documents Techniques',
    kpis:      'KPIs Départementaux',
    profil:    'Mon Profil',
  };

  const allKpis = Object.values(kpisSnap).flat().slice(0, 6);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: T.bg }}>

      {/* ━━ Sidebar ━━ */}
      <div style={{ width: 230, background: T.surface, borderRight: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px', borderBottom: `0.5px solid ${T.borderXs}` }}>
          <img src="/logo_mitech.png" style={{ height: 58, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} alt="Mitech" />
        </div>
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActivePage(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 11px', borderRadius: 9, cursor: 'pointer', marginBottom: 2,
              fontSize: 12.5, transition: 'all 0.15s',
              color: activePage === item.id ? P.indigo : T.txtMid,
              fontWeight: activePage === item.id ? 700 : 500,
              background: activePage === item.id ? P.indigoBg : 'transparent',
            }}>
              {item.icon} {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '14px', borderTop: `0.5px solid ${T.borderXs}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: P.indigoBg, color: P.indigo, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initiales(user?.nom, user?.prenom)}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>{user?.prenom} {user?.nom}</div>
              <div style={{ fontSize: 10, color: T.txtMute }}>Partenaire</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ━━ Main ━━ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: T.surface, padding: '13px 26px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.txt }}>{pageTitle[activePage]}</div>
          <NotificationBell />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '22px 26px' }}>

          {activePage === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Projets associés', value: projCount,                    color: P.indigo, bg: P.indigoBg, bd: P.indigoBd, icon: <FolderKanban size={18} color={P.indigo} /> },
                  { label: 'Documents',         value: docsCount,                   color: P.teal,   bg: P.tealBg,   bd: P.tealBd,   icon: <FileText size={18} color={P.teal} /> },
                  { label: 'Depts. KPI',         value: Object.keys(kpisSnap).length, color: P.purple, bg: P.purpleBg, bd: P.purpleBd, icon: <BarChart2 size={18} color={P.purple} /> },
                ].map((c, i) => (
                  <div key={i} style={{ background: c.bg, borderRadius: 14, padding: '18px', border: `1px solid ${c.bd}`, boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{c.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {allKpis.length > 0 && (
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
                  <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 13, fontWeight: 700, color: T.txt }}>
                    KPIs — Avril 2026
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {allKpis.map((kpi, i) => {
                      const dc = DEPT_COLORS[kpi.departement] || { color: P.indigo, bg: P.indigoBg };
                      return (
                        <div key={kpi.id} style={{
                          padding: '14px 20px',
                          borderRight: i % 3 !== 2 ? `0.5px solid ${T.borderXs}` : 'none',
                          borderBottom: i < 3 ? `0.5px solid ${T.borderXs}` : 'none',
                        }}>
                          <div style={{ fontSize: 10, color: T.txtMute, marginBottom: 4 }}>{kpi.departement} · {kpi.indicateur}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: dc.color }}>
                            {parseFloat(kpi.valeur).toLocaleString('fr-TN')}
                            <span style={{ fontSize: 11, fontWeight: 400, color: T.txtMute, marginLeft: 4 }}>{kpi.unite}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {activePage === 'projets'   && <ProjetsPage token={token} />}
          {activePage === 'documents' && <DocumentsPage token={token} />}
          {activePage === 'kpis'      && <KpisPage token={token} />}
          {activePage === 'profil'    && <ProfileSection accentColor={P.indigo} />}
        </div>
      </div>
    </div>
  );
};

export default PartenaireDashboard;
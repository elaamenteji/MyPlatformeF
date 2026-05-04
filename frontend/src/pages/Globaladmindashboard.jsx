import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ── Palette partagée ──────────────────────────────────────────
const T = {
  blue:     '#3b5bdb',
  indigo:   '#7048e8',
  sky:      '#4dabf7',
  navy:     '#1c3fa8',
  bg:       '#f1f5f9',
  surface:  '#ffffff',
  border:   '#e2e8f0',
  borderXs: '#f1f5f9',
  txt:      '#0f172a',
  txtMid:   '#475569',
  txtMute:  '#94a3b8',
  green:    '#16a34a',
  greenBg:  '#f0fdf4',
  greenBd:  '#bbf7d0',
  amber:    '#d97706',
  amberBg:  '#fffbeb',
  amberBd:  '#fde68a',
  red:      '#ef4444',
  redBg:    '#fef2f2',
  redBd:    '#fecaca',
  teal:     '#0d9488',
  tealBg:   '#f0fdfa',
  tealBd:   '#99f6e4',
  purple:   '#7c3aed',
  purpleBg: '#f5f3ff',
  purpleBd: '#ddd6fe',
  shadow:   '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
};

const CHART_COLORS  = [T.blue, T.indigo, T.sky, T.navy];
const AVATAR_COLORS = [T.blue, T.indigo, T.sky, T.navy, '#0369a1', '#7c3aed'];

// ── Helpers ───────────────────────────────────────────────────
const initiales = (nom, prenom) =>
  ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('fr-TN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-TN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—';

// ── Pills ────────────────────────────────────────────────────
const StatutPill = ({ statut }) => {
  const map = {
    actif:   { bg: T.greenBg, color: T.green },
    inactif: { bg: T.amberBg, color: T.amber },
    bloque:  { bg: T.redBg,   color: T.red   },
    bloqué:  { bg: T.redBg,   color: T.red   },
  };
  const s = map[statut] || map.inactif;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color }}>
      {statut}
    </span>
  );
};

const ROLE_CONFIG = {
  admin:       { bg: '#eef2ff', color: T.blue,    label: 'Admin'       },
  client:      { bg: '#eef2ff', color: T.blue,    label: 'Client'      },
  fournisseur: { bg: '#f5f3ff', color: T.indigo,  label: 'Fournisseur' },
  partenaire:  { bg: '#e0f2fe', color: '#0369a1', label: 'Partenaire'  },
};

const RolePill = ({ role }) => {
  const rc = ROLE_CONFIG[role] || { bg: '#f1f5f9', color: T.txtMid, label: role };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color }}>
      {rc.label}
    </span>
  );
};

const PROJECT_STATUS = {
  on_track:  { label: 'En cours',  color: T.teal,  bg: T.tealBg,  bd: T.tealBd  },
  at_risk:   { label: 'À risque',  color: T.amber, bg: T.amberBg, bd: T.amberBd },
  off_track: { label: 'En retard', color: T.red,   bg: T.redBg,   bd: T.redBd   },
  done:      { label: 'Terminé',   color: T.green, bg: T.greenBg, bd: T.greenBd },
};

const ProjectBadge = ({ status }) => {
  const s = PROJECT_STATUS[status] || PROJECT_STATUS.on_track;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.bd}` }}>
      {s.label}
    </span>
  );
};

// ── KPI Card ─────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, bg, border, icon }) => (
  <div style={{ background: bg, borderRadius: 14, padding: '18px 18px 16px', boxShadow: T.shadow, border }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: T.shadow }}>
      {icon}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 3, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11.5, fontWeight: 600, color, opacity: 0.85, marginBottom: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color, opacity: 0.6 }}>{sub}</div>}
  </div>
);

// ── Mini progress bar ─────────────────────────────────────────
const MiniBar = ({ done, total }) => {
  const pct = total > 0 ? Math.round((parseInt(done) / parseInt(total)) * 100) : 0;
  const color = pct === 100 ? T.green : pct >= 60 ? T.teal : pct >= 30 ? T.amber : T.red;
  return (
    <div style={{ width: 90 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.txtMute, marginBottom: 3 }}>
        <span>{done}/{total}</span>
        <span style={{ fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: T.border, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
};

// ── Section header ────────────────────────────────────────────
const SectionHeader = ({ icon, title, badge, badgeColor = T.blue }) => (
  <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${T.borderXs}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>{title}</span>
    </div>
    {badge !== undefined && (
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#eef2ff', color: badgeColor }}>
        {badge}
      </span>
    )}
  </div>
);

// ── SVG Icons ─────────────────────────────────────────────────
const IconUsers  = ({ color = T.blue,  size = 18 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCheck  = ({ color = T.green, size = 18 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconAlert  = ({ color = T.amber, size = 18 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconBan    = ({ color = T.red,   size = 18 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IconProjet = ({ color = T.teal,  size = 18 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconCmd    = ({ color = T.blue,  size = 18 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconFac    = ({ color = T.green, size = 18 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconTrend  = ({ color = T.teal,  size = 14 }) => <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — Stats Utilisateurs + Charts
// ═══════════════════════════════════════════════════════════════
const StatsUsersSection = ({ stats, users }) => {
  const donutRef   = useRef(null);
  const barRef     = useRef(null);
  const donutChart = useRef(null);
  const barChart   = useRef(null);

  useEffect(() => {
    if (!stats) return;

    const buildCharts = () => {
      if (!window.Chart) return;
      window.Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";

      if (donutRef.current) {
        donutChart.current?.destroy();
        donutChart.current = new window.Chart(donutRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Clients', 'Fournisseurs', 'Partenaires', 'Admins'],
            datasets: [{
              data: [
                parseInt(stats.clients      || 0),
                parseInt(stats.fournisseurs || 0),
                parseInt(stats.partenaires  || 0),
                parseInt(stats.admins       || 0),
              ],
              backgroundColor: CHART_COLORS,
              borderWidth: 0,
              hoverOffset: 5,
            }],
          },
          options: {
            cutout: '72%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
          },
        });
      }

      if (barRef.current) {
        barChart.current?.destroy();
        barChart.current = new window.Chart(barRef.current, {
          type: 'bar',
          data: {
            labels: ['Actifs', 'Inactifs', 'Bloqués'],
            datasets: [{
              label: 'Utilisateurs',
              data: [
                parseInt(stats.actifs   || 0),
                parseInt(stats.inactifs || 0),
                parseInt(stats.bloques  || 0),
              ],
              backgroundColor: [T.green, T.amber, T.red],
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 46,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 }, color: T.txtMute }, grid: { color: '#f1f5f9' }, border: { dash: [4, 4], color: 'transparent' } },
              x: { grid: { display: false }, ticks: { font: { size: 11 }, color: T.txtMid } },
            },
          },
        });
      }
    };

    if (!window.Chart) {
      const sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      sc.onload = buildCharts;
      document.head.appendChild(sc);
    } else {
      buildCharts();
    }

    return () => { donutChart.current?.destroy(); barChart.current?.destroy(); };
  }, [stats]);

  if (!stats) return null;

  const statCards = [
    { label: 'Total Utilisateurs', value: stats.total,    color: T.blue,  bg: '#eef2ff', border: `1.5px solid ${T.blue}33`,  icon: <IconUsers color={T.blue}  size={18} /> },
    { label: 'Comptes Actifs',     value: stats.actifs,   color: T.green, bg: T.greenBg, border: `1.5px solid ${T.green}33`, icon: <IconCheck color={T.green} size={18} /> },
    { label: 'Comptes Inactifs',   value: stats.inactifs, color: T.amber, bg: T.amberBg, border: `1.5px solid ${T.amber}33`, icon: <IconAlert color={T.amber} size={18} /> },
    { label: 'Comptes Bloqués',    value: stats.bloques,  color: T.red,   bg: T.redBg,   border: `1.5px solid ${T.red}33`,   icon: <IconBan   color={T.red}   size={18} /> },
  ];

  return (
    <>
      {/* KPI Users */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
        {statCards.map((c, i) => <KpiCard key={i} {...c} />)}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: T.surface, borderRadius: 14, padding: '18px 22px', boxShadow: T.shadow }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 10 }}>Répartition par rôle</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            {['Clients', 'Fournisseurs', 'Partenaires', 'Admins'].map((l, i) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtMid }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: CHART_COLORS[i], display: 'inline-block' }} />
                {l} {parseInt([stats.clients, stats.fournisseurs, stats.partenaires, stats.admins][i] || 0)}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 180 }}><canvas ref={donutRef} /></div>
        </div>
        <div style={{ background: T.surface, borderRadius: 14, padding: '18px 22px', boxShadow: T.shadow }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 10 }}>Répartition par statut</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {[{ label: 'Actifs', color: T.green, val: stats.actifs }, { label: 'Inactifs', color: T.amber, val: stats.inactifs }, { label: 'Bloqués', color: T.red, val: stats.bloques }].map(({ label, color, val }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtMid }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: 'inline-block' }} />
                {label} {parseInt(val || 0)}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 180 }}><canvas ref={barRef} /></div>
        </div>
      </div>

      {/* Users récents */}
      <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow, marginBottom: 16 }}>
        <SectionHeader icon={<IconUsers color={T.blue} size={14} />} title="Utilisateurs récents" badge={`${users.length} total`} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>
          <span>UTILISATEUR</span><span>EMAIL</span><span>RÔLE</span><span>STATUT</span>
        </div>
        {users.slice(0, 5).map((u, i) => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '11px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', fontSize: 12.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {initiales(u.nom, u.prenom)}
              </div>
              <span style={{ fontWeight: 600, color: T.txt }}>{u.prenom} {u.nom}</span>
            </div>
            <div style={{ color: T.txtMid }}>{u.email}</div>
            <RolePill role={u.role} />
            <StatutPill statut={u.statut} />
          </div>
        ))}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — Supervision Projets  →  GET /api/projets
// ═══════════════════════════════════════════════════════════════
const ProjetsSection = () => {
  const [projets,  setProjets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [erreur,   setErreur]   = useState(false);

  useEffect(() => {
    axios.get('/api/projets')
      .then(({ data }) => setProjets(Array.isArray(data.data) ? data.data : []))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, []);

  const total    = projets.length;
  const enCours  = projets.filter(p => p.last_update_status === 'on_track').length;
  const aRisque  = projets.filter(p => p.last_update_status === 'at_risk').length;
  const enRetard = projets.filter(p => p.last_update_status === 'off_track').length;

  const totalTaches = projets.reduce((s, p) => s + parseInt(p.total_tasks || 0), 0);
  const tachesDone  = projets.reduce((s, p) => s + parseInt(p.done_tasks  || 0), 0);
  const pctGlobal   = totalTaches > 0 ? Math.round((tachesDone / totalTaches) * 100) : 0;

  const kpis = [
    { label: 'Total projets', value: total,    color: T.teal,  bg: T.tealBg,  border: `1px solid ${T.tealBd}`,  icon: <IconProjet color={T.teal}  size={18} />, sub: 'Tous clients'      },
    { label: 'En cours',      value: enCours,  color: T.green, bg: T.greenBg, border: `1px solid ${T.greenBd}`, icon: <IconCheck  color={T.green} size={18} />, sub: 'On track'          },
    { label: 'À risque',      value: aRisque,  color: T.amber, bg: T.amberBg, border: `1px solid ${T.amberBd}`, icon: <IconAlert  color={T.amber} size={18} />, sub: 'Attention requise' },
    { label: 'En retard',     value: enRetard, color: T.red,   bg: T.redBg,   border: `1px solid ${T.redBd}`,   icon: <IconBan    color={T.red}   size={18} />, sub: 'Off track'         },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Titre section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: T.teal }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>Supervision — Projets</span>
        <span style={{ fontSize: 10, color: T.txtMute, marginLeft: 2 }}>(tous les clients)</span>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Chargement…</div>
      ) : erreur ? (
        <div style={{ padding: 20, background: T.redBg, borderRadius: 12, color: T.red, fontSize: 12, textAlign: 'center' }}>
          Impossible de charger les projets — vérifier la route <code>/api/projets</code>.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 12 }}>
            {kpis.map((c, i) => <KpiCard key={i} {...c} />)}
          </div>

          {/* Barre avancement global */}
          <div style={{ background: T.surface, borderRadius: 14, padding: '14px 20px', boxShadow: T.shadow, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconTrend color={T.teal} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>Avancement global des tâches</span>
              </div>
              <span style={{ fontSize: 11, color: T.txtMute }}>{tachesDone}/{totalTaches} terminées</span>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: T.bg, overflow: 'hidden', marginBottom: 6, border: `1px solid ${T.border}` }}>
              <div style={{ width: `${pctGlobal}%`, height: '100%', background: `linear-gradient(90deg, ${T.teal}, ${T.green})`, borderRadius: 8, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.txtMute }}>
              <span>0%</span>
              <span style={{ color: T.teal, fontWeight: 600 }}>{pctGlobal}% complété</span>
              <span>100%</span>
            </div>
          </div>

          {/* Table projets */}
          <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
            <SectionHeader icon={<IconProjet color={T.teal} size={14} />} title="Liste des projets" badge={`${total} projets`} badgeColor={T.teal} />
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1.2fr 90px', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>
              <span>PROJET</span><span>CLIENT</span><span>DÉBUT</span><span>FIN</span><span>AVANCEMENT</span><span>STATUT</span>
            </div>
            {projets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucun projet.</div>
            ) : projets.map((p) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1.2fr 90px', padding: '12px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: T.txt, marginBottom: 2 }}>
                    {p.priority === '1' && <span style={{ color: T.amber, marginRight: 4 }}>★</span>}
                    {p.name}
                  </div>
                  <div style={{ fontSize: 10, color: T.txtMute }}>{parseInt(p.done_tasks || 0)}/{parseInt(p.total_tasks || 0)} tâches</div>
                </div>
                <div style={{ color: T.txtMid, fontSize: 11 }}>{p.partner_name || '—'}</div>
                <div style={{ color: T.txtMute, fontSize: 11 }}>{fmtDate(p.date_start)}</div>
                <div style={{ color: T.txtMute, fontSize: 11 }}>{fmtDate(p.date)}</div>
                <MiniBar done={p.done_tasks || 0} total={p.total_tasks || 0} />
                <ProjectBadge status={p.last_update_status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — Supervision Commandes  →  GET /api/admin/commandes
// ═══════════════════════════════════════════════════════════════
const CommandesSection = () => {
  const [commandes,  setCommandes]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [available,  setAvailable]  = useState(false);

  useEffect(() => {
    axios.get('/api/admin/commandes')
      .then(({ data }) => { setCommandes(Array.isArray(data.data) ? data.data : []); setAvailable(true); })
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false));
  }, []);

  const CMD_STATE = {
    draft:    { label: 'Brouillon', color: T.txtMute, bg: T.bg      },
    sent:     { label: 'Envoyé',    color: T.blue,    bg: '#eef2ff' },
    purchase: { label: 'Confirmé',  color: T.teal,    bg: T.tealBg  },
    done:     { label: 'Terminé',   color: T.green,   bg: T.greenBg },
    cancel:   { label: 'Annulé',    color: T.red,     bg: T.redBg   },
  };

  const montantTotal = commandes.filter(c => ['purchase','done'].includes(c.state)).reduce((s,c) => s + parseFloat(c.amount_total || 0), 0);
  const nbConfirmees = commandes.filter(c => ['purchase','done'].includes(c.state)).length;
  const nbEnAttente  = commandes.filter(c => c.state === 'sent').length;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: T.blue }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>Supervision — Commandes Fournisseurs</span>
        <span style={{ fontSize: 10, color: T.txtMute, marginLeft: 2 }}>(tous les fournisseurs)</span>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Chargement…</div>
      ) : !available ? (
        <div style={{ background: T.surface, borderRadius: 14, boxShadow: T.shadow, border: `1px dashed ${T.border}`, overflow: 'hidden' }}>
          <SectionHeader icon={<IconCmd color={T.blue} size={14} />} title="Commandes fournisseurs" />
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.txtMid }}>Module Commandes — Sprint 4</div>
            <div style={{ fontSize: 11, color: T.txtMute, marginTop: 4 }}>
              Créer la route <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>GET /api/admin/commandes</code> pour activer cette section
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 12 }}>
            <KpiCard label="Total commandes"    value={commandes.length} color={T.blue}   bg="#eef2ff"   border={`1px solid ${T.blue}22`}   icon={<IconCmd   color={T.blue}   size={18} />} sub="Tous fournisseurs"   />
            <KpiCard label="Confirmées"          value={nbConfirmees}     color={T.green}  bg={T.greenBg} border={`1px solid ${T.greenBd}`}  icon={<IconCheck color={T.green}  size={18} />} sub="Purchase + Done"     />
            <KpiCard label="En attente"          value={nbEnAttente}      color={T.amber}  bg={T.amberBg} border={`1px solid ${T.amberBd}`}  icon={<IconAlert color={T.amber}  size={18} />} sub="Envoyées"           />
            <KpiCard label="Montant confirmé"    value={`${fmt(montantTotal)} TND`} color={T.indigo} bg={T.purpleBg} border={`1px solid ${T.purpleBd}`} icon={<IconTrend color={T.indigo} size={18} />} sub="Commandes validées" />
          </div>
          <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
            <SectionHeader icon={<IconCmd color={T.blue} size={14} />} title="Toutes les commandes" badge={`${commandes.length} commandes`} badgeColor={T.blue} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 90px', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>
              <span>RÉFÉRENCE</span><span>FOURNISSEUR</span><span>DATE</span><span>MONTANT</span><span>STATUT</span>
            </div>
            {commandes.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucune commande.</div>
            ) : commandes.map((c, i) => {
              const st = CMD_STATE[c.state] || CMD_STATE.draft;
              return (
                <div key={c.id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 90px', padding: '11px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: T.txt }}>{c.name}</div>
                  <div style={{ color: T.txtMid }}>{c.partner_name || '—'}</div>
                  <div style={{ color: T.txtMute, fontSize: 11 }}>{fmtDate(c.date_order)}</div>
                  <div style={{ fontWeight: 600, color: T.txt }}>{fmt(c.amount_total)} <span style={{ fontSize: 10, color: T.txtMute }}>TND</span></div>
                  <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — Supervision Factures  →  GET /api/admin/factures
// ═══════════════════════════════════════════════════════════════
const FacturesSection = () => {
  const [factures,  setFactures]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    axios.get('/api/admin/factures')
      .then(({ data }) => { setFactures(Array.isArray(data.data) ? data.data : []); setAvailable(true); })
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false));
  }, []);

  const PAY_STATE = {
    not_paid:   { label: 'Non payé', color: T.red,    bg: T.redBg    },
    in_payment: { label: 'En cours', color: T.amber,  bg: T.amberBg  },
    paid:       { label: 'Payé',     color: T.green,  bg: T.greenBg  },
    partial:    { label: 'Partiel',  color: T.amber,  bg: T.amberBg  },
    reversed:   { label: 'Extourné', color: T.purple, bg: T.purpleBg },
  };

  const totalFacture = factures.reduce((s, f) => s + parseFloat(f.amount_total    || 0), 0);
  const totalRestant = factures.reduce((s, f) => s + parseFloat(f.amount_residual || 0), 0);
  const nbPaid       = factures.filter(f => f.payment_state === 'paid').length;
  const nbEnRetard   = factures.filter(f =>
    f.invoice_date_due && new Date(f.invoice_date_due) < new Date() && f.payment_state === 'not_paid'
  ).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: T.green }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>Supervision — Factures Fournisseurs</span>
        <span style={{ fontSize: 10, color: T.txtMute, marginLeft: 2 }}>(tous les fournisseurs)</span>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Chargement…</div>
      ) : !available ? (
        <div style={{ background: T.surface, borderRadius: 14, boxShadow: T.shadow, border: `1px dashed ${T.border}`, overflow: 'hidden' }}>
          <SectionHeader icon={<IconFac color={T.green} size={14} />} title="Factures fournisseurs" />
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.txtMid }}>Module Factures — Sprint 4</div>
            <div style={{ fontSize: 11, color: T.txtMute, marginTop: 4 }}>
              Créer la route <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>GET /api/admin/factures</code> pour activer cette section
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 12 }}>
            <KpiCard label="Total facturé" value={`${fmt(totalFacture)} TND`} color={T.green}  bg={T.greenBg} border={`1px solid ${T.greenBd}`} icon={<IconFac   color={T.green} size={18} />} sub={`${factures.length} factures`} />
            <KpiCard label="Restant dû"    value={`${fmt(totalRestant)} TND`} color={totalRestant > 0 ? T.red : T.green} bg={totalRestant > 0 ? T.redBg : T.greenBg} border={`1px solid ${totalRestant > 0 ? T.redBd : T.greenBd}`} icon={<IconBan color={totalRestant > 0 ? T.red : T.green} size={18} />} sub="À régler" />
            <KpiCard label="Payées"        value={nbPaid}                     color={T.teal}   bg={T.tealBg}  border={`1px solid ${T.tealBd}`}  icon={<IconCheck color={T.teal}  size={18} />} sub="Factures soldées"     />
            <KpiCard label="En retard"     value={nbEnRetard}                 color={T.red}    bg={T.redBg}   border={`1px solid ${T.redBd}`}   icon={<IconAlert color={T.red}   size={18} />} sub="Échéance dépassée"   />
          </div>
          <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
            <SectionHeader icon={<IconFac color={T.green} size={14} />} title="Toutes les factures" badge={`${factures.length} factures`} badgeColor={T.green} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 90px', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>
              <span>FACTURE</span><span>FOURNISSEUR</span><span>DATE</span><span>ÉCHÉANCE</span><span>MONTANT</span><span>PAIEMENT</span>
            </div>
            {factures.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucune facture.</div>
            ) : factures.map((f, i) => {
              const st = PAY_STATE[f.payment_state] || PAY_STATE.not_paid;
              const isOverdue = f.invoice_date_due && new Date(f.invoice_date_due) < new Date() && f.payment_state === 'not_paid';
              return (
                <div key={f.id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 90px', padding: '11px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', fontSize: 12, background: isOverdue ? '#fff8f8' : T.surface }}>
                  <div>
                    <div style={{ fontWeight: 600, color: T.txt }}>{f.name}</div>
                    {isOverdue && <div style={{ fontSize: 10, color: T.red, marginTop: 1 }}>⚠ En retard</div>}
                  </div>
                  <div style={{ color: T.txtMid }}>{f.partner_name || '—'}</div>
                  <div style={{ color: T.txtMute, fontSize: 11 }}>{fmtDate(f.invoice_date)}</div>
                  <div style={{ color: isOverdue ? T.red : T.txtMute, fontSize: 11, fontWeight: isOverdue ? 600 : 400 }}>{fmtDate(f.invoice_date_due)}</div>
                  <div style={{ fontWeight: 600, color: T.txt }}>{fmt(f.amount_total)} <span style={{ fontSize: 10, color: T.txtMute }}>TND</span></div>
                  <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// Usage dans AdminDashboard.jsx :
//   import GlobalAdminDashboard from './GlobalAdminDashboard';
//   {activePage === 'dashboard' && <GlobalAdminDashboard stats={stats} users={users} />}
// ═══════════════════════════════════════════════════════════════
export default function GlobalAdminDashboard({ stats, users = [] }) {
  return (
    <div>
      {/* Section 1 — Utilisateurs */}
      <StatsUsersSection stats={stats} users={users} />

      {/* Séparateur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontSize: 11, color: T.txtMute, fontWeight: 600, letterSpacing: '0.5px' }}>SUPERVISION GLOBALE</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      {/* Section 2 — Projets */}
      <ProjetsSection />

      {/* Section 3 — Commandes */}
      <CommandesSection />

      {/* Section 4 — Factures */}
      <FacturesSection />
    </div>
  );
}
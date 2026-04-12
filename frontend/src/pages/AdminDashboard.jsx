/**
 * ═══════════════════════════════════════════════════════════════
 *           Admin Dashboard - Lbouhla eltihkum rkiba
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileSection from '../components/ProfileSection';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  ScrollText,
  LogOut,
  Bell,
  Plus,
} from 'lucide-react';

const T = {
  blue:    '#3b5bdb',
  indigo:  '#7048e8',
  sky:     '#4dabf7',
  navy:    '#1c3fa8',
  bg:      '#f1f5f9',
  surface: '#ffffff',
  border:  '#e2e8f0',
  borderXs:'#f1f5f9',
  txt:     '#0f172a',
  txtMid:  '#475569',
  txtMute: '#94a3b8',
  green:   '#16a34a',
  greenBg: '#f0fdf4',
  amber:   '#d97706',
  amberBg: '#fffbeb',
  red:     '#ef4444',
  redBg:   '#fef2f2',
  shadow:  '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:'0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
};

const CHART_COLORS = [T.blue, T.indigo, T.sky, T.navy];

const ROLE_CONFIG = {
  admin:       { bg: '#eef2ff', color: T.blue,    label: 'Admin' },
  client:      { bg: '#eef2ff', color: T.blue,    label: 'Client' },
  fournisseur: { bg: '#f5f3ff', color: T.indigo,  label: 'Fournisseur' },
  partenaire:  { bg: '#e0f2fe', color: '#0369a1', label: 'Partenaire' },
};

const AVATAR_COLORS = [T.blue, T.indigo, T.sky, T.navy, '#0369a1', '#7c3aed'];

const initiales = (nom, prenom) =>
  ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();

const StatutPill = ({ statut }) => {
  const map = {
    actif:   { bg: T.greenBg, color: T.green },
    inactif: { bg: T.amberBg, color: T.amber },
    bloque:  { bg: T.redBg,   color: T.red },
    bloqué:  { bg: T.redBg,   color: T.red },
  };
  const s = map[statut] || map.inactif;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20,
      fontSize: 10, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      {statut}
    </span>
  );
};

const RolePill = ({ role }) => {
  const rc = ROLE_CONFIG[role] || { bg: '#f1f5f9', color: T.txtMid, label: role };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20,
      fontSize: 10, fontWeight: 700,
      background: rc.bg, color: rc.color,
    }}>
      {rc.label}
    </span>
  );
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/logs')
      .then(({ data }) => setLogs(data.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const actionStyle = {
    login:           { bg: T.greenBg,  color: T.green  },
    logout:          { bg: '#f1f5f9',  color: T.txtMid },
    password_change: { bg: '#fffbeb',  color: T.amber  },
    blocked:         { bg: T.redBg,    color: T.red    },
    failed_attempt:  { bg: T.redBg,    color: T.red    },
  };

  return (
    <div style={{
      background: T.surface, borderRadius: 14,
      boxShadow: T.shadow, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: `0.5px solid ${T.borderXs}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>
          Historique des connexions
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 700,
          background: '#eef2ff', color: T.blue,
        }}>
          {logs.length} entrées
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.2fr 1.5fr 2fr 1.5fr',
        padding: '9px 20px',
        background: '#f8fafc',
        borderBottom: `0.5px solid ${T.borderXs}`,
        fontSize: 10, fontWeight: 700, color: T.txtMute,
        letterSpacing: '0.4px',
      }}>
        <span>UTILISATEUR</span>
        <span>ACTION</span>
        <span>IP</span>
        <span>USER AGENT</span>
        <span>DATE</span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>
          Chargement…
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>
          Aucun log trouvé.
        </div>
      ) : (
        logs.map((log, i) => {
          const as = actionStyle[log.action] || { bg: '#f1f5f9', color: T.txtMid };
          return (
            <div key={log.id || i} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1.5fr 2fr 1.5fr',
              padding: '11px 20px',
              borderBottom: `0.5px solid ${T.borderXs}`,
              alignItems: 'center',
              fontSize: 12,
            }}>
              <div style={{ fontWeight: 600, color: T.txt }}>
                {log.prenom} {log.nom}
              </div>
              <div>
                <span style={{
                  padding: '3px 9px', borderRadius: 20,
                  fontSize: 10, fontWeight: 700,
                  background: as.bg, color: as.color,
                }}>
                  {log.action}
                </span>
              </div>
              <div style={{ color: T.txtMute, fontFamily: 'monospace', fontSize: 11 }}>
                {log.ip_address || '—'}
              </div>
              <div style={{
                color: T.txtMute, fontSize: 10,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {log.user_agent?.split(' ')[0] || '—'}
              </div>
              <div style={{ color: T.txtMute, fontSize: 11 }}>
                {log.created_at
                  ? new Date(log.created_at).toLocaleString('fr-TN', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState({ text: '', type: '' });
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', mot_de_passe: '', role_id: 2,
  });

  const donutRef   = useRef(null);
  const barRef     = useRef(null);
  const donutChart = useRef(null);
  const barChart   = useRef(null);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/users/stats');
      setStats(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users');
      setUsers(data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStats(); fetchUsers(); }, []);

  useEffect(() => {
    if (activePage !== 'dashboard' || !stats) return;

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
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, font: { size: 10 }, color: T.txtMute },
                grid: { color: '#f1f5f9' },
                border: { dash: [4, 4], color: 'transparent' },
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: T.txtMid },
              },
            },
          },
        });
      }
    };

    if (!window.Chart) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload = buildCharts;
      document.head.appendChild(s);
    } else {
      buildCharts();
    }

    return () => {
      donutChart.current?.destroy();
      barChart.current?.destroy();
    };
  }, [activePage, stats]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3500);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/users', form);
      showMsg('Utilisateur créé avec succès !', 'success');
      setShowModal(false);
      setForm({ nom: '', prenom: '', email: '', mot_de_passe: '', role_id: 2 });
      fetchUsers(); fetchStats();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Erreur serveur.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatut = async (id, statut) => {
    try {
      await axios.patch(`/api/users/${id}/statut`, { statut });
      showMsg(`Statut mis à jour : ${statut}`, 'success');
      fetchUsers(); fetchStats();
    } catch {
      showMsg('Erreur lors de la mise à jour.', 'error');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={15} /> },
    { id: 'users',     label: 'Utilisateurs',    icon: <Users size={15} /> },
    { id: 'profil',    label: 'Mon Profil',       icon: <UserCircle size={15} /> },
    { id: 'logs',      label: 'Logs Connexion',   icon: <ScrollText size={15} /> },
  ];

  const pageTitle = {
    dashboard: 'Tableau de bord',
    users:     'Gestion Utilisateurs',
    profil:    'Mon Profil',
    logs:      'Logs Connexion',
  };

  const statCards = stats ? [
    {
      label: 'Total Utilisateurs', value: stats.total,
      bg: '#eef2ff', border: `1.5px solid ${T.blue}33`,
      color: T.blue, iconBg: '#e0e7ff',
      icon: (
        <svg width="18" height="18" fill="none" stroke={T.blue} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Comptes Actifs', value: stats.actifs,
      bg: T.greenBg, border: `1.5px solid ${T.green}33`,
      color: T.green, iconBg: '#dcfce7',
      icon: (
        <svg width="18" height="18" fill="none" stroke={T.green} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    {
      label: 'Comptes Inactifs', value: stats.inactifs,
      bg: T.amberBg, border: `1.5px solid ${T.amber}33`,
      color: T.amber, iconBg: '#fef3c7',
      icon: (
        <svg width="18" height="18" fill="none" stroke={T.amber} strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
    },
    {
      label: 'Comptes Bloqués', value: stats.bloques,
      bg: T.redBg, border: `1.5px solid ${T.red}33`,
      color: T.red, iconBg: '#fee2e2',
      icon: (
        <svg width="18" height="18" fill="none" stroke={T.red} strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ),
    },
  ] : [];

  const s = {
    wrap:    { display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: T.bg },
    sidebar: {
      width: 230, background: T.surface,
      borderRight: `0.5px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    },
    logoBox: {
      padding: '18px 18px',
      borderBottom: `0.5px solid ${T.borderXs}`,
      display: 'flex', alignItems: 'center', gap: 10,
    },
    main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topbar:  {
      background: T.surface, padding: '13px 26px',
      borderBottom: `0.5px solid ${T.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    content: { flex: 1, overflow: 'auto', padding: '22px 26px' },
  };

  return (
    <div style={s.wrap}>

      {/* ━━━━━━━━ Sidebar ━━━━━━━━ */}
      <div style={s.sidebar}>

        {/* ✅ LOGO - mصلح */}
        <div style={s.logoBox}>
          <img
            src="/logo_mitech.png"
           
            style={{ height: 58, width: 'auto', objectFit: 'contain' }} />
  
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '14px 10px' }}>
          {navItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 11px', borderRadius: 9,
                cursor: 'pointer', marginBottom: 2,
                fontSize: 12.5, transition: 'all 0.15s',
                color:      activePage === item.id ? T.blue    : T.txtMid,
                fontWeight: activePage === item.id ? 700       : 500,
                background: activePage === item.id ? '#eef2ff' : 'transparent',
              }}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '14px 14px', borderTop: `0.5px solid ${T.borderXs}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: T.blue, color: '#fff',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {initiales(user?.nom, user?.prenom)}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ fontSize: 10, color: T.txtMute }}>Administrateur</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px',
              background: T.redBg, color: T.red,
              border: 'none', borderRadius: 8,
              fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ━━━━━━━━ Main content ━━━━━━━━ */}
      <div style={s.main}>

        {/* Topbar */}
        <div style={s.topbar}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.txt }}>
            {pageTitle[activePage]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: '#f8fafc', border: `0.5px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Bell size={15} color={T.txtMid} />
            </div>
            {activePage === 'users' && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: T.blue, color: '#fff',
                  border: 'none', borderRadius: 9,
                  padding: '8px 16px', fontSize: 12.5,
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={14} /> Créer utilisateur
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            margin: '12px 26px 0',
            padding: '10px 16px', borderRadius: 10,
            fontSize: 12.5,
            background: message.type === 'success' ? T.greenBg : T.redBg,
            color:      message.type === 'success' ? T.green   : T.red,
            border: `0.5px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Page content */}
        <div style={s.content}>

          {/* ◆ DASHBOARD */}
          {activePage === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
                {statCards.map((c, i) => (
                  <div key={i} style={{
                    background: c.bg, borderRadius: 14,
                    padding: '18px 18px 16px',
                    boxShadow: T.shadow, border: c.border,
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: c.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14,
                    }}>
                      {c.icon}
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: c.color, marginBottom: 3 }}>
                      {c.value}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: c.color, opacity: 0.8 }}>
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.surface, borderRadius: 14, padding: '18px 22px', boxShadow: T.shadow }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 10 }}>
                    Répartition par rôle
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    {['Clients','Fournisseurs','Partenaires','Admins'].map((l, i) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtMid }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: CHART_COLORS[i], display: 'inline-block' }} />
                        {l} {stats ? parseInt([stats.clients, stats.fournisseurs, stats.partenaires, stats.admins][i] || 0) : 0}
                      </span>
                    ))}
                  </div>
                  <div style={{ position: 'relative', height: 200 }}>
                    <canvas ref={donutRef} />
                  </div>
                </div>

                <div style={{ background: T.surface, borderRadius: 14, padding: '18px 22px', boxShadow: T.shadow }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 10 }}>
                    Répartition par statut
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {[
                      { label: 'Actifs',   color: T.green, val: stats?.actifs },
                      { label: 'Inactifs', color: T.amber, val: stats?.inactifs },
                      { label: 'Bloqués',  color: T.red,   val: stats?.bloques },
                    ].map(({ label, color, val }) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtMid }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: 'inline-block' }} />
                        {label} {parseInt(val || 0)}
                      </span>
                    ))}
                  </div>
                  <div style={{ position: 'relative', height: 200 }}>
                    <canvas ref={barRef} />
                  </div>
                </div>
              </div>

              <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
                <div style={{
                  padding: '14px 20px', borderBottom: `0.5px solid ${T.borderXs}`,
                  fontSize: 13, fontWeight: 700, color: T.txt,
                }}>
                  Utilisateurs récents
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr',
                  padding: '9px 20px', background: '#f8fafc',
                  borderBottom: `0.5px solid ${T.borderXs}`,
                  fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px',
                }}>
                  <span>Utilisateur</span><span>Email</span><span>Rôle</span><span>Statut</span>
                </div>
                {users.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr',
                    padding: '11px 20px', borderBottom: `0.5px solid ${T.borderXs}`,
                    alignItems: 'center', fontSize: 12.5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        color: '#fff', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {initiales(u.nom, u.prenom)}
                      </div>
                      <span style={{ fontWeight: 600, color: T.txt }}>{u.prenom} {u.nom}</span>
                    </div>
                    <div style={{ color: T.txtMid }}>{u.email}</div>
                    <div><RolePill role={u.role} /></div>
                    <div><StatutPill statut={u.statut} /></div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ◆ USERS */}
          {activePage === 'users' && (
            <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.4fr',
                padding: '9px 20px', background: '#f8fafc',
                borderBottom: `0.5px solid ${T.borderXs}`,
                fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px',
              }}>
                <span>Utilisateur</span><span>Email</span>
                <span>Rôle</span><span>Statut</span><span>Actions</span>
              </div>
              {users.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>
                  Aucun utilisateur.
                </div>
              ) : users.map((u, i) => (
                <div key={u.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.4fr',
                  padding: '13px 20px', borderBottom: `0.5px solid ${T.borderXs}`,
                  alignItems: 'center', fontSize: 12.5,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      color: '#fff', fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {initiales(u.nom, u.prenom)}
                    </div>
                    <span style={{ fontWeight: 600, color: T.txt }}>{u.prenom} {u.nom}</span>
                  </div>
                  <div style={{ color: T.txtMid }}>{u.email}</div>
                  <div><RolePill role={u.role} /></div>
                  <div><StatutPill statut={u.statut} /></div>
                  <div>
                    <button
                      onClick={() => handleStatut(u.id, u.statut === 'actif' ? 'bloque' : 'actif')}
                      style={{
                        padding: '5px 11px', borderRadius: 7,
                        border: `0.5px solid ${T.border}`,
                        background: T.surface, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600,
                        color: u.statut === 'actif' ? T.red : T.green,
                        transition: 'all 0.15s',
                      }}
                    >
                      {u.statut === 'actif' ? '🚫 Bloquer' : '✅ Activer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ◆ PROFIL */}
          {activePage === 'profil' && (
            <ProfileSection accentColor={T.blue} />
          )}

          {/* ◆ LOGS */}
          {activePage === 'logs' && <LogsPage />}

        </div>
      </div>

      {/* ━━━━━━━━ Modal créer utilisateur ━━━━━━━━ */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: T.surface, borderRadius: 20,
            padding: '28px 30px', width: 430,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 22,
            }}>
              <div>
                <h3 style={{ margin: 0, color: T.txt, fontSize: 16 }}>Nouvel utilisateur</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.txtMute }}>
                  Remplir les informations
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9', border: 'none',
                  width: 30, height: 30, borderRadius: 8,
                  fontSize: 16, cursor: 'pointer', color: T.txtMid,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { ph: 'Prénom', key: 'prenom' },
                  { ph: 'Nom',    key: 'nom' },
                ].map(({ ph, key }) => (
                  <input
                    key={key}
                    style={inputStyle}
                    placeholder={ph}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    required
                  />
                ))}
              </div>
              <input
                style={inputStyle}
                type="email"
                placeholder="Email"
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                style={inputStyle}
                type="password"
                placeholder="Mot de passe"
                onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                required
              />
              <select
                style={{ ...inputStyle, background: T.surface }}
                onChange={e => setForm({ ...form, role_id: parseInt(e.target.value) })}
              >
                <option value="2">Client</option>
                <option value="3">Fournisseur</option>
                <option value="4">Partenaire</option>
              </select>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '11px',
                    borderRadius: 10, border: `0.5px solid ${T.border}`,
                    background: '#f8fafc', cursor: 'pointer',
                    fontWeight: 600, fontSize: 13, color: T.txtMid,
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, padding: '11px',
                    borderRadius: 10, border: 'none',
                    background: loading
                      ? '#93c5fd'
                      : `linear-gradient(135deg, ${T.blue}, ${T.indigo})`,
                    color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 13,
                  }}
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  padding: '11px 13px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  outline: 'none',
  fontSize: 13,
  width: '100%',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  color: '#0f172a',
  boxSizing: 'border-box',
};

export default AdminDashboard;
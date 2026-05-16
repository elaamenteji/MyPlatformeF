import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileSection from '../components/ProfileSection';
import NotificationBell from '../components/NotificationBell';
import OdooSyncPage from './OdooSyncPage';
import {
  LayoutDashboard, Users, UserCircle, ScrollText,
  LogOut, Plus, FolderKanban, ShoppingCart, FileText,
  Mail, CheckCircle2, Eye, EyeOff, RefreshCw,
} from 'lucide-react';

const API = 'http://localhost:5000';

const T = {
  blue:     '#3b5bdb', indigo:   '#7048e8', sky:      '#4dabf7', navy:     '#1c3fa8',
  bg:       '#f1f5f9', surface:  '#ffffff', border:   '#e2e8f0', borderXs: '#f1f5f9',
  txt:      '#0f172a', txtMid:   '#475569', txtMute:  '#94a3b8',
  green:    '#16a34a', greenBg:  '#f0fdf4', amber:    '#d97706', amberBg:  '#fffbeb',
  red:      '#ef4444', redBg:    '#fef2f2',
  shadow:   '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
};

const P = {
  teal:     '#00A09D', tealBg:   '#E6F7F7', tealBd:   '#99DDD9',
  green:    '#17A84A', greenBg:  '#E8F7EE', greenBd:  '#8DD5A8',
  amber:    '#F59E0B', amberBg:  '#FEF3C7', amberBd:  '#FCD34D',
  red:      '#E8454A', redBg:    '#FDECEC', redBd:    '#F9A8A8',
  indigo:   '#6366F1', indigoBg: '#EEF2FF', indigoBd: '#C7D2FE',
  purple:   '#8B5CF6', purpleBg: '#F5F3FF', purpleBd: '#DDD6FE',
};

const CHART_COLORS  = [T.blue, T.indigo, T.sky, T.navy];
const AVATAR_COLORS = [T.blue, T.indigo, T.sky, T.navy, '#0369a1', '#7c3aed'];

const ROLE_CONFIG = {
  admin:       { bg: '#eef2ff', color: T.blue,    label: 'Admin'       },
  client:      { bg: '#eef2ff', color: T.blue,    label: 'Client'      },
  fournisseur: { bg: '#f5f3ff', color: T.indigo,  label: 'Fournisseur' },
  partenaire:  { bg: '#e0f2fe', color: '#0369a1', label: 'Partenaire'  },
};

const STATUS_CFG = {
  on_track:  { label: 'En cours',  color: P.teal,   bg: P.tealBg,   border: P.tealBd  },
  at_risk:   { label: 'À risque',  color: P.amber,  bg: P.amberBg,  border: P.amberBd },
  off_track: { label: 'En retard', color: P.red,    bg: P.redBg,    border: P.redBd   },
  done:      { label: 'Terminé',   color: P.green,  bg: P.greenBg,  border: P.greenBd },
};

const CMD_STATE = {
  draft:    { label: 'Brouillon', color: T.txtMute, bg: '#f8fafc',  border: T.border   },
  sent:     { label: 'Envoyé',    color: P.indigo,  bg: P.indigoBg, border: P.indigoBd },
  purchase: { label: 'Confirmé',  color: P.teal,    bg: P.tealBg,   border: P.tealBd   },
  done:     { label: 'Terminé',   color: P.green,   bg: P.greenBg,  border: P.greenBd  },
  cancel:   { label: 'Annulé',    color: P.red,     bg: P.redBg,    border: P.redBd    },
};

const PAY_STATE = {
  not_paid:   { label: 'Non payé', color: P.red,    bg: P.redBg,    border: P.redBd    },
  in_payment: { label: 'En cours', color: P.amber,  bg: P.amberBg,  border: P.amberBd  },
  paid:       { label: 'Payé',     color: P.green,  bg: P.greenBg,  border: P.greenBd  },
  partial:    { label: 'Partiel',  color: P.amber,  bg: P.amberBg,  border: P.amberBd  },
  reversed:   { label: 'Extourné', color: P.purple, bg: P.purpleBg, border: P.purpleBd },
};

const ROLE_ID_MAP = { client: 2, fournisseur: 3, partenaire: 4 };

const initiales = (nom, prenom) => ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmt       = (n) => parseFloat(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const genPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!$%';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);

const StatutPill = ({ statut }) => {
  const map = { actif: { bg: T.greenBg, color: T.green }, inactif: { bg: T.amberBg, color: T.amber }, bloque: { bg: T.redBg, color: T.red }, bloqué: { bg: T.redBg, color: T.red } };
  const s = map[statut] || map.inactif;
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color }}>{statut}</span>;
};

const RolePill = ({ role }) => {
  const rc = ROLE_CONFIG[role] || { bg: '#f1f5f9', color: T.txtMid, label: role };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color }}>{rc.label}</span>;
};

const BadgeAdmin = ({ config }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
    {config.label}
  </span>
);

// ── Logs Page ──────────────────────────────────────────────────
const LogsPage = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios.get(`${API}/api/users/logs`).then(({ data }) => setLogs(data.data || [])).catch(() => setLogs([])).finally(() => setLoading(false));
  }, []);
  const actionStyle = { login: { bg: T.greenBg, color: T.green }, logout: { bg: '#f1f5f9', color: T.txtMid }, password_change: { bg: '#fffbeb', color: T.amber }, blocked: { bg: T.redBg, color: T.red }, failed_attempt: { bg: T.redBg, color: T.red } };
  return (
    <div style={{ background: T.surface, borderRadius: 14, boxShadow: T.shadow, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${T.borderXs}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>Historique des connexions</div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#eef2ff', color: T.blue }}>{logs.length} entrées</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 2fr 1.5fr', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>
        {['UTILISATEUR', 'ACTION', 'IP', 'USER AGENT', 'DATE'].map(h => <span key={h}>{h}</span>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Chargement…</div>
        : logs.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucun log trouvé.</div>
        : logs.map((log, i) => {
          const as = actionStyle[log.action] || { bg: '#f1f5f9', color: T.txtMid };
          return (
            <div key={log.id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 2fr 1.5fr', padding: '11px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: T.txt }}>{log.prenom} {log.nom}</div>
              <div><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: as.bg, color: as.color }}>{log.action}</span></div>
              <div style={{ color: T.txtMute, fontFamily: 'monospace', fontSize: 11 }}>{log.ip_address || '—'}</div>
              <div style={{ color: T.txtMute, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.user_agent?.split(' ')[0] || '—'}</div>
              <div style={{ color: T.txtMute, fontSize: 11 }}>{log.created_at ? new Date(log.created_at).toLocaleString('fr-TN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
            </div>
          );
        })}
    </div>
  );
};

// ── Admin Projets Page ─────────────────────────────────────────
const AdminProjetsPage = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre,  setFiltre]  = useState('tous');
  useEffect(() => { axios.get(`${API}/api/projets`).then(res => setProjets(res.data.data || [])).catch(console.error).finally(() => setLoading(false)); }, []);
  const filtres = [{ key: 'tous', label: 'Tous' }, { key: 'on_track', label: 'En cours' }, { key: 'at_risk', label: 'À risque' }, { key: 'off_track', label: 'En retard' }, { key: 'done', label: 'Terminés' }];
  const filtered = filtre === 'tous' ? projets : projets.filter(p => p.last_update_status === filtre);
  const stats = { total: projets.length, enCours: projets.filter(p => p.last_update_status === 'on_track').length, aRisque: projets.filter(p => p.last_update_status === 'at_risk').length, termines: projets.filter(p => p.last_update_status === 'done').length };
  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: T.txtMute, fontSize: 13 }}>Chargement…</div>;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[{ label: 'Total projets', value: stats.total, color: P.teal, bg: P.tealBg, bd: P.tealBd }, { label: 'En cours', value: stats.enCours, color: P.green, bg: P.greenBg, bd: P.greenBd }, { label: 'À risque', value: stats.aRisque, color: P.amber, bg: P.amberBg, bd: P.amberBd }, { label: 'Terminés', value: stats.termines, color: P.indigo, bg: P.indigoBg, bd: P.indigoBd }].map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${c.bd}`, boxShadow: T.shadow }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {filtres.map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)} style={{ padding: '5px 14px', fontSize: 12, fontWeight: filtre === f.key ? 600 : 400, border: `1px solid ${filtre === f.key ? P.teal : T.border}`, borderRadius: 20, cursor: 'pointer', background: filtre === f.key ? P.tealBg : T.surface, color: filtre === f.key ? P.teal : T.txtMid }}>
            {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>({projets.filter(p => f.key === 'tous' ? true : p.last_update_status === f.key).length})</span>
          </button>
        ))}
      </div>
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '8px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}` }}>
          {['PROJET', 'CLIENT', 'DÉBUT', 'FIN', 'STATUT'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
        </div>
        {filtered.length === 0 ? <div style={{ padding: '36px', textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucun projet.</div>
          : filtered.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center' }}>
              <div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>{p.name}</div>{p.description && <div style={{ fontSize: 10, color: T.txtMute, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{p.description}</div>}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{p.client_email || '—'}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{fmtDate(p.date_start)}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{fmtDate(p.date)}</div>
              <BadgeAdmin config={STATUS_CFG[p.last_update_status] || STATUS_CFG.on_track} />
            </div>
          ))}
      </div>
    </div>
  );
};

// ── Admin Commandes Page ───────────────────────────────────────
const AdminCommandesPage = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filtre,    setFiltre]    = useState('tous');
  useEffect(() => { axios.get(`${API}/api/fournisseur/commandes/all`).then(res => setCommandes(res.data.data || [])).catch(console.error).finally(() => setLoading(false)); }, []);
  const filtered = filtre === 'tous' ? commandes : commandes.filter(c => c.state === filtre);
  const montantTotal = commandes.filter(c => ['purchase', 'done'].includes(c.state)).reduce((s, c) => s + parseFloat(c.amount_total || 0), 0);
  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: T.txtMute, fontSize: 13 }}>Chargement…</div>;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[{ label: 'Total', value: commandes.length, color: P.teal, bg: P.tealBg, bd: P.tealBd }, { label: 'Confirmées', value: commandes.filter(c => ['purchase', 'done'].includes(c.state)).length, color: P.green, bg: P.greenBg, bd: P.greenBd }, { label: 'En attente', value: commandes.filter(c => c.state === 'draft' || c.state === 'sent').length, color: P.amber, bg: P.amberBg, bd: P.amberBd }, { label: 'Montant confirmé', value: `${fmt(montantTotal)} TND`, color: P.indigo, bg: P.indigoBg, bd: P.indigoBd }].map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${c.bd}`, boxShadow: T.shadow }}>
            <div style={{ fontSize: i === 3 ? 17 : 28, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[{ key: 'tous', label: 'Toutes' }, { key: 'draft', label: 'Brouillon' }, { key: 'sent', label: 'Envoyé' }, { key: 'purchase', label: 'Confirmé' }, { key: 'done', label: 'Terminé' }, { key: 'cancel', label: 'Annulé' }].map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)} style={{ padding: '5px 14px', fontSize: 12, fontWeight: filtre === f.key ? 600 : 400, border: `1px solid ${filtre === f.key ? P.teal : T.border}`, borderRadius: 20, cursor: 'pointer', background: filtre === f.key ? P.tealBg : T.surface, color: filtre === f.key ? P.teal : T.txtMid }}>{f.label}</button>
        ))}
      </div>
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr', padding: '8px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}` }}>
          {['RÉFÉRENCE', 'FOURNISSEUR', 'DATE', 'MONTANT', 'STATUT'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
        </div>
        {filtered.length === 0 ? <div style={{ padding: '36px', textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucune commande.</div>
          : filtered.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center' }}>
              <div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>{c.name}</div>{c.notes && <div style={{ fontSize: 10, color: T.txtMute, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 250 }}>{c.notes}</div>}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{c.fournisseur_email || c.fournisseur_nom || '—'}</div>
              <div style={{ fontSize: 11, color: T.txtMid }}>{fmtDate(c.date_order)}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>{fmt(c.amount_total)} <span style={{ fontSize: 10, color: T.txtMute }}>TND</span></div>
              <BadgeAdmin config={CMD_STATE[c.state] || CMD_STATE.draft} />
            </div>
          ))}
      </div>
    </div>
  );
};

// ── Admin Factures Page ────────────────────────────────────────
const AdminFacturesPage = () => {
  const [factures, setFactures] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filtre,   setFiltre]   = useState('tous');
  useEffect(() => { axios.get(`${API}/api/fournisseur/factures/all`).then(res => setFactures(res.data.data || [])).catch(console.error).finally(() => setLoading(false)); }, []);
  const filtered = filtre === 'tous' ? factures : factures.filter(f => f.payment_state === filtre);
  const totalFacture = factures.reduce((s, f) => s + parseFloat(f.amount_total || 0), 0);
  const totalRestant = factures.reduce((s, f) => s + parseFloat(f.amount_residual || 0), 0);
  const totalPaye    = totalFacture - totalRestant;
  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: T.txtMute, fontSize: 13 }}>Chargement…</div>;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[{ label: 'Total facturé', value: `${fmt(totalFacture)} TND`, color: P.teal, bg: P.tealBg, bd: P.tealBd }, { label: 'Payé', value: `${fmt(totalPaye)} TND`, color: P.green, bg: P.greenBg, bd: P.greenBd }, { label: 'Restant dû', value: `${fmt(totalRestant)} TND`, color: totalRestant > 0 ? P.red : P.green, bg: totalRestant > 0 ? P.redBg : P.greenBg, bd: totalRestant > 0 ? P.redBd : P.greenBd }, { label: 'Nb factures', value: factures.length, color: P.indigo, bg: P.indigoBg, bd: P.indigoBd }].map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${c.bd}`, boxShadow: T.shadow }}>
            <div style={{ fontSize: i < 3 ? 17 : 28, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[{ key: 'tous', label: 'Toutes' }, { key: 'not_paid', label: 'Non payé' }, { key: 'partial', label: 'Partiel' }, { key: 'paid', label: 'Payé' }, { key: 'in_payment', label: 'En cours' }].map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)} style={{ padding: '5px 14px', fontSize: 12, fontWeight: filtre === f.key ? 600 : 400, border: `1px solid ${filtre === f.key ? P.teal : T.border}`, borderRadius: 20, cursor: 'pointer', background: filtre === f.key ? P.tealBg : T.surface, color: filtre === f.key ? P.teal : T.txtMid }}>
            {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>({factures.filter(x => f.key === 'tous' ? true : x.payment_state === f.key).length})</span>
          </button>
        ))}
      </div>
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', padding: '8px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}` }}>
          {['FACTURE', 'FOURNISSEUR', 'DATE', 'ÉCHÉANCE', 'MONTANT', 'PAIEMENT'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
        </div>
        {filtered.length === 0 ? <div style={{ padding: '36px', textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucune facture.</div>
          : filtered.map(f => {
            const isOverdue = f.invoice_date_due && new Date(f.invoice_date_due) < new Date() && f.payment_state === 'not_paid';
            return (
              <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', background: isOverdue ? '#fff8f8' : T.surface }}>
                <div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>{f.name}</div>{isOverdue && <span style={{ fontSize: 10, color: P.red }}>⚠ En retard</span>}</div>
                <div style={{ fontSize: 11, color: T.txtMid }}>{f.fournisseur_email || f.fournisseur_nom || '—'}</div>
                <div style={{ fontSize: 11, color: T.txtMid }}>{fmtDate(f.invoice_date)}</div>
                <div style={{ fontSize: 11, color: isOverdue ? P.red : T.txtMid, fontWeight: isOverdue ? 600 : 400 }}>{fmtDate(f.invoice_date_due)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>{fmt(f.amount_total)} <span style={{ fontSize: 10, color: T.txtMute }}>TND</span></div>
                <BadgeAdmin config={PAY_STATE[f.payment_state] || PAY_STATE.not_paid} />
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN AdminDashboard
// ══════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [users,        setUsers]        = useState([]);
  const [stats,        setStats]        = useState(null);
  const [activePage,   setActivePage]   = useState('dashboard');
  const [showModal,    setShowModal]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [message,      setMessage]      = useState({ text: '', type: '' });

  // ── Modal mode: 'manual' | 'odoo' ───────────────────────────
  const [modalMode,    setModalMode]    = useState('manual');

  // ── Manual mode states ───────────────────────────────────────
  const [pwMode,       setPwMode]       = useState('auto');
  const [manualPw,     setManualPw]     = useState('');
  const [showManualPw, setShowManualPw] = useState(false);
  const [generatedPw,  setGeneratedPw]  = useState(() => genPassword());
  const [emailError,   setEmailError]   = useState('');
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role_id: 2 });

  // ── Odoo mode states ─────────────────────────────────────────
  const [odooContacts,    setOdooContacts]    = useState([]);
  const [odooLoading,     setOdooLoading]     = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [odooRoleId,      setOdooRoleId]      = useState(2);

  const donutRef   = useRef(null);
  const barRef     = useRef(null);
  const donutChart = useRef(null);
  const barChart   = useRef(null);

  const fetchStats = async () => {
    try { const { data } = await axios.get(`${API}/api/users/stats`); setStats(data.data); } catch {}
  };
  const fetchUsers = async () => {
    try { const { data } = await axios.get(`${API}/api/users`); setUsers(data.data); } catch {}
  };

  const fetchOdooContacts = async () => {
    setOdooLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/sync/odoo-contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOdooContacts(data.data || []);
    } catch { setOdooContacts([]); }
    finally { setOdooLoading(false); }
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
          data: { labels: ['Clients', 'Fournisseurs', 'Partenaires', 'Admins'], datasets: [{ data: [parseInt(stats.clients || 0), parseInt(stats.fournisseurs || 0), parseInt(stats.partenaires || 0), parseInt(stats.admins || 0)], backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 5 }] },
          options: { cutout: '72%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
        });
      }
      if (barRef.current) {
        barChart.current?.destroy();
        barChart.current = new window.Chart(barRef.current, {
          type: 'bar',
          data: { labels: ['Actifs', 'Inactifs', 'Bloqués'], datasets: [{ label: 'Utilisateurs', data: [parseInt(stats.actifs || 0), parseInt(stats.inactifs || 0), parseInt(stats.bloques || 0)], backgroundColor: [T.green, T.amber, T.red], borderRadius: 8, borderSkipped: false, maxBarThickness: 46 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 }, color: T.txtMute }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false }, ticks: { font: { size: 11 }, color: T.txtMid } } } },
        });
      }
    };
    if (!window.Chart) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload = buildCharts;
      document.head.appendChild(s);
    } else { buildCharts(); }
    return () => { donutChart.current?.destroy(); barChart.current?.destroy(); };
  }, [activePage, stats]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleEmailChange = (value) => {
    setForm(prev => ({ ...prev, email: value }));
    if (!value) { setEmailError(''); return; }
    setEmailError(!isValidEmail(value) ? 'Adresse email invalide' : '');
  };

  const resetModal = () => {
    setShowModal(false);
    setModalMode('manual');
    setForm({ nom: '', prenom: '', email: '', role_id: 2 });
    setPwMode('auto');
    setManualPw('');
    setShowManualPw(false);
    setGeneratedPw(genPassword());
    setEmailError('');
    setSelectedContact(null);
    setOdooContacts([]);
    setOdooRoleId(2);
  };

  const openModal = () => {
    setShowModal(true);
    setModalMode('manual');
  };

  const switchToOdoo = () => {
    setModalMode('odoo');
    fetchOdooContacts();
  };

  // ── CREATE USER (manual) ─────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) { setEmailError('Adresse email invalide'); return; }
    setLoading(true);
    try {
      const payload = { ...form, mot_de_passe: pwMode === 'manual' ? manualPw : generatedPw };
      const res = await axios.post(`${API}/api/auth/create-user-mail`, payload);
      if (res.data.success) {
        showMsg(`✅ Compte créé ! Email envoyé à ${form.email}`, 'success');
        resetModal(); fetchUsers(); fetchStats();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur serveur.';
      showMsg(msg.includes('déjà') ? '⚠️ Cet email est déjà utilisé.' : msg, 'error');
    } finally { setLoading(false); }
  };

  // ── CREATE USER FROM ODOO ────────────────────────────────────
  const handleCreateFromOdoo = async () => {
    if (!selectedContact) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/sync/create-from-odoo`, {
        odoo_id:   selectedContact.odoo_id,
        nom:       selectedContact.nom,
        prenom:    selectedContact.prenom,
        email:     selectedContact.email,
        telephone: selectedContact.telephone,
        role_id:   odooRoleId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showMsg(`✅ Compte créé pour ${selectedContact.prenom} ${selectedContact.nom}`, 'success');
        resetModal(); fetchUsers(); fetchStats();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Erreur serveur.', 'error');
    } finally { setLoading(false); }
  };

  const handleStatut = async (id, statut) => {
    try {
      await axios.patch(`${API}/api/users/${id}/statut`, { statut });
      showMsg(`Statut mis à jour : ${statut}`, 'success');
      fetchUsers(); fetchStats();
    } catch { showMsg('Erreur lors de la mise à jour.', 'error'); }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={15} /> },
    { id: 'users',     label: 'Utilisateurs',    icon: <Users size={15} />            },
    { id: 'projets',   label: 'Projets',          icon: <FolderKanban size={15} />    },
    { id: 'commandes', label: 'Commandes',        icon: <ShoppingCart size={15} />    },
    { id: 'factures',  label: 'Factures',         icon: <FileText size={15} />        },
    { id: 'odooSync',  label: 'Sync Odoo',        icon: <RefreshCw size={15} />       },
    { id: 'profil',    label: 'Mon Profil',       icon: <UserCircle size={15} />      },
    { id: 'logs',      label: 'Logs Connexion',   icon: <ScrollText size={15} />      },
  ];

  const pageTitle = {
    dashboard: 'Tableau de bord', users: 'Gestion Utilisateurs',
    projets: 'Tous les projets', commandes: 'Toutes les commandes',
    factures: 'Toutes les factures', odooSync: 'Synchronisation Odoo ERP',
    profil: 'Mon Profil', logs: 'Logs Connexion',
  };

  const statCards = stats ? [
    { label: 'Total Utilisateurs', value: stats.total,    bg: '#eef2ff', border: `1.5px solid ${T.blue}33`,  color: T.blue,  iconBg: '#e0e7ff', icon: (<svg width="18" height="18" fill="none" stroke={T.blue}  strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>) },
    { label: 'Comptes Actifs',     value: stats.actifs,   bg: T.greenBg, border: `1.5px solid ${T.green}33`, color: T.green, iconBg: '#dcfce7', icon: (<svg width="18" height="18" fill="none" stroke={T.green} strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>) },
    { label: 'Comptes Inactifs',   value: stats.inactifs, bg: T.amberBg, border: `1.5px solid ${T.amber}33`, color: T.amber, iconBg: '#fef3c7', icon: (<svg width="18" height="18" fill="none" stroke={T.amber} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>) },
    { label: 'Comptes Bloqués',    value: stats.bloques,  bg: T.redBg,   border: `1.5px solid ${T.red}33`,   color: T.red,   iconBg: '#fee2e2', icon: (<svg width="18" height="18" fill="none" stroke={T.red}   strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>) },
  ] : [];

  const inputStyle = { padding: '11px 13px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontSize: 13, width: '100%', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#0f172a', boxSizing: 'border-box' };

  const getPwStrength = (v) => {
    let sc = 0;
    if (v.length >= 6) sc++;
    if (v.length >= 8) sc++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) sc++;
    if (/[@#!$%]/.test(v)) sc++;
    return sc;
  };

  const emailBorderColor = () => {
    if (!form.email) return '#e2e8f0';
    if (emailError) return '#ef4444';
    return '#16a34a';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: T.bg }}>

      {/* ━━━━ Sidebar ━━━━ */}
      <div style={{ width: 230, background: T.surface, borderRight: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px', borderBottom: `0.5px solid ${T.borderXs}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo_mitech.png" style={{ height: 58, width: 'auto', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} alt="Mitech" />
        </div>
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActivePage(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, cursor: 'pointer', marginBottom: 2, fontSize: 12.5, transition: 'all 0.15s', color: activePage === item.id ? T.blue : T.txtMid, fontWeight: activePage === item.id ? 700 : 500, background: activePage === item.id ? '#eef2ff' : 'transparent' }}>
              {item.icon} {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '14px', borderTop: `0.5px solid ${T.borderXs}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.blue, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initiales(user?.nom, user?.prenom)}</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.txt }}>{user?.prenom} {user?.nom}</div>
              <div style={{ fontSize: 10, color: T.txtMute }}>Administrateur</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: T.redBg, color: T.red, border: 'none', borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ━━━━ Main ━━━━ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: T.surface, padding: '13px 26px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.txt }}>{pageTitle[activePage]}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            {activePage === 'users' && (
              <button onClick={openModal} style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Créer utilisateur
              </button>
            )}
          </div>
        </div>

        {message.text && (
          <div style={{ margin: '12px 26px 0', padding: '10px 16px', borderRadius: 10, fontSize: 12.5, background: message.type === 'success' ? T.greenBg : T.redBg, color: message.type === 'success' ? T.green : T.red, border: `0.5px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
            {message.text}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: '22px 26px' }}>
          {activePage === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
                {statCards.map((c, i) => (
                  <div key={i} style={{ background: c.bg, borderRadius: 14, padding: '18px 18px 16px', boxShadow: T.shadow, border: c.border }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{c.icon}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: c.color, marginBottom: 3 }}>{c.value}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: c.color, opacity: 0.8 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.surface, borderRadius: 14, padding: '18px 22px', boxShadow: T.shadow }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 10 }}>Répartition par rôle</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    {['Clients', 'Fournisseurs', 'Partenaires', 'Admins'].map((l, i) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtMid }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: CHART_COLORS[i], display: 'inline-block' }} />
                        {l} {stats ? parseInt([stats.clients, stats.fournisseurs, stats.partenaires, stats.admins][i] || 0) : 0}
                      </span>
                    ))}
                  </div>
                  <div style={{ position: 'relative', height: 200 }}><canvas ref={donutRef} /></div>
                </div>
                <div style={{ background: T.surface, borderRadius: 14, padding: '18px 22px', boxShadow: T.shadow }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 10 }}>Répartition par statut</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {[{ label: 'Actifs', color: T.green, val: stats?.actifs }, { label: 'Inactifs', color: T.amber, val: stats?.inactifs }, { label: 'Bloqués', color: T.red, val: stats?.bloques }].map(({ label, color, val }) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtMid }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: 'inline-block' }} /> {label} {parseInt(val || 0)}
                      </span>
                    ))}
                  </div>
                  <div style={{ position: 'relative', height: 200 }}><canvas ref={barRef} /></div>
                </div>
              </div>
              <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
                <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 13, fontWeight: 700, color: T.txt }}>Utilisateurs récents</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>
                  {['Utilisateur', 'Email', 'Rôle', 'Statut'].map(h => <span key={h}>{h}</span>)}
                </div>
                {users.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '11px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', fontSize: 12.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initiales(u.nom, u.prenom)}</div>
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

          {activePage === 'users' && (
            <div style={{ background: T.surface, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.4fr', padding: '9px 20px', background: '#f8fafc', borderBottom: `0.5px solid ${T.borderXs}`, fontSize: 10, fontWeight: 700, color: T.txtMute, letterSpacing: '0.4px' }}>
                {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Actions'].map(h => <span key={h}>{h}</span>)}
              </div>
              {users.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: T.txtMute, fontSize: 13 }}>Aucun utilisateur.</div>
                : users.map((u, i) => (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.4fr', padding: '13px 20px', borderBottom: `0.5px solid ${T.borderXs}`, alignItems: 'center', fontSize: 12.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initiales(u.nom, u.prenom)}</div>
                      <span style={{ fontWeight: 600, color: T.txt }}>{u.prenom} {u.nom}</span>
                    </div>
                    <div style={{ color: T.txtMid }}>{u.email}</div>
                    <div><RolePill role={u.role} /></div>
                    <div><StatutPill statut={u.statut} /></div>
                    <div>
                      <button onClick={() => handleStatut(u.id, u.statut === 'actif' ? 'bloque' : 'actif')} style={{ padding: '5px 11px', borderRadius: 7, border: `0.5px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: u.statut === 'actif' ? T.red : T.green }}>
                        {u.statut === 'actif' ? '🚫 Bloquer' : '✅ Activer'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activePage === 'projets'   && <AdminProjetsPage />}
          {activePage === 'commandes' && <AdminCommandesPage />}
          {activePage === 'factures'  && <AdminFacturesPage />}
          {activePage === 'odooSync'  && <OdooSyncPage />}
          {activePage === 'profil'    && <ProfileSection accentColor={T.blue} />}
          {activePage === 'logs'      && <LogsPage />}
        </div>
      </div>

      {/* ━━━━ Modal créer utilisateur ━━━━ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: T.surface, borderRadius: 20, padding: '28px 30px', width: modalMode === 'odoo' ? 560 : 440, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, color: T.txt, fontSize: 16 }}>Nouvel utilisateur</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.txtMute }}>
                  {modalMode === 'odoo' ? 'Sélectionner depuis Odoo ERP' : 'Un email de bienvenue sera envoyé automatiquement'}
                </p>
              </div>
              <button onClick={resetModal} style={{ background: '#f1f5f9', border: 'none', width: 30, height: 30, borderRadius: 8, fontSize: 16, cursor: 'pointer', color: T.txtMid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Mode Toggle */}
            <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              {[
                { key: 'manual', label: '✏️ Saisie manuelle' },
                { key: 'odoo',   label: '🔄 Depuis Odoo' },
              ].map(opt => (
                <button key={opt.key} type="button" onClick={() => opt.key === 'odoo' ? switchToOdoo() : setModalMode('manual')}
                  style={{ flex: 1, padding: '10px', border: 'none', fontSize: 12.5, fontWeight: modalMode === opt.key ? 700 : 400, cursor: 'pointer', background: modalMode === opt.key ? P.tealBg : T.surface, color: modalMode === opt.key ? P.teal : T.txtMid, borderRight: opt.key === 'manual' ? `1px solid ${T.border}` : 'none', transition: 'all 0.15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* ── MODE MANUEL ── */}
            {modalMode === 'manual' && (
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[{ ph: 'Prénom', key: 'prenom' }, { ph: 'Nom', key: 'nom' }].map(({ ph, key }) => (
                    <input key={key} style={inputStyle} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
                  ))}
                </div>
                <div>
                  <input style={{ ...inputStyle, borderColor: emailBorderColor(), borderWidth: form.email ? '1.5px' : '1px', transition: 'border-color 0.2s' }}
                    type="email" placeholder="Email" value={form.email} onChange={e => handleEmailChange(e.target.value)} required />
                  {emailError && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><span style={{ color: '#ef4444', fontSize: 11, fontWeight: 500 }}>✕ {emailError}</span></div>}
                  {form.email && !emailError && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><CheckCircle2 size={12} color="#16a34a" /><span style={{ color: '#16a34a', fontSize: 11, fontWeight: 500 }}>Format valide</span></div>}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.txtMid, margin: '0 0 8px' }}>Mot de passe</p>
                  <div style={{ display: 'flex', border: `0.5px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                    {[{ key: 'auto', label: '✦ Générer automatiquement' }, { key: 'manual', label: '✎ Choisir moi-même' }].map(opt => (
                      <button key={opt.key} type="button" onClick={() => setPwMode(opt.key)}
                        style={{ flex: 1, padding: '9px 10px', border: 'none', fontSize: 12, fontWeight: pwMode === opt.key ? 600 : 400, cursor: 'pointer', background: pwMode === opt.key ? '#eef2ff' : T.surface, color: pwMode === opt.key ? T.blue : T.txtMid, borderRight: opt.key === 'auto' ? `0.5px solid ${T.border}` : 'none', transition: 'all 0.15s' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {pwMode === 'auto' && (
                    <div>
                      <div style={{ background: '#f8fafc', border: `0.5px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: T.txt, letterSpacing: 1 }}>{generatedPw}</span>
                        <button type="button" onClick={() => setGeneratedPw(genPassword())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.txtMute, padding: 0, display: 'flex', alignItems: 'center' }}><RefreshCw size={14} /></button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={13} color="#16a34a" /><span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Fort — sera envoyé par email à l'utilisateur</span></div>
                    </div>
                  )}
                  {pwMode === 'manual' && (
                    <div>
                      <div style={{ position: 'relative', marginBottom: 6 }}>
                        <input style={{ ...inputStyle, paddingRight: 38 }} type={showManualPw ? 'text' : 'password'} placeholder="Saisir un mot de passe (min. 8 car.)" value={manualPw} onChange={e => setManualPw(e.target.value)} required />
                        <button type="button" onClick={() => setShowManualPw(!showManualPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.txtMute, padding: 0, display: 'flex' }}>
                          {showManualPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {manualPw.length > 0 && (() => {
                        const sc = getPwStrength(manualPw);
                        const colors = ['#ef4444', '#f97316', '#eab308', '#16a34a'];
                        const labels = ['Très faible', 'Faible', 'Moyen', 'Fort ✓'];
                        return (
                          <div>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>{[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i < sc ? colors[sc-1] : '#e2e8f0', transition: 'background 0.2s' }} />)}</div>
                            <span style={{ fontSize: 11, color: colors[Math.max(0, sc-1)] }}>{labels[Math.max(0, sc-1)]}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <select style={{ ...inputStyle, background: T.surface }} value={form.role_id} onChange={e => setForm({ ...form, role_id: parseInt(e.target.value) })}>
                  <option value="2">Client</option>
                  <option value="3">Fournisseur</option>
                  <option value="4">Partenaire</option>
                </select>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={resetModal} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `0.5px solid ${T.border}`, background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: T.txtMid }}>Annuler</button>
                  <button type="submit" disabled={loading || (pwMode === 'manual' && manualPw.length < 8) || !!emailError || !form.email}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: (loading || (pwMode === 'manual' && manualPw.length < 8) || !!emailError || !form.email) ? '#93c5fd' : `linear-gradient(135deg, ${T.blue}, ${T.indigo})`, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {loading ? 'Création...' : <><Mail size={13} /> Créer &amp; Envoyer mail</>}
                  </button>
                </div>
              </form>
            )}

            {/* ── MODE ODOO ── */}
            {modalMode === 'odoo' && (
              <div>
                {odooLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: T.txtMute }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                    <div style={{ fontSize: 13 }}>Chargement contacts Odoo...</div>
                  </div>
                ) : odooContacts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: T.txtMute }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                    <div style={{ fontSize: 13 }}>Aucun contact Odoo disponible</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Tous les contacts ont déjà un compte</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: T.txtMute, marginBottom: 10 }}>
                      {odooContacts.length} contact(s) disponible(s) — sélectionne un pour créer son compte
                    </div>

                    {/* Lista contacts */}
                    <div style={{ maxHeight: 280, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 16 }}>
                      {odooContacts.map((c, i) => (
                        <div key={c.odoo_id} onClick={() => { setSelectedContact(c); setOdooRoleId(ROLE_ID_MAP[c.role_suggere] || 2); }}
                          style={{ padding: '12px 16px', borderBottom: i < odooContacts.length - 1 ? `1px solid ${T.borderXs}` : 'none', cursor: 'pointer', background: selectedContact?.odoo_id === c.odoo_id ? P.tealBg : T.surface, display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: selectedContact?.odoo_id === c.odoo_id ? P.teal : T.indigo, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {(c.prenom?.[0] || '') + (c.nom?.[0] || '')}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: T.txt }}>{c.prenom} {c.nom}</div>
                            <div style={{ fontSize: 11, color: T.txtMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                            {c.company && <div style={{ fontSize: 10, color: T.txtMid }}>{c.company}</div>}
                          </div>
                          <div>
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: P.indigoBg, color: P.indigo }}>
                              {c.role_suggere}
                            </span>
                          </div>
                          {selectedContact?.odoo_id === c.odoo_id && (
                            <CheckCircle2 size={16} color={P.teal} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Contact sélectionné — détails */}
                    {selectedContact && (
                      <div style={{ background: P.tealBg, border: `1px solid ${P.tealBd}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: P.teal, marginBottom: 10 }}>✅ Contact sélectionné</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: T.txt }}>
                          <div><span style={{ color: T.txtMute }}>Nom:</span> {selectedContact.prenom} {selectedContact.nom}</div>
                          <div><span style={{ color: T.txtMute }}>Email:</span> {selectedContact.email}</div>
                          {selectedContact.telephone && <div><span style={{ color: T.txtMute }}>Tél:</span> {selectedContact.telephone}</div>}
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: T.txtMid, display: 'block', marginBottom: 6 }}>Rôle dans la plateforme:</label>
                          <select value={odooRoleId} onChange={e => setOdooRoleId(parseInt(e.target.value))}
                            style={{ ...inputStyle, padding: '8px 12px' }}>
                            <option value="2">Client</option>
                            <option value="3">Fournisseur</option>
                            <option value="4">Partenaire</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={resetModal} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `0.5px solid ${T.border}`, background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: T.txtMid }}>Annuler</button>
                      <button onClick={handleCreateFromOdoo} disabled={!selectedContact || loading}
                        style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: !selectedContact || loading ? '#94a3b8' : `linear-gradient(135deg, ${P.teal}, ${P.green})`, color: '#fff', cursor: !selectedContact || loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {loading ? 'Création...' : <><Mail size={13} /> Créer compte &amp; Envoyer mail</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
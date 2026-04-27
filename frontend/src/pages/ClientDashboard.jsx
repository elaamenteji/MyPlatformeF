// frontend/src/pages/ClientDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, FolderKanban, CalendarDays,
  UserCircle, LogOut, CheckCircle2, AlertTriangle,
  Clock, ArrowRight, ListChecks, CircleDot, Ban,
  Star, Activity, Target, Zap, TrendingUp,
} from 'lucide-react';
import ProfileSection from '../components/ProfileSection';
import SuiviProjets from '../components/SuiviProjets';
import PlanningDates from '../components/PlanningDates';

const API = 'http://localhost:5000';

// ── Odoo 17 Modern Palette ────────────────────────────────────
const P = {
  teal:      '#00A09D',
  tealBg:    '#E6F7F7',
  tealBd:    '#99DDD9',
  green:     '#17A84A',
  greenBg:   '#E8F7EE',
  greenBd:   '#8DD5A8',
  amber:     '#F59E0B',
  amberBg:   '#FEF3C7',
  amberBd:   '#FCD34D',
  red:       '#E8454A',
  redBg:     '#FDECEC',
  redBd:     '#F9A8A8',
  indigo:    '#6366F1',
  indigoBg:  '#EEF2FF',
  indigoBd:  '#C7D2FE',
  txt:       '#1F2937',
  txtMid:    '#6B7280',
  txtMute:   '#9CA3AF',
  border:    '#E5E7EB',
  bg:        '#F9FAFB',
  surface:   '#FFFFFF',
  shadow:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:  '0 4px 16px rgba(0,0,0,0.08)',
};

const STATUS_CONFIG = {
  on_track:  { label: 'En cours',  color: P.teal,   bg: P.tealBg,   border: P.tealBd,   dot: P.teal,   icon: <CircleDot size={11}/>     },
  at_risk:   { label: 'À risque',  color: P.amber,  bg: P.amberBg,  border: P.amberBd,  dot: P.amber,  icon: <AlertTriangle size={11}/> },
  off_track: { label: 'En retard', color: P.red,    bg: P.redBg,    border: P.redBd,    dot: P.red,    icon: <Ban size={11}/>           },
  done:      { label: 'Terminé',   color: P.green,  bg: P.greenBg,  border: P.greenBd,  dot: P.green,  icon: <CheckCircle2 size={11}/>  },
};

const initiales = (nom, prenom) =>
  ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.on_track;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, flexShrink: 0 }}>
      {s.icon} {s.label}
    </span>
  );
}

function MiniProgress({ done, total }) {
  const pct   = total > 0 ? Math.round((parseInt(done) / parseInt(total)) * 100) : 0;
  const color = pct === 100 ? P.green : pct >= 60 ? P.teal : pct >= 30 ? P.amber : P.red;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.txtMute, marginBottom: 3 }}>
        <span>{done}/{total}</span>
        <span style={{ fontWeight: 500, color }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: P.border, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function DonutChart({ done, total }) {
  const pct  = total > 0 ? Math.round((done / total) * 100) : 0;
  const r    = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="45" cy="45" r={r} fill="none" stroke={P.border} strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={P.teal} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: P.teal, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 9, color: P.txtMute, marginTop: 2 }}>terminé</span>
      </div>
    </div>
  );
}

function ActivityFeed({ tasks, projets }) {
  const today = new Date();
  const items = [
    ...tasks.filter(t => t.stage_id === 'Done').map(t => ({
      label: t.name, projet: t.projetName,
      color: P.green, bg: P.greenBg, icon: <CheckCircle2 size={12} />, tag: 'Terminé',
    })),
    ...tasks.filter(t => t.date_deadline && new Date(t.date_deadline) < today && t.stage_id !== 'Done').map(t => ({
      label: t.name, projet: t.projetName,
      color: P.red, bg: P.redBg, icon: <AlertTriangle size={12} />, tag: 'En retard',
    })),
    ...projets.filter(p => p.last_update_status === 'at_risk').map(p => ({
      label: p.name, projet: 'Projet à risque',
      color: P.amber, bg: P.amberBg, icon: <Zap size={12} />, tag: 'À risque',
    })),
  ].slice(0, 5);

  if (items.length === 0) return (
    <div style={{ padding: '20px', textAlign: 'center', color: P.txtMute, fontSize: 12 }}>Aucune activité récente.</div>
  );

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < items.length - 1 ? `0.5px solid ${P.border}` : 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {item.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: P.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
            <div style={{ fontSize: 10, color: P.txtMute, marginTop: 1 }}>{item.projet}</div>
          </div>
          <span style={{ fontSize: 10, color: item.color, background: item.bg, padding: '2px 7px', borderRadius: 10, flexShrink: 0, fontWeight: 500 }}>{item.tag}</span>
        </div>
      ))}
    </div>
  );
}

function GanttMini({ projets }) {
  if (projets.length === 0) return null;
  const dates    = projets.flatMap(p => [new Date(p.date_start), new Date(p.date_fin || p.date)]).filter(d => !isNaN(d));
  const minDate  = new Date(Math.min(...dates));
  const maxDate  = new Date(Math.max(...dates));
  const total    = Math.max((maxDate - minDate) / 86400000, 1);
  const today    = new Date();
  const todayPct = Math.min(100, Math.max(0, ((today - minDate) / 86400000 / total) * 100));
  const colorMap = { on_track: P.teal, at_risk: P.amber, off_track: P.red, done: P.green };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: `calc(128px + ${todayPct}% * (100% - 128px) / 100)`, top: 0, bottom: 0, width: 1.5, background: P.red, zIndex: 2, borderRadius: 2 }} />
        {projets.map((p) => {
          const start = new Date(p.date_start);
          const end   = new Date(p.date_fin || p.date);
          const left  = ((start - minDate) / 86400000 / total) * 100;
          const width = Math.max(3, ((end - start) / 86400000 / total) * 100);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 120, fontSize: 10, color: P.txtMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {p.name.split('—')[0].trim()}
              </div>
              <div style={{ flex: 1, height: 16, background: P.bg, borderRadius: 6, position: 'relative', overflow: 'hidden', border: `0.5px solid ${P.border}` }}>
                <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: '100%', background: colorMap[p.last_update_status] || P.teal, borderRadius: 6, opacity: 0.8 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: P.txtMute, paddingLeft: 128, marginTop: 4 }}>
        <span>{minDate.toLocaleDateString('fr-TN', { month: 'short', year: '2-digit' })}</span>
        <span style={{ color: P.red, fontWeight: 500 }}>▲ Aujourd'hui</span>
        <span>{maxDate.toLocaleDateString('fr-TN', { month: 'short', year: '2-digit' })}</span>
      </div>
    </div>
  );
}

function DashboardHome({ user, token, onNavigate }) {
  const [projets, setProjets] = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/api/projets/mes-projets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const projetsData = Array.isArray(res.data?.data) ? res.data.data : [];
        setProjets(projetsData);
        const allTasks = [];
        await Promise.all(projetsData.map(async (p) => {
          try {
            const rt = await axios.get(`${API}/api/projets/${p.id}/tasks`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const td = Array.isArray(rt.data?.data) ? rt.data.data : [];
            td.forEach(t => allTasks.push({ ...t, projetName: p.name }));
          } catch {}
        }));
        setTasks(allTasks);
      } catch (err) {
        console.error('Dashboard error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
    else setLoading(false);
  }, [token]);

  const today = new Date();
  const stats = {
    total:         projets.length,
    enCours:       projets.filter(p => p.last_update_status === 'on_track').length,
    aRisque:       projets.filter(p => p.last_update_status === 'at_risk').length,
    termines:      projets.filter(p => p.last_update_status === 'done').length,
    totalTaches:   tasks.length,
    tachesDone:    tasks.filter(t => t.stage_id === 'Done').length,
    tachesEnCours: tasks.filter(t => t.stage_id === 'In Progress').length,
    tachesRetard:  tasks.filter(t => t.date_deadline && new Date(t.date_deadline) < today && t.stage_id !== 'Done').length,
    tachesBlocked: tasks.filter(t => t.kanban_state === 'blocked').length,
  };
  const prochaines = tasks
    .filter(t => t.date_deadline && new Date(t.date_deadline) >= today && t.stage_id !== 'Done')
    .sort((a, b) => new Date(a.date_deadline) - new Date(b.date_deadline))
    .slice(0, 5);
  const pctGlobal = stats.totalTaches > 0 ? Math.round((stats.tachesDone / stats.totalTaches) * 100) : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: P.txtMute }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${P.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13 }}>Chargement…</span>
    </div>
  );

  const kpiCards = [
    { label: 'Total projets',    value: stats.total,        color: P.teal,   bg: P.tealBg,   border: P.tealBd,   icon: <FolderKanban size={16} color={P.teal} />,   sub: `${stats.enCours} actifs`,        page: 'projets'  },
    { label: 'En cours',         value: stats.enCours,      color: P.green,  bg: P.greenBg,  border: P.greenBd,  icon: <CircleDot size={16} color={P.green} />,     sub: 'Projets actifs',                 page: 'projets'  },
    { label: 'À risque',         value: stats.aRisque,      color: P.amber,  bg: P.amberBg,  border: P.amberBd,  icon: <AlertTriangle size={16} color={P.amber} />, sub: 'Nécessite attention',            page: 'projets'  },
    { label: 'Tâches en retard', value: stats.tachesRetard, color: P.red,    bg: P.redBg,    border: P.redBd,    icon: <Clock size={16} color={P.red} />,           sub: `Sur ${stats.totalTaches} tâches`, page: 'planning' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Bienvenue */}
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: P.txt, margin: '0 0 3px' }}>
          Bonjour, {user?.prenom} {user?.nom} 👋
        </h2>
        <p style={{ fontSize: 12, color: P.txtMute, margin: 0 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {kpiCards.map((c, i) => (
          <div key={i} onClick={() => onNavigate(c.page)}
            style={{ background: c.bg, borderRadius: 14, padding: '16px', border: `1px solid ${c.border}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: P.shadow }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = P.shadowMd; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = P.shadow; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: P.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: P.shadow }}>
              {c.icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1, marginBottom: 3 }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.color, marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 10, color: c.color, opacity: 0.65 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — Donut + Avancement */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
        {/* Donut */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: '16px', boxShadow: P.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <Target size={13} color={P.teal} />
            <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Avancement global</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart done={stats.tachesDone} total={stats.totalTaches} />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Terminées', value: stats.tachesDone,    color: P.teal,  bg: P.tealBg  },
                { label: 'En cours',  value: stats.tachesEnCours, color: P.green, bg: P.greenBg },
                { label: 'Bloquées',  value: stats.tachesBlocked, color: P.red,   bg: P.redBg   },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: P.txtMid }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                    {s.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, padding: '1px 8px', borderRadius: 10 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: '16px', boxShadow: P.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ListChecks size={13} color={P.teal} />
              <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Avancement des tâches</span>
            </div>
            <span style={{ fontSize: 11, color: P.txtMute }}>{stats.tachesDone}/{stats.totalTaches}</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 8, borderRadius: 8, background: P.bg, overflow: 'hidden', marginBottom: 6, border: `1px solid ${P.border}` }}>
              <div style={{ width: `${pctGlobal}%`, height: '100%', background: `linear-gradient(90deg, ${P.teal}, ${P.green})`, borderRadius: 8, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.txtMute }}>
              <span>0%</span>
              <span style={{ color: P.teal, fontWeight: 600 }}>{pctGlobal}% complété</span>
              <span>100%</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'En cours',  value: stats.tachesEnCours, color: P.teal,  bg: P.tealBg,  icon: <CircleDot size={13} color={P.teal} />    },
              { label: 'Terminées', value: stats.tachesDone,    color: P.green, bg: P.greenBg, icon: <CheckCircle2 size={13} color={P.green} /> },
              { label: 'En retard', value: stats.tachesRetard,  color: P.red,   bg: P.redBg,   icon: <AlertTriangle size={13} color={P.red} />  },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${s.color}22` }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: P.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: P.shadow }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: s.color, opacity: 0.8, marginTop: 1 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — Projets + Echéances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12 }}>
        {/* Projets */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: P.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FolderKanban size={13} color={P.teal} />
              <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Mes projets</span>
            </div>
            <button onClick={() => onNavigate('projets')} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: P.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Voir tout <ArrowRight size={10} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', padding: '6px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
            {['PROJET', 'TÂCHES', 'STATUT'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute, letterSpacing: '0.5px' }}>{h}</span>
            ))}
          </div>
          {projets.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: P.txtMute, fontSize: 13 }}>Aucun projet.</div>
          ) : projets.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', padding: '11px 16px', borderBottom: `1px solid ${P.border}`, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: P.txt, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                  {p.priority === '1' && <Star size={9} fill={P.amber} color={P.amber} />}
                  {p.name}
                </div>
                <MiniProgress done={p.done_tasks || 0} total={p.total_tasks || 0} />
              </div>
              <div style={{ fontSize: 10, color: P.txtMute, textAlign: 'center' }}>{p.done_tasks||0}/{p.total_tasks||0}</div>
              <StatusBadge status={p.last_update_status} />
            </div>
          ))}
        </div>

        {/* Echéances */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: P.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CalendarDays size={13} color={P.indigo} />
              <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Prochaines échéances</span>
            </div>
            <button onClick={() => onNavigate('planning')} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: P.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Planning <ArrowRight size={10} />
            </button>
          </div>
          {prochaines.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <CheckCircle2 size={26} color={P.green} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: P.txtMute }}>Aucune échéance à venir.</div>
            </div>
          ) : prochaines.map((t, i) => {
            const deadline = new Date(t.date_deadline);
            const diff     = Math.ceil((deadline - today) / 86400000);
            const urgent   = diff <= 7;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${P.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: urgent ? P.redBg : P.amberBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${urgent ? P.redBd : P.amberBd}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: urgent ? P.red : P.amber, lineHeight: 1 }}>{deadline.getDate()}</span>
                  <span style={{ fontSize: 9, color: urgent ? P.red : P.amber, fontWeight: 600 }}>{deadline.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: P.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: P.txtMute, marginTop: 1 }}>{t.projetName}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: urgent ? P.red : P.amber, background: urgent ? P.redBg : P.amberBg, padding: '2px 8px', borderRadius: 10, flexShrink: 0, border: `1px solid ${urgent ? P.redBd : P.amberBd}` }}>
                  J-{diff}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 4 — Gantt + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
        {/* Gantt */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: P.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
            <Activity size={13} color={P.teal} />
            <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Timeline projets</span>
          </div>
          <div style={{ padding: '14px 16px' }}>
            {projets.length === 0 ? (
              <div style={{ textAlign: 'center', color: P.txtMute, fontSize: 12, padding: '20px 0' }}>Aucun projet.</div>
            ) : <GanttMini projets={projets} />}
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '0 16px 12px', flexWrap: 'wrap' }}>
            {[{ color: P.teal, label: 'En cours' }, { color: P.amber, label: 'À risque' }, { color: P.red, label: 'En retard' }, { color: P.green, label: 'Terminé' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: P.txtMid }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: P.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
            <TrendingUp size={13} color={P.teal} />
            <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Activité récente</span>
          </div>
          <div style={{ padding: '10px 16px' }}>
            <ActivityFeed tasks={tasks} projets={projets} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const ClientDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={14} /> },
    { id: 'projets',   label: 'Mes Projets',     icon: <FolderKanban size={14} /> },
    { id: 'planning',  label: 'Planning',         icon: <CalendarDays size={14} /> },
    { id: 'profil',    label: 'Mon Profil',       icon: <UserCircle size={14} /> },
  ];

  const pageTitle = {
    dashboard: 'Tableau de bord',
    projets:   'Suivi des projets & chantiers',
    planning:  'Planning & dates clés',
    profil:    'Mon Profil',
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --c-teal: #00A09D; --c-teal-bg: #E6F7F7; --c-teal-bd: #99DDD9;
          --c-green: #17A84A; --c-green-bg: #E8F7EE; --c-green-bd: #8DD5A8;
          --c-amber: #F59E0B; --c-amber-bg: #FEF3C7; --c-amber-bd: #FCD34D;
          --c-red: #E8454A;   --c-red-bg: #FDECEC;   --c-red-bd: #F9A8A8;
          --c-indigo: #6366F1; --c-indigo-bg: #EEF2FF; --c-indigo-bd: #C7D2FE;
          --c-txt: #1F2937; --c-txt-mid: #6B7280; --c-txt-mute: #9CA3AF;
          --c-border: #E5E7EB; --c-bg: #F9FAFB; --c-surface: #FFFFFF;
          --r-lg: 14px; --r-md: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: P.bg }}>

        {/* Sidebar */}
        <div style={{ width: 220, background: P.surface, borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: `1px solid ${P.border}` }}>
            <img src="/logo_mitech.png" alt="Mitech" style={{ height: 44, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            <div style={{ fontSize: 12, fontWeight: 600, color: P.txt, marginTop: 6 }}>Mitech Tunisie</div>
            <div style={{ fontSize: 10, color: P.txtMute }}>Gruppo Mastrotto</div>
          </div>
          <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
            {navItems.map(item => (
              <div key={item.id} onClick={() => setActivePage(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, fontSize: 12, transition: 'all 0.15s', color: activePage === item.id ? P.teal : P.txtMid, fontWeight: activePage === item.id ? 600 : 400, background: activePage === item.id ? P.tealBg : 'transparent' }}
                onMouseEnter={e => { if (activePage !== item.id) e.currentTarget.style.background = P.bg; }}
                onMouseLeave={e => { if (activePage !== item.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.icon} {item.label}
              </div>
            ))}
          </nav>
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: P.tealBg, color: P.teal, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${P.tealBd}` }}>
                {initiales(user?.nom, user?.prenom)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: P.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.prenom} {user?.nom}</div>
                <div style={{ fontSize: 10, color: P.txtMute }}>Client</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ width: '100%', padding: '7px', background: P.redBg, color: P.red, border: `1px solid ${P.redBd}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <LogOut size={12} /> Déconnexion
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: P.surface, padding: '0 24px', height: 52, borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: P.txt }}>{pageTitle[activePage]}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: P.tealBg, color: P.teal, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${P.tealBd}` }}>
                {initiales(user?.nom, user?.prenom)}
              </div>
              <span style={{ fontSize: 12, color: P.txtMid, fontWeight: 500 }}>{user?.prenom} {user?.nom}</span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            {activePage === 'dashboard' && <DashboardHome user={user} token={token} onNavigate={setActivePage} />}
            {activePage === 'projets'   && <SuiviProjets />}
            {activePage === 'planning'  && <PlanningDates />}
            {activePage === 'profil'    && <ProfileSection accentColor={P.teal} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDashboard;
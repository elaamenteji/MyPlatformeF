// frontend/src/components/SuiviProjets.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  FolderKanban, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Loader2, Star, Calendar,
  CircleDot, Ban, ClipboardList,
} from "lucide-react";

const API = "http://localhost:5000";

// ── Odoo 17 Modern Palette ────────────────────────────────────
const P = {
  teal:      "#00A09D", tealBg:   "#E6F7F7", tealBd:   "#99DDD9",
  green:     "#17A84A", greenBg:  "#E8F7EE", greenBd:  "#8DD5A8",
  amber:     "#F59E0B", amberBg:  "#FEF3C7", amberBd:  "#FCD34D",
  red:       "#E8454A", redBg:    "#FDECEC", redBd:    "#F9A8A8",
  indigo:    "#6366F1", indigoBg: "#EEF2FF", indigoBd: "#C7D2FE",
  txt:       "#1F2937", txtMid:   "#6B7280", txtMute:  "#9CA3AF",
  border:    "#E5E7EB", bg:       "#F9FAFB", surface:  "#FFFFFF",
  shadow:    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
};

const STATUS_CONFIG = {
  on_track:  { label: "En cours",  color: P.teal,  bg: P.tealBg,  border: P.tealBd,  dot: P.teal,  icon: <CircleDot size={12}/>     },
  at_risk:   { label: "À risque",  color: P.amber, bg: P.amberBg, border: P.amberBd, dot: P.amber, icon: <AlertTriangle size={12}/> },
  off_track: { label: "En retard", color: P.red,   bg: P.redBg,   border: P.redBd,   dot: P.red,   icon: <Ban size={12}/>           },
  done:      { label: "Terminé",   color: P.green, bg: P.greenBg, border: P.greenBd, dot: P.green, icon: <CheckCircle2 size={12}/>  },
};

const STAGE_CONFIG = {
  "In Progress": { label: "En cours", color: P.teal,  bg: P.tealBg,  border: P.tealBd,  icon: <CircleDot size={11}/>    },
  "Done":        { label: "Terminé",  color: P.green, bg: P.greenBg, border: P.greenBd, icon: <CheckCircle2 size={11}/> },
  "Cancelled":   { label: "Annulé",   color: P.red,   bg: P.redBg,   border: P.redBd,   icon: <Ban size={11}/>          },
};

const KANBAN_CONFIG = {
  normal:  { label: "Normal",  color: P.teal,  bg: P.tealBg  },
  done:    { label: "Prêt",    color: P.green, bg: P.greenBg },
  blocked: { label: "Bloqué",  color: P.red,   bg: P.redBg   },
};

function Badge({ config, small }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "2px 8px" : "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 500, background: config.bg, color: config.color, border: `1px solid ${config.border}`, flexShrink: 0 }}>
      {config.icon} {config.label}
    </span>
  );
}

function KpiCard({ label, value, color, bg, border, icon, sub }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${border}`, boxShadow: P.shadow }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: P.surface, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, boxShadow: P.shadow }}>
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: sub ? 2 : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, opacity: 0.65 }}>{sub}</div>}
    </div>
  );
}

function ProgressRing({ pct, size = 48, stroke = 5 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct === 100 ? P.green : pct >= 60 ? P.teal : pct >= 30 ? P.amber : P.red;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={P.border} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{pct}%</span>
      </div>
    </div>
  );
}

function TaskKanban({ tasks }) {
  const cols = [
    { key: "In Progress", ...STAGE_CONFIG["In Progress"] },
    { key: "Done",        ...STAGE_CONFIG["Done"]        },
    { key: "Cancelled",   ...STAGE_CONFIG["Cancelled"]   },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {cols.map(col => {
        const colTasks = tasks.filter(t => t.stage_id === col.key);
        return (
          <div key={col.key} style={{ background: col.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${col.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: col.color }}>{col.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: col.color, background: P.surface, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${col.border}` }}>
                {colTasks.length}
              </span>
            </div>
            {colTasks.map((t, i) => {
              const isOverdue = t.date_deadline && new Date(t.date_deadline) < new Date() && t.stage_id !== "Done";
              const kanban    = KANBAN_CONFIG[t.kanban_state] || KANBAN_CONFIG.normal;
              return (
                <div key={i} style={{ background: P.surface, borderRadius: 8, padding: "8px 10px", marginBottom: 6, border: `1px solid ${col.border}`, boxShadow: P.shadow }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: P.txt, marginBottom: 4, lineHeight: 1.4 }}>
                    {t.priority === "1" && <span style={{ color: P.amber, marginRight: 3 }}>★</span>}
                    {t.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                    {t.date_deadline && (
                      <span style={{ fontSize: 9, color: isOverdue ? P.red : P.txtMute, display: "flex", alignItems: "center", gap: 2 }}>
                        <Clock size={9} />
                        {new Date(t.date_deadline).toLocaleDateString("fr-TN", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 500, color: kanban.color, background: kanban.bg, padding: "1px 6px", borderRadius: 8 }}>
                      {kanban.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {colTasks.length === 0 && (
              <div style={{ fontSize: 10, color: col.color, opacity: 0.4, textAlign: "center", padding: "8px 0" }}>—</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProjetCard({ projet }) {
  const [expanded, setExpanded]       = useState(false);
  const [tasks, setTasks]             = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [vue, setVue]                 = useState("kanban");
  const { token } = useAuth();

  const statusCfg = STATUS_CONFIG[projet.last_update_status] || STATUS_CONFIG.on_track;
  const doneTasks  = tasks.filter(t => t.stage_id === "Done").length;
  const totalTasks = tasks.length;
  const pct        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const blocked    = tasks.filter(t => t.kanban_state === "blocked").length;

  const today     = new Date();
  const dateStart = projet.date_start ? new Date(projet.date_start) : null;
  const dateFin   = projet.date_fin   ? new Date(projet.date_fin)   : null;
  const isLate    = dateFin && dateFin < today && projet.last_update_status !== "done";
  const daysLeft  = dateFin ? Math.ceil((dateFin - today) / 86400000) : null;

  const timelinePct = () => {
    if (!dateStart || !dateFin) return 0;
    return Math.min(100, Math.max(0, Math.round(((today - dateStart) / (dateFin - dateStart)) * 100)));
  };

  const fetchTasks = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (tasks.length > 0) return;
    setLoadingTasks(true);
    try {
      const res = await axios.get(`${API}/api/projets/${projet.id}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(res.data.data || res.data);
    } catch {}
    finally { setLoadingTasks(false); }
  };

  return (
    <div style={{ background: P.surface, borderRadius: 12, border: `1px solid ${P.border}`, borderLeft: `3px solid ${statusCfg.dot}`, marginBottom: 10, overflow: "hidden", boxShadow: P.shadow }}>
      {/* Header */}
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: statusCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FolderKanban size={14} color={statusCfg.color} />
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: P.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {projet.name}
              </h3>
              {projet.priority === "1" && (
                <span style={{ fontSize: 10, color: P.amber, background: P.amberBg, padding: "1px 7px", borderRadius: 10, fontWeight: 500, flexShrink: 0, border: `1px solid ${P.amberBd}` }}>★ Urgent</span>
              )}
            </div>

            {projet.description && (
              <p style={{ fontSize: 11.5, color: P.txtMid, margin: "0 0 8px 36px", lineHeight: 1.5 }}>{projet.description}</p>
            )}

            <div style={{ marginLeft: 36 }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
                {dateStart && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: P.txtMid }}>
                    <Calendar size={10} color={P.teal} />
                    Début: {dateStart.toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
                {dateFin && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: isLate ? P.red : P.txtMid }}>
                    <Calendar size={10} color={isLate ? P.red : P.teal} />
                    Fin: {dateFin.toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })}
                    {daysLeft !== null && !isLate && daysLeft > 0 && (
                      <span style={{ color: daysLeft <= 30 ? P.amber : P.txtMute, fontSize: 10, marginLeft: 3 }}>J-{daysLeft}</span>
                    )}
                    {isLate && <span style={{ color: P.red, fontSize: 10, fontWeight: 600, marginLeft: 3 }}>· En retard!</span>}
                  </span>
                )}
              </div>
              {dateStart && dateFin && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: P.txtMute, marginBottom: 3 }}>
                    <span>{dateStart.toLocaleDateString("fr-TN", { month: "short", year: "2-digit" })}</span>
                    <span style={{ color: isLate ? P.red : P.teal, fontWeight: 600 }}>{timelinePct()}% écoulé</span>
                    <span>{dateFin.toLocaleDateString("fr-TN", { month: "short", year: "2-digit" })}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 4, background: P.border, overflow: "hidden" }}>
                    <div style={{ width: `${timelinePct()}%`, height: "100%", background: isLate ? P.red : P.teal, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
            <Badge config={statusCfg} />
            {parseInt(projet.total_tasks) > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ProgressRing pct={Math.round((parseInt(projet.done_tasks||0)/parseInt(projet.total_tasks))*100)} />
                <div style={{ fontSize: 10, color: P.txtMid, textAlign: "right" }}>
                  <div style={{ fontWeight: 600, color: P.txt }}>{projet.done_tasks||0}/{projet.total_tasks}</div>
                  <div>tâches</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {parseInt(projet.total_tasks) > 0 && (
        <div style={{ display: "flex", borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
          {[
            { label: "En cours",    value: parseInt(projet.total_tasks||0) - parseInt(projet.done_tasks||0), color: P.teal,   bg: P.tealBg   },
            { label: "Terminées",   value: parseInt(projet.done_tasks||0),                                   color: P.green,  bg: P.greenBg  },
            { label: "Progression", value: `${Math.round((parseInt(projet.done_tasks||0)/parseInt(projet.total_tasks))*100)}%`, color: P.indigo, bg: P.indigoBg },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "7px 10px", textAlign: "center", background: s.bg, borderRight: i < 2 ? `1px solid ${P.surface}` : "none" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: P.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ClipboardList size={11} color={P.txtMute} />
          <span style={{ fontSize: 11, color: P.txtMid }}>{expanded && totalTasks > 0 ? `${doneTasks}/${totalTasks} terminées` : "Tâches du projet"}</span>
          {blocked > 0 && <span style={{ fontSize: 10, color: P.red, background: P.redBg, padding: "1px 6px", borderRadius: 8, fontWeight: 500, border: `1px solid ${P.redBd}` }}>{blocked} bloquée{blocked > 1 ? "s" : ""}</span>}
        </div>
        <button onClick={fetchTasks} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", fontSize: 11, fontWeight: 500, border: `1px solid ${P.border}`, borderRadius: 8, background: P.surface, color: P.txtMid, cursor: "pointer" }}>
          {loadingTasks ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? "Masquer" : "Voir tâches"}
        </button>
      </div>

      {/* Tâches */}
      {expanded && !loadingTasks && (
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${P.border}` }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[{ key: "kanban", label: "Kanban" }, { key: "liste", label: "Liste" }].map(v => (
              <button key={v.key} onClick={() => setVue(v.key)} style={{ padding: "3px 10px", fontSize: 11, borderRadius: 6, border: `1px solid ${vue === v.key ? P.teal : P.border}`, background: vue === v.key ? P.tealBg : P.surface, color: vue === v.key ? P.teal : P.txtMid, cursor: "pointer", fontWeight: vue === v.key ? 600 : 400 }}>
                {v.label}
              </button>
            ))}
          </div>
          {tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: P.txtMute, fontSize: 12 }}>Aucune tâche.</div>
          ) : vue === "kanban" ? <TaskKanban tasks={tasks} /> : (
            tasks.map((t, i) => {
              const stage   = STAGE_CONFIG[t.stage_id] || STAGE_CONFIG["In Progress"];
              const isOverdue = t.date_deadline && new Date(t.date_deadline) < new Date() && t.stage_id !== "Done";
              const kanban  = KANBAN_CONFIG[t.kanban_state] || KANBAN_CONFIG.normal;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${P.border}` }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: stage.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: stage.color }}>{stage.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: P.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.priority === "1" && <span style={{ color: P.amber, marginRight: 3 }}>★</span>}
                      {t.name}
                    </div>
                    {t.date_deadline && (
                      <div style={{ fontSize: 10, color: isOverdue ? P.red : P.txtMute, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                        <Clock size={9} /> {isOverdue ? "En retard · " : ""}
                        {new Date(t.date_deadline).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: kanban.color, background: kanban.bg, padding: "2px 7px", borderRadius: 8, fontWeight: 500 }}>{kanban.label}</span>
                    <Badge config={stage} small />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SuiviProjets() {
  const { token } = useAuth();
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filtre, setFiltre]   = useState("tous");

  useEffect(() => {
    const fetchProjets = async () => {
      try {
        const res = await axios.get(`${API}/api/projets/mes-projets`, { headers: { Authorization: `Bearer ${token}` } });
        setProjets(res.data.data || res.data);
      } catch { setError("Impossible de charger vos projets."); }
      finally { setLoading(false); }
    };
    fetchProjets();
  }, [token]);

  const stats = {
    total:    projets.length,
    enCours:  projets.filter(p => p.last_update_status === "on_track").length,
    aRisque:  projets.filter(p => p.last_update_status === "at_risk").length,
    retard:   projets.filter(p => p.last_update_status === "off_track").length,
    termines: projets.filter(p => p.last_update_status === "done").length,
  };

  const filtres = [
    { key: "tous",      label: "Tous",      count: stats.total    },
    { key: "on_track",  label: "En cours",  count: stats.enCours  },
    { key: "at_risk",   label: "À risque",  count: stats.aRisque  },
    { key: "off_track", label: "En retard", count: stats.retard   },
    { key: "done",      label: "Terminés",  count: stats.termines },
  ];

  const projetsFiltres = filtre === "tous" ? projets : projets.filter(p => p.last_update_status === filtre);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10, color: P.txtMute }}>
      <Loader2 size={18} color={P.teal} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13 }}>Chargement…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return <div style={{ padding: "14px 18px", background: P.redBg, borderRadius: 10, color: P.red, fontSize: 13, border: `1px solid ${P.redBd}` }}>{error}</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
        <KpiCard label="Total"     value={stats.total}    color={P.indigo} bg={P.indigoBg} border={P.indigoBd} icon={<FolderKanban size={15} color={P.indigo} />} sub={`${stats.enCours} actifs`}    />
        <KpiCard label="En cours"  value={stats.enCours}  color={P.teal}   bg={P.tealBg}   border={P.tealBd}   icon={<CircleDot size={15} color={P.teal} />}       sub="Projets actifs"               />
        <KpiCard label="À risque"  value={stats.aRisque}  color={P.amber}  bg={P.amberBg}  border={P.amberBd}  icon={<AlertTriangle size={15} color={P.amber} />}  sub="Attention requise"            />
        <KpiCard label="En retard" value={stats.retard}   color={P.red}    bg={P.redBg}    border={P.redBd}    icon={<Ban size={15} color={P.red} />}              sub="Délai dépassé"                />
        <KpiCard label="Terminés"  value={stats.termines} color={P.green}  bg={P.greenBg}  border={P.greenBd}  icon={<CheckCircle2 size={15} color={P.green} />}   sub="Clôturés"                     />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {filtres.map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)} style={{ padding: "5px 14px", fontSize: 12, fontWeight: filtre === f.key ? 600 : 400, border: `1px solid ${filtre === f.key ? P.teal : P.border}`, borderRadius: 20, cursor: "pointer", background: filtre === f.key ? P.tealBg : P.surface, color: filtre === f.key ? P.teal : P.txtMid, transition: "all 0.15s" }}>
            {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>({f.count})</span>
          </button>
        ))}
      </div>

      {projetsFiltres.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: P.txtMute, fontSize: 13 }}>Aucun projet dans cette catégorie.</div>
      ) : projetsFiltres.map(p => <ProjetCard key={p.id} projet={p} />)}
    </div>
  );
}
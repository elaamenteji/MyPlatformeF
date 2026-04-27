import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Flag, CheckCircle2, AlertTriangle, Ban,
  CircleDot, Loader2, Clock, ListTodo, Zap,
} from "lucide-react";

const API = "http://localhost:5000";

const STATUS_COLOR = {
  on_track:  "#185FA5",
  at_risk:   "#BA7517",
  off_track: "#A32D2D",
  done:      "#3B6D11",
};

const STAGE_COLOR = {
  "In Progress": "#185FA5",
  "Done":        "#3B6D11",
  "Cancelled":   "#A32D2D",
};

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth()    === d2.getMonth()    &&
         d1.getDate()     === d2.getDate();
}

function KpiCard({ label, value, color, bg, icon, sub }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "16px 18px", border: `0.5px solid ${color}22` }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, border: `0.5px solid ${color}33` }}>
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, color, lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, opacity: 0.65 }}>{sub}</div>}
    </div>
  );
}

function CalendarFull({ events }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(null);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const lastDay = new Date(year, month + 1, 0);

  let startDow = new Date(year, month, 1).getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  const getEventsForDay = (date) =>
    date ? events.filter(e => isSameDay(new Date(e.date), date)) : [];

  const monthEvents = events.filter(e =>
    new Date(e.date).getFullYear() === year && new Date(e.date).getMonth() === month
  );

  const selectedEvents = selected ? getEventsForDay(selected) : [];

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", overflow: "hidden", marginBottom: 16 }}>
      {/* Calendar header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "0.5px solid #f1f5f9" }}>
        <button onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelected(null); }}
          style={{ background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: 7, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#475569" }}>
          <ChevronLeft size={14} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{MONTHS_FR[month]} {year}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{monthEvents.length} événement{monthEvents.length > 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelected(null); }}
          style={{ background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: 7, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#475569" }}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px" }}>
        {/* Calendar grid */}
        <div style={{ padding: "14px 16px", borderRight: "0.5px solid #f1f5f9" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
            {DAYS_FR.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", fontWeight: 500, padding: "3px 0" }}>{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((date, i) => {
              const dayEvents = getEventsForDay(date);
              const isToday   = date && isSameDay(date, today);
              const isPast    = date && date < today && !isToday;
              const isSelected = date && selected && isSameDay(date, selected);
              const hasUrgent  = dayEvents.some(e => {
                const diff = Math.ceil((new Date(e.date) - today) / 86400000);
                return diff >= 0 && diff <= 7 && !e.done;
              });

              return (
                <div key={i}
                  onClick={() => date && dayEvents.length > 0 && setSelected(isSelected ? null : date)}
                  style={{
                    textAlign: "center", padding: "7px 3px", borderRadius: 8,
                    fontSize: 12, position: "relative", cursor: dayEvents.length > 0 ? "pointer" : "default",
                    background: isSelected ? "#185FA5" : isToday ? "#E6F1FB" : "transparent",
                    color: isSelected ? "#fff" : isToday ? "#185FA5" : isPast ? "#94a3b8" : "#0f172a",
                    fontWeight: isToday || isSelected ? 500 : 400,
                    border: isSelected ? "0.5px solid #185FA5" : isToday ? "0.5px solid #B5D4F4" : "0.5px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {date ? date.getDate() : ""}
                  {dayEvents.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "#fff" : e.color }} />
                      ))}
                    </div>
                  )}
                  {hasUrgent && !isSelected && (
                    <div style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", background: "#A32D2D" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — selected day or month summary */}
        <div style={{ padding: "14px 16px", background: "#f8fafc" }}>
          {selected && selectedEvents.length > 0 ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#185FA5", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                <CalendarDays size={12} />
                {selected.getDate()} {MONTHS_FR[selected.getMonth()]}
              </div>
              {selectedEvents.map((e, i) => {
                const isOverdue = new Date(e.date) < today && !e.done;
                return (
                  <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", marginBottom: 6, border: `0.5px solid ${e.color}33`, borderLeft: `3px solid ${e.color}` }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#0f172a", marginBottom: 3 }}>{e.label}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{e.projetName}</div>
                    {isOverdue && <div style={{ fontSize: 10, color: "#A32D2D", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={9} /> En retard</div>}
                    {e.done && <div style={{ fontSize: 10, color: "#3B6D11", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}><CheckCircle2 size={9} /> Terminé</div>}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#64748b", marginBottom: 10 }}>
                {monthEvents.length > 0 ? "Événements du mois" : "Aucun événement"}
              </div>
              {monthEvents.slice(0, 8).map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: "0.5px solid #f1f5f9" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>{new Date(e.date).getDate()} {MONTHS_FR[new Date(e.date).getMonth()].slice(0,3)}</span>
                  <span style={{ fontSize: 10, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.label}</span>
                </div>
              ))}
              {monthEvents.length > 8 && (
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6, textAlign: "center" }}>+{monthEvents.length - 8} autres</div>
              )}
              {monthEvents.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 11 }}>Cliquez sur un jour pour voir les détails</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, today }) {
  const isOverdue = new Date(event.date) < today && !event.done;
  const diff      = Math.ceil((new Date(event.date) - today) / 86400000);
  const isUrgent  = diff >= 0 && diff <= 7 && !event.done;

  const dateColor = event.done ? "#3B6D11" : isOverdue ? "#A32D2D" : isUrgent ? "#BA7517" : "#185FA5";
  const dateBg    = event.done ? "#EAF3DE"  : isOverdue ? "#FCEBEB"  : isUrgent ? "#FAEEDA"  : "#E6F1FB";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 20px",
      borderBottom: "0.5px solid #f1f5f9",
      background: isOverdue ? "#FCEBEB08" : "transparent",
      transition: "background 0.15s",
    }}>
      {/* Date badge */}
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: dateBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `0.5px solid ${dateColor}33` }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: dateColor, lineHeight: 1 }}>{new Date(event.date).getDate()}</span>
        <span style={{ fontSize: 9, color: dateColor, fontWeight: 500 }}>{MONTHS_FR[new Date(event.date).getMonth()].slice(0,3).toUpperCase()}</span>
      </div>

      {/* Type icon */}
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "0.5px solid #e2e8f0" }}>
        {event.type === "projet_fin"   && <Flag size={13} color={event.color} />}
        {event.type === "projet_debut" && <CircleDot size={13} color={event.color} />}
        {event.type === "task"         && <ListTodo size={13} color={event.color} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {event.label}
          </span>
          {isUrgent && !isOverdue && (
            <span style={{ fontSize: 9, color: "#BA7517", background: "#FAEEDA", padding: "1px 6px", borderRadius: 8, fontWeight: 500, flexShrink: 0, border: "0.5px solid #FAC775" }}>
              <Zap size={8} style={{ display: "inline", marginRight: 2 }} />Urgent
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#64748b", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: event.color }} />
            {event.projetName}
          </span>
          {isOverdue && (
            <span style={{ color: "#A32D2D", display: "flex", alignItems: "center", gap: 2 }}>
              <AlertTriangle size={9} /> En retard
            </span>
          )}
          {event.done && (
            <span style={{ color: "#3B6D11", display: "flex", alignItems: "center", gap: 2 }}>
              <CheckCircle2 size={9} /> Terminé
            </span>
          )}
        </div>
      </div>

      {/* Right — date + J- */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: isOverdue ? "#A32D2D" : "#94a3b8", display: "flex", alignItems: "center", gap: 2 }}>
          <Clock size={9} />
          {new Date(event.date).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
        {!event.done && (
          <span style={{ fontSize: 10, fontWeight: 500, color: dateColor, background: dateBg, padding: "1px 7px", borderRadius: 8, border: `0.5px solid ${dateColor}33` }}>
            {isOverdue ? `+${Math.abs(diff)}j` : diff === 0 ? "Aujourd'hui" : `J-${diff}`}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PlanningDates() {
  const { token } = useAuth();
  const [projets, setProjets]   = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [vue, setVue]           = useState("a_venir");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get(`${API}/api/projets/mes-projets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const projetsData = res.data.data || res.data;
        setProjets(projetsData);

        const tasksAll = [];
        await Promise.all(projetsData.map(async (p) => {
          try {
            const rt = await axios.get(`${API}/api/projets/${p.id}/tasks`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const tasks = rt.data.data || rt.data;
            tasks.forEach(t => tasksAll.push({ ...t, projetName: p.name }));
          } catch {}
        }));
        setAllTasks(tasksAll);
      } catch {
        setError("Impossible de charger le planning.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  const buildEvents = () => {
    const events = [];
    projets.forEach(p => {
      if (p.date_start) events.push({ date: p.date_start, label: `Début : ${p.name}`, projetName: p.name, color: STATUS_COLOR[p.last_update_status] || "#888780", type: "projet_debut", done: p.last_update_status === "done" });
      if (p.date_fin)   events.push({ date: p.date_fin,   label: `Fin prévue : ${p.name}`, projetName: p.name, color: STATUS_COLOR[p.last_update_status] || "#888780", type: "projet_fin", done: p.last_update_status === "done" });
    });
    allTasks.forEach(t => {
      if (t.date_deadline) events.push({ date: t.date_deadline, label: t.name, projetName: t.projetName, color: STAGE_COLOR[t.stage_id] || "#888780", type: "task", done: t.stage_id === "Done" });
    });
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const today     = new Date();
  const allEvents = buildEvents();
  const prochains = allEvents.filter(e => new Date(e.date) >= today && !e.done);
  const retards   = allEvents.filter(e => new Date(e.date) < today && !e.done);
  const termines  = allEvents.filter(e => e.done);
  const urgents   = prochains.filter(e => Math.ceil((new Date(e.date) - today) / 86400000) <= 7);

  const vues = [
    { key: "a_venir",  label: "À venir",    count: prochains.length },
    { key: "urgent",   label: "Urgent",      count: urgents.length },
    { key: "retard",   label: "En retard",   count: retards.length },
    { key: "termines", label: "Terminés",    count: termines.length },
    { key: "tous",     label: "Tous",        count: allEvents.length },
  ];

  const displayed =
    vue === "a_venir"  ? prochains :
    vue === "urgent"   ? urgents :
    vue === "retard"   ? retards :
    vue === "termines" ? termines : allEvents;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10, color: "#94a3b8" }}>
      <Loader2 size={20} color="#185FA5" style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13 }}>Chargement du planning…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: "16px 20px", background: "#FCEBEB", borderRadius: 12, color: "#A32D2D", fontSize: 13 }}>{error}</div>
  );

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        <KpiCard label="À venir"    value={prochains.length} color="#185FA5" bg="#E6F1FB" icon={<CalendarDays size={16} color="#185FA5" />} sub={`${urgents.length} urgent${urgents.length > 1 ? "s" : ""}`} />
        <KpiCard label="Urgents"    value={urgents.length}   color="#BA7517" bg="#FAEEDA" icon={<Zap size={16} color="#BA7517" />}          sub="Dans 7 jours" />
        <KpiCard label="En retard"  value={retards.length}   color="#A32D2D" bg="#FCEBEB" icon={<AlertTriangle size={16} color="#A32D2D" />} sub="Délai dépassé" />
        <KpiCard label="Terminés"   value={termines.length}  color="#3B6D11" bg="#EAF3DE" icon={<CheckCircle2 size={16} color="#3B6D11" />}  sub={`Sur ${allEvents.length} total`} />
      </div>

      {/* Calendar full */}
      <CalendarFull events={allEvents} />

      {/* Filtres */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {vues.map(v => (
          <button key={v.key} onClick={() => setVue(v.key)} style={{
            padding: "5px 14px", fontSize: 12,
            fontWeight: vue === v.key ? 500 : 400,
            border: `0.5px solid ${vue === v.key ? "#185FA5" : "#e2e8f0"}`,
            borderRadius: 20, cursor: "pointer",
            background: vue === v.key ? "#E6F1FB" : "#fff",
            color: vue === v.key ? "#185FA5" : "#475569",
          }}>
            {v.label}
            {v.key === "urgent" && v.count > 0 && (
              <span style={{ marginLeft: 5, background: "#BA7517", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 500, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{v.count}</span>
            )}
            {v.key !== "urgent" && <span style={{ opacity: 0.6, marginLeft: 4 }}>({v.count})</span>}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "9px 20px", background: "#f8fafc", borderBottom: "0.5px solid #f1f5f9", display: "grid", gridTemplateColumns: "40px 28px 1fr auto", gap: 12, alignItems: "center" }}>
          {["DATE", "TYPE", "ÉVÉNEMENT", "ÉCHÉANCE"].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8", letterSpacing: "0.4px" }}>{h}</span>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            Aucun événement dans cette catégorie.
          </div>
        ) : (
          displayed.map((e, i) => <EventRow key={i} event={e} today={today} />)
        )}
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12, padding: "10px 0", borderTop: "0.5px solid #f1f5f9" }}>
        {[
          { color: "#185FA5", label: "Début de projet", icon: <CircleDot size={10} color="#185FA5" /> },
          { color: "#3B6D11", label: "Fin prévue",       icon: <Flag size={10} color="#3B6D11" /> },
          { color: "#BA7517", label: "Deadline tâche",   icon: <ListTodo size={10} color="#BA7517" /> },
          { color: "#A32D2D", label: "En retard",        icon: <AlertTriangle size={10} color="#A32D2D" /> },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
            {l.icon} {l.label}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
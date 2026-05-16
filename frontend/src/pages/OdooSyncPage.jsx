import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

export default function OdooSyncPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  useEffect(() => {
    if (token) {
      fetchStatus();
      fetchLogs();
    }
  }, [token]);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await axios.get(`${API}/api/sync/status`, { headers: getHeaders() });
      setStatus({ connected: true, ...res.data.data });
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/api/sync/logs`, { headers: getHeaders() });
      setLogs(res.data.data || []);
    } catch {
      setLogs([]);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await axios.post(`${API}/api/sync/odoo`, {}, { headers: getHeaders() });
      setSyncResult({ success: true, data: res.data.data });
      fetchLogs();
      fetchStatus();
    } catch (err) {
      setSyncResult({ success: false, message: err.response?.data?.message || "Erreur sync" });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString("fr-FR") : "—";

  const statusColor = (s) => {
    if (s === "success") return "#17A84A";
    if (s === "error") return "#E8454A";
    return "#F59E0B";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          🔄 Synchronisation Odoo ERP
        </h1>
        <p style={{ color: "#64748b", marginTop: 6 }}>
          Synchronisation des données entre Odoo et MyPlatforme
        </p>
      </div>

      {/* Status Card */}
      <div style={{
        background: "white", borderRadius: 16, padding: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: status?.connected ? "#dcfce7" : "#fee2e2",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24
          }}>
            {loadingStatus ? "⏳" : status?.connected ? "✅" : "❌"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
              Statut Connexion Odoo
            </div>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              {loadingStatus ? "Vérification..." :
                status?.connected
                  ? `Connecté — DB: ${status.db} (UID: ${status.uid})`
                  : "Non connecté — Vérifiez Odoo"}
            </div>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing || !status?.connected}
          style={{
            background: syncing ? "#94a3b8" : "#00A09D",
            color: "white", border: "none", borderRadius: 10,
            padding: "12px 28px", fontWeight: 700, fontSize: 15,
            cursor: syncing || !status?.connected ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.2s"
          }}
        >
          {syncing ? "⏳ Synchronisation..." : "🔄 Synchroniser maintenant"}
        </button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div style={{
          background: syncResult.success ? "#dcfce7" : "#fee2e2",
          border: `1px solid ${syncResult.success ? "#86efac" : "#fca5a5"}`,
          borderRadius: 12, padding: 20, marginBottom: 24
        }}>
          {syncResult.success ? (
            <div>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 12 }}>
                ✅ Synchronisation réussie!
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Contacts",  value: syncResult.data.contacts,        icon: "👥" },
                  { label: "Projets",   value: syncResult.data.projects,        icon: "📁" },
                  { label: "Tâches",    value: syncResult.data.tasks,           icon: "✅" },
                  { label: "Commandes", value: syncResult.data.purchase_orders, icon: "🛒" },
                  { label: "Factures",  value: syncResult.data.invoices,        icon: "🧾" },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "white", borderRadius: 10, padding: "12px 20px",
                    textAlign: "center", minWidth: 100
                  }}>
                    <div style={{ fontSize: 24 }}>{item.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: "#dc2626", fontWeight: 600 }}>
              ❌ Erreur: {syncResult.message}
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      <div style={{
        background: "white", borderRadius: 16, padding: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            📋 Historique des synchronisations
          </h2>
          <button onClick={fetchLogs} style={{
            background: "#f1f5f9", border: "none", borderRadius: 8,
            padding: "8px 16px", cursor: "pointer", color: "#64748b", fontWeight: 600
          }}>
            🔃 Rafraîchir
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>
            Aucune synchronisation effectuée
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Modèle", "Enregistrements", "Statut", "Message", "Date"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 13, fontWeight: 700, color: "#64748b",
                    borderBottom: "2px solid #e2e8f0"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                    {log.model}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>
                    {log.records_synced}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      background: statusColor(log.status) + "20",
                      color: statusColor(log.status),
                      padding: "4px 12px", borderRadius: 20,
                      fontSize: 12, fontWeight: 700
                    }}>
                      {log.status === "success" ? "✅ Succès" : "❌ Erreur"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>
                    {log.error_message || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>
                    {formatDate(log.synced_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
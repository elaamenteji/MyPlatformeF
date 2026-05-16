// frontend/src/components/NotificationBell.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export default function NotificationBell() {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  // Modal traitement
  const [modalOpen, setModalOpen]         = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [newPassword, setNewPassword]     = useState('');
  const [modalStep, setModalStep]         = useState('form'); // 'form' | 'loading' | 'success' | 'error'
  const [modalError, setModalError]       = useState('');

  const dropdownRef = useRef(null);

  // ── Fetch notifications ───────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('fetchNotifications:', err.message);
    }
  }, []);

  // Poll toutes les 30 secondes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fermer dropdown en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Toggle dropdown + reset badge ────────────────────────
  const handleToggle = () => {
    const newOpen = !open;
    setOpen(newOpen);
    // Ki teftah bass — reset el badge lel 0
    if (newOpen && unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  // ── Ouvrir modal traitement ───────────────────────────────
  const handleTraiter = (notif) => {
    setSelectedNotif(notif);
    setNewPassword('');
    setModalStep('form');
    setModalError('');
    setModalOpen(true);
    setOpen(false);
  };

  // ── Confirmer reset password ──────────────────────────────
  const handleConfirmer = async () => {
    if (!newPassword || newPassword.length < 6) {
      setModalError('Minimum 6 caractères.');
      return;
    }
    setModalStep('loading');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(
        `http://localhost:5000/api/notifications/${selectedNotif.id}/traiter`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setModalStep('success');
        fetchNotifications();
      } else {
        setModalError(res.data.message || 'Erreur.');
        setModalStep('error');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Erreur serveur.');
      setModalStep('error');
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedNotif(null);
    setNewPassword('');
    setModalStep('form');
    setModalError('');
  };

  // ── Format date ───────────────────────────────────────────
  const formatDate = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diff < 1)    return "À l'instant";
    if (diff < 60)   return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const pendingNotifs = notifications.filter(n => n.statut !== 'traitee');

  return (
    <>
      {/* ── Cloche ─────────────────────────────────────────── */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={handleToggle}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
        >
          <span style={{ fontSize: '20px' }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '2px', right: '2px',
              background: '#e03131', color: '#fff',
              fontSize: '10px', fontWeight: '700',
              borderRadius: '10px', minWidth: '16px', height: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', lineHeight: 1,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* ── Dropdown ───────────────────────────────────────── */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#fff', borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            width: '320px', zIndex: 1000,
            border: '1px solid #e2e8f0', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>Notifications</span>
              {pendingNotifs.length > 0 && (
                <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                  {pendingNotifs.length} en attente
                </span>
              )}
            </div>

            {/* Liste */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {pendingNotifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: '13px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                  Aucune notification
                </div>
              ) : (
                pendingNotifs.map(notif => (
                  <div key={notif.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px', borderBottom: '1px solid #f8fafc',
                    background: notif.statut === 'non_lue' ? '#f0f4ff' : '#fff',
                  }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                      👤
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12.5px', fontWeight: '600', color: '#1e293b', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.titre}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTraiter(notif)}
                      style={{ background: '#3b5bdb', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
                    >
                      Traiter
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          MODAL — Traitement reset password
      ══════════════════════════════════════════ */}
      {modalOpen && selectedNotif && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

            {/* ── form ── */}
            {(modalStep === 'form' || modalStep === 'error') && (
              <>
                <div style={{ textAlign: 'center', fontSize: '36px', marginBottom: '12px' }}>🔐</div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', textAlign: 'center', margin: '0 0 6px' }}>
                  Réinitialiser le mot de passe
                </h3>

                {/* Infos user */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', margin: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#3b5bdb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0, textTransform: 'uppercase' }}>
                      {selectedNotif.demandeur_prenom?.[0]}{selectedNotif.demandeur_nom?.[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 2px' }}>
                        {selectedNotif.demandeur_prenom} {selectedNotif.demandeur_nom}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        {selectedNotif.demandeur_email}
                      </p>
                    </div>
                  </div>
                </div>

                {modalStep === 'error' && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
                    {modalError}
                  </div>
                )}

                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Saisir le nouveau mot de passe
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mitech@2026"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '1px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                />
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
                  💡 Le client devra utiliser ce mot de passe pour se connecter.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={closeModal} style={{ flex: 1, padding: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmer}
                    disabled={newPassword.length < 6}
                    style={{ flex: 1, padding: '11px', background: newPassword.length >= 6 ? '#3b5bdb' : '#94a3b8', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: newPassword.length >= 6 ? 'pointer' : 'not-allowed' }}
                  >
                    Confirmer
                  </button>
                </div>
              </>
            )}

            {/* ── loading ── */}
            {modalStep === 'loading' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Mise à jour en cours...</p>
              </div>
            )}

            {/* ── success ── */}
            {modalStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px' }}>
                  Mot de passe réinitialisé !
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: '0 0 20px' }}>
                  Le mot de passe de <strong>{selectedNotif.demandeur_prenom} {selectedNotif.demandeur_nom}</strong> a été mis à jour.<br />
                  Le client peut maintenant se connecter avec le nouveau code.
                </p>
                <button onClick={closeModal} style={{ width: '100%', padding: '12px', background: '#3b5bdb', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
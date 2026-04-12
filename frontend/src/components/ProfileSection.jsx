// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ProfileSection.jsx — Section Profil
// Component réutilisable lil kol dashboards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// useState → ardoise (tkhazzen el valeurs)
// useEffect → ycharrej el data ki el page tiftah
import { useState, useEffect } from 'react';

// useAuth → njibou user (nom, prenom, email...)
import { useAuth } from '../context/AuthContext';

// axios → ykallem el backend
import axios from 'axios';

const ProfileSection = ({ accentColor = '#2563eb' }) => {
  // accentColor → couleur mte3 kol rôle
  // admin = bleu, client = vert, fournisseur = safra...

  const { user } = useAuth();

  // States mte3 el profil
  const [profil,   setProfil]   = useState({ nom: '', prenom: '', telephone: '' });
  const [password, setPassword] = useState({ ancien: '', nouveau: '', confirm: '' });
  const [tab,      setTab]      = useState('profil'); // 'profil' ou 'password'
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState({ text: '', type: '' });

  // Ki el component yftah → ycharrej infos profil men backend
  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const { data } = await axios.get('/api/users/me');
        setProfil({
          nom:       data.data.nom       || '',
          prenom:    data.data.prenom    || '',
          telephone: data.data.telephone || '',
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfil();
  }, []);

  // Afficher message w yamshih ba3d 3 secondes
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // ── Modifier Profil ──
  const handleUpdateProfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/api/users/profil', profil);
      showMessage('Profil mis à jour avec succès!', 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Erreur serveur.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Changer Password ──
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Ychek eli nouveau = confirm
    if (password.nouveau !== password.confirm)
      return showMessage('Les mots de passe ne correspondent pas.', 'error');

    // Ychek longueur
    if (password.nouveau.length < 8)
      return showMessage('Minimum 8 caractères.', 'error');

    setLoading(true);
    try {
      await axios.put('/api/auth/password', {
        ancien:  password.ancien,
        nouveau: password.nouveau,
      });
      showMessage('Mot de passe modifié avec succès!', 'success');
      setPassword({ ancien: '', nouveau: '', confirm: '' });
    } catch (err) {
      showMessage(err.response?.data?.message || 'Erreur serveur.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initiales avatar
  const initiales = ((user?.prenom?.[0] || '') + (user?.nom?.[0] || '')).toUpperCase();

  return (
    <div style={{ maxWidth: 600 }}>

      {/* ── Avatar + Nom ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0
        }}>
          {initiales}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            {user?.prenom} {user?.nom}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
        {[
          { id: 'profil',   label: 'Informations personnelles' },
          { id: 'password', label: 'Mot de passe' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px 16px', borderRadius: 8,
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? accentColor : '#64748b',
            transition: 'all 0.15s', fontFamily: 'sans-serif',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Message ── */}
      {message.text && (
        <div style={{
          padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          marginBottom: 20,
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color:      message.type === 'success' ? '#16a34a' : '#dc2626',
          border:     `0.5px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
        </div>
      )}

      {/* ── Tab Profil ── */}
      {tab === 'profil' && (
        <form onSubmit={handleUpdateProfil} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Prénom + Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Prénom', key: 'prenom', placeholder: 'Votre prénom' },
              { label: 'Nom',    key: 'nom',    placeholder: 'Votre nom' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  {f.label}
                </label>
                <input
                  value={profil[f.key]}
                  onChange={e => setProfil({ ...profil, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', color: '#0f172a', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>

          {/* Email — readonly */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
              Email (non modifiable)
            </label>
            <input
              value={user?.email || ''}
              readOnly
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#94a3b8', background: '#f8fafc', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
              Téléphone
            </label>
            <input
              value={profil.telephone}
              onChange={e => setProfil({ ...profil, telephone: e.target.value })}
              placeholder="+216 XX XXX XXX"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', color: '#0f172a', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
            />
          </div>

          {/* Bouton */}
          <button type="submit" disabled={loading} style={{
            padding: '12px', background: accentColor, color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: 'sans-serif', marginTop: 4
          }}>
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

        </form>
      )}

      {/* ── Tab Password ── */}
      {tab === 'password' && (
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {[
            { label: 'Mot de passe actuel',     key: 'ancien',   placeholder: '••••••••' },
            { label: 'Nouveau mot de passe',    key: 'nouveau',  placeholder: '••••••••' },
            { label: 'Confirmer mot de passe',  key: 'confirm',  placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                type="password"
                value={password[f.key]}
                onChange={e => setPassword({ ...password, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', color: '#0f172a', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          {/* Info */}
          <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#64748b' }}>
            ℹ️ Minimum 8 caractères
          </div>

          {/* Bouton */}
          <button type="submit" disabled={loading} style={{
            padding: '12px', background: accentColor, color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: 'sans-serif'
          }}>
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>

        </form>
      )}

    </div>
  );
};

export default ProfileSection;
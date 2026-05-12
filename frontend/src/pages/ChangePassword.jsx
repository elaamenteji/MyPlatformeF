import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [nouveau,   setNouveau]  = useState('');
  const [confirm,   setConfirm]  = useState('');
  const [showPass,  setShowPass] = useState(false);
  const [showPass2, setShowPass2]= useState(false);
  const [error,     setError]    = useState('');
  const [loading,   setLoading]  = useState(false);
  const [success,   setSuccess]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (nouveau.length < 8) return setError('Minimum 8 caractères.');
    if (nouveau !== confirm) return setError('Les mots de passe ne correspondent pas.');

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API}/api/auth/password`, 
        { ancien: localStorage.getItem('tempPassword'), nouveau },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Met à jour must_change_password dans localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      user.must_change_password = false;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('tempPassword');

      setSuccess(true);
      setTimeout(() => {
        const role = user.role;
        if (role === 'admin')       navigate('/admin');
        else if (role === 'client') navigate('/client');
        else if (role === 'fournisseur') navigate('/fournisseur');
        else navigate('/partenaire');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '3rem 2.5rem', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Mot de passe modifié !</h2>
        <p style={{ fontSize: 13, color: '#64748b' }}>Redirection en cours...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem 2.2rem', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '0.5px solid #e2e8f0' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo_mitech.png" alt="Mitech" style={{ height: 60, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Lock size={24} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Changement de mot de passe</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Pour votre sécurité, veuillez choisir un nouveau mot de passe.</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, padding: '4px 12px', background: '#fff7ed', border: '1px solid #fcd34d', borderRadius: 20, fontSize: 11, fontWeight: 500, color: '#d97706' }}>
            ⚠️ Première connexion — changement obligatoire
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 6, fontWeight: 500 }}>Nouveau mot de passe</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', gap: 10 }}>
              <Lock size={15} color="#94a3b8" />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={nouveau} onChange={e => setNouveau(e.target.value)} required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {nouveau.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: nouveau.length >= i*2 ? i<=1?'#ef4444':i<=2?'#f97316':i<=3?'#eab308':'#16a34a' : '#e2e8f0', transition: 'background 0.2s' }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: nouveau.length<4?'#ef4444':nouveau.length<6?'#f97316':nouveau.length<8?'#eab308':'#16a34a' }}>
                  {nouveau.length<4?'Très faible':nouveau.length<6?'Faible':nouveau.length<8?'Moyen':'Fort ✓'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 6, fontWeight: 500 }}>Confirmer le mot de passe</label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${confirm && nouveau !== confirm ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px', gap: 10 }}>
              <Lock size={15} color="#94a3b8" />
              <input type={showPass2 ? 'text' : 'password'} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }} />
              <button type="button" onClick={() => setShowPass2(!showPass2)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                {showPass2 ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm && nouveau !== confirm && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>Les mots de passe ne correspondent pas.</p>}
            {confirm && nouveau === confirm && confirm.length > 0 && <p style={{ fontSize: 12, color: '#16a34a', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} /> Correspondent.</p>}
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}

          <button type="submit" disabled={loading || nouveau !== confirm || nouveau.length < 8}
            style={{ width: '100%', padding: 13, background: loading || nouveau !== confirm || nouveau.length < 8 ? '#94a3b8' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading || nouveau !== confirm || nouveau.length < 8 ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}>
            {loading ? 'Enregistrement...' : 'Enregistrer mon nouveau mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
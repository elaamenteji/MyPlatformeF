  // frontend/src/pages/FournisseurDashboard.jsx
  import { useState, useEffect } from 'react';
  import { useAuth } from '../context/AuthContext';
  import { useNavigate } from 'react-router-dom';
  import axios from 'axios';
  import {
    LayoutDashboard, ShoppingCart, FileText, History,
    UserCircle, LogOut, CheckCircle2, AlertTriangle,
    Clock, ArrowRight, TrendingUp, Package, CreditCard,
    ChevronDown, ChevronUp, Loader2, Ban, XCircle,
    CircleDot, ArrowUpRight,
  } from 'lucide-react';
  import ProfileSection from '../components/ProfileSection';

  const API = 'http://localhost:5000';

  // ── Odoo 17 Modern Palette ────────────────────────────────────
  const P = {
    teal:      '#00A09D', tealBg:   '#E6F7F7', tealBd:   '#99DDD9',
    green:     '#17A84A', greenBg:  '#E8F7EE', greenBd:  '#8DD5A8',
    amber:     '#F59E0B', amberBg:  '#FEF3C7', amberBd:  '#FCD34D',
    red:       '#E8454A', redBg:    '#FDECEC', redBd:    '#F9A8A8',
    indigo:    '#6366F1', indigoBg: '#EEF2FF', indigoBd: '#C7D2FE',
    purple:    '#8B5CF6', purpleBg: '#F5F3FF', purpleBd: '#DDD6FE',
    txt:       '#1F2937', txtMid:   '#6B7280', txtMute:  '#9CA3AF',
    border:    '#E5E7EB', bg:       '#F9FAFB', surface:  '#FFFFFF',
    shadow:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    shadowMd:  '0 4px 16px rgba(0,0,0,0.08)',
  };

  const CMD_STATE = {
    draft:    { label: 'Brouillon', color: P.txtMute, bg: P.bg,       border: P.border   },
    sent:     { label: 'Envoyé',    color: P.indigo,  bg: P.indigoBg, border: P.indigoBd },
    purchase: { label: 'Confirmé',  color: P.teal,    bg: P.tealBg,   border: P.tealBd   },
    done:     { label: 'Terminé',   color: P.green,   bg: P.greenBg,  border: P.greenBd  },
    cancel:   { label: 'Annulé',    color: P.red,     bg: P.redBg,    border: P.redBd    },
  };

  const PAY_STATE = {
    not_paid:   { label: 'Non payé',    color: P.red,    bg: P.redBg,    border: P.redBd    },
    in_payment: { label: 'En cours',    color: P.amber,  bg: P.amberBg,  border: P.amberBd  },
    paid:       { label: 'Payé',        color: P.green,  bg: P.greenBg,  border: P.greenBd  },
    partial:    { label: 'Partiel',     color: P.amber,  bg: P.amberBg,  border: P.amberBd  },
    reversed:   { label: 'Extourné',    color: P.purple, bg: P.purpleBg, border: P.purpleBd },
  };

  const initiales = (nom, prenom) =>
    ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();

  const fmt = (n) => parseFloat(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  function Badge({ config }) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: config.bg, color: config.color, border: `1px solid ${config.border}`, flexShrink: 0 }}>
        {config.label}
      </span>
    );
  }

  function KpiCard({ label, value, sub, color, bg, border, icon, onClick }) {
    return (
      <div
        onClick={onClick}
        style={{ background: bg, borderRadius: 14, padding: '16px', border: `1px solid ${border}`, boxShadow: P.shadow, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s' }}
        onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = P.shadowMd)}
        onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = P.shadow)}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: P.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: P.shadow }}>
          {icon}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, marginBottom: 3 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color, opacity: 0.65 }}>{sub}</div>}
      </div>
    );
  }

  // ── Dashboard Home ────────────────────────────────────────────
  function DashboardHome({ user, token, onNavigate }) {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      axios.get(`${API}/api/fournisseur/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => setData(res.data.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, [token]);

    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: P.txtMute }}>
        <div style={{ width: 20, height: 20, border: `2px solid ${P.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13 }}>Chargement…</span>
      </div>
    );

    const c = data?.commandes || {};
    const f = data?.factures  || {};
    const totalPaye   = parseFloat(f.total_facture || 0) - parseFloat(f.restant || 0);
    const pctPaiement = parseFloat(f.total_facture) > 0
      ? Math.round((totalPaye / parseFloat(f.total_facture)) * 100) : 0;

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
          <KpiCard label="Commandes" value={c.total_commandes || 0} color={P.teal} bg={P.tealBg} border={P.tealBd} icon={<ShoppingCart size={16} color={P.teal} />} sub={`${c.commandes_confirmees || 0} confirmées`} onClick={() => onNavigate('commandes')} />
          <KpiCard label="Montant confirmé" value={`${fmt(c.montant_commandes)} TND`} color={P.indigo} bg={P.indigoBg} border={P.indigoBd} icon={<Package size={16} color={P.indigo} />} sub="Commandes confirmées" />
          <KpiCard label="Total facturé" value={`${fmt(f.total_facture)} TND`} color={P.green} bg={P.greenBg} border={P.greenBd} icon={<FileText size={16} color={P.green} />} sub={`${f.nb_factures || 0} factures`} onClick={() => onNavigate('factures')} />
          <KpiCard label="Restant dû" value={`${fmt(f.restant)} TND`} color={parseFloat(f.restant) > 0 ? P.red : P.green} bg={parseFloat(f.restant) > 0 ? P.redBg : P.greenBg} border={parseFloat(f.restant) > 0 ? P.redBd : P.greenBd} icon={<CreditCard size={16} color={parseFloat(f.restant) > 0 ? P.red : P.green} />} sub={`${f.en_retard || 0} en retard`} onClick={() => onNavigate('factures')} />
        </div>

        {/* Progress paiement */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: '16px 20px', boxShadow: P.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <TrendingUp size={13} color={P.teal} />
              <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Avancement des paiements</span>
            </div>
            <span style={{ fontSize: 11, color: P.txtMute }}>{fmt(totalPaye)} / {fmt(f.total_facture)} TND</span>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: P.bg, overflow: 'hidden', marginBottom: 8, border: `1px solid ${P.border}` }}>
            <div style={{ width: `${pctPaiement}%`, height: '100%', background: `linear-gradient(90deg, ${P.teal}, ${P.green})`, borderRadius: 8, transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.txtMute }}>
            <span>0%</span>
            <span style={{ color: P.teal, fontWeight: 600 }}>{pctPaiement}% réglé</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dernières commandes + Dernières factures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* Commandes récentes */}
          <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: P.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <ShoppingCart size={13} color={P.teal} />
                <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Dernières commandes</span>
              </div>
              <button onClick={() => onNavigate('commandes')} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: P.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Voir tout <ArrowRight size={10} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '6px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
              {['RÉFÉRENCE', 'DATE', 'STATUT'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
            </div>
            {(data?.recent_commandes || []).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: P.txtMute, fontSize: 13 }}>Aucune commande.</div>
            ) : (data?.recent_commandes || []).map((cmd, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '10px 16px', borderBottom: `1px solid ${P.border}`, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>{cmd.name}</div>
                  <div style={{ fontSize: 10, color: P.txtMute, marginTop: 1 }}>{fmt(cmd.amount_total)} TND</div>
                </div>
                <div style={{ fontSize: 10, color: P.txtMid }}>{fmtDate(cmd.date_order)}</div>
                <Badge config={CMD_STATE[cmd.state] || CMD_STATE.draft} />
              </div>
            ))}
          </div>

          {/* Factures récentes */}
          <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: P.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <FileText size={13} color={P.green} />
                <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>Dernières factures</span>
              </div>
              <button onClick={() => onNavigate('factures')} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: P.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Voir tout <ArrowRight size={10} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '6px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
              {['RÉFÉRENCE', 'MONTANT', 'PAIEMENT'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
            </div>
            {(data?.recent_factures || []).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: P.txtMute, fontSize: 13 }}>Aucune facture.</div>
            ) : (data?.recent_factures || []).map((fac, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '10px 16px', borderBottom: `1px solid ${P.border}`, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>{fac.name}</div>
                  <div style={{ fontSize: 10, color: P.txtMute, marginTop: 1 }}>{fmtDate(fac.invoice_date)}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: P.txt }}>{fmt(fac.amount_total)}</div>
                <Badge config={PAY_STATE[fac.payment_state] || PAY_STATE.not_paid} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Commandes Page ────────────────────────────────────────────
  function CommandesPage({ token }) {
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [filtre, setFiltre]       = useState('tous');
    const [expanded, setExpanded]   = useState(null);
    const [detail, setDetail]       = useState({});

    useEffect(() => {
      axios.get(`${API}/api/fournisseur/commandes`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => setCommandes(res.data.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [token]);

    const toggleDetail = async (id) => {
      if (expanded === id) { setExpanded(null); return; }
      setExpanded(id);
      if (detail[id]) return;
      try {
        const res = await axios.get(`${API}/api/fournisseur/commandes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDetail(d => ({ ...d, [id]: res.data.data }));
      } catch {}
    };

    const filtres = [
      { key: 'tous',     label: 'Toutes' },
      { key: 'draft',    label: 'Brouillon' },
      { key: 'sent',     label: 'Envoyé' },
      { key: 'purchase', label: 'Confirmé' },
      { key: 'done',     label: 'Terminé' },
      { key: 'cancel',   label: 'Annulé' },
    ];

    const filtered = filtre === 'tous' ? commandes : commandes.filter(c => c.state === filtre);

    const stats = {
      total:     commandes.length,
      confirme:  commandes.filter(c => c.state === 'purchase' || c.state === 'done').length,
      montant:   commandes.filter(c => ['purchase','done'].includes(c.state)).reduce((s,c) => s + parseFloat(c.amount_total||0), 0),
      enCours:   commandes.filter(c => c.state === 'sent').length,
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: P.txtMute }}><Loader2 size={18} color={P.teal} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 13 }}>Chargement…</span></div>;

    return (
      <div>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          <KpiCard label="Total commandes" value={stats.total}               color={P.teal}   bg={P.tealBg}   border={P.tealBd}   icon={<ShoppingCart size={15} color={P.teal} />}  sub="Toutes périodes"       />
          <KpiCard label="Confirmées"      value={stats.confirme}            color={P.green}  bg={P.greenBg}  border={P.greenBd}  icon={<CheckCircle2 size={15} color={P.green} />} sub="Purchase + Done"       />
          <KpiCard label="En attente"      value={stats.enCours}             color={P.amber}  bg={P.amberBg}  border={P.amberBd}  icon={<Clock size={15} color={P.amber} />}        sub="Envoyées"              />
          <KpiCard label="Montant confirmé" value={`${fmt(stats.montant)} TND`} color={P.indigo} bg={P.indigoBg} border={P.indigoBd} icon={<Package size={15} color={P.indigo} />}   sub="Commandes validées"    />
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {filtres.map(f => (
            <button key={f.key} onClick={() => setFiltre(f.key)} style={{ padding: '5px 14px', fontSize: 12, fontWeight: filtre === f.key ? 600 : 400, border: `1px solid ${filtre === f.key ? P.teal : P.border}`, borderRadius: 20, cursor: 'pointer', background: filtre === f.key ? P.tealBg : P.surface, color: filtre === f.key ? P.teal : P.txtMid, transition: 'all 0.15s' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: P.surface, borderRadius: 14, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: P.shadow }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 110px 90px 80px', padding: '8px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
            {['RÉFÉRENCE', 'DATE', 'LIVRAISON', 'MONTANT', 'STATUT', ''].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: P.txtMute, fontSize: 13 }}>Aucune commande.</div>
          ) : filtered.map(cmd => (
            <div key={cmd.id}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 110px 90px 80px', padding: '12px 16px', borderBottom: `1px solid ${P.border}`, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: P.txt }}>{cmd.name}</div>
                  {cmd.notes && <div style={{ fontSize: 10, color: P.txtMute, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{cmd.notes}</div>}
                </div>
                <div style={{ fontSize: 11, color: P.txtMid }}>{fmtDate(cmd.date_order)}</div>
                <div style={{ fontSize: 11, color: cmd.date_planned && new Date(cmd.date_planned) < new Date() && cmd.state !== 'done' ? P.red : P.txtMid }}>{fmtDate(cmd.date_planned)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>{fmt(cmd.amount_total)} <span style={{ fontSize: 10, color: P.txtMute }}>TND</span></div>
                <Badge config={CMD_STATE[cmd.state] || CMD_STATE.draft} />
                <button onClick={() => toggleDetail(cmd.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, border: `1px solid ${P.border}`, borderRadius: 8, background: P.surface, color: P.txtMid, cursor: 'pointer', fontWeight: 500 }}>
                  {expanded === cmd.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {expanded === cmd.id ? 'Masquer' : 'Détail'}
                </button>
              </div>

              {/* Lignes commande */}
              {expanded === cmd.id && detail[cmd.id] && (
                <div style={{ padding: '12px 16px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: P.txtMid, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Lignes de commande</div>
                  <div style={{ background: P.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${P.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 100px', padding: '6px 12px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                      {['PRODUIT', 'QTÉ', 'UNITÉ', 'P.U.', 'TOTAL HT'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute }}>{h}</span>)}
                    </div>
                    {(detail[cmd.id].lines || []).map((line, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 100px', padding: '9px 12px', borderBottom: `1px solid ${P.border}`, alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: P.txt, fontWeight: 500 }}>{line.name}</span>
                        <span style={{ color: P.txtMid }}>{parseFloat(line.product_qty).toFixed(0)}</span>
                        <span style={{ color: P.txtMute }}>{line.product_uom}</span>
                        <span style={{ color: P.txtMid }}>{fmt(line.price_unit)}</span>
                        <span style={{ color: P.txt, fontWeight: 600 }}>{fmt(line.price_subtotal)} TND</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '10px 12px', background: P.tealBg, borderTop: `1px solid ${P.tealBd}` }}>
                      <span style={{ fontSize: 11, color: P.txtMid }}>Sous-total: <strong style={{ color: P.txt }}>{fmt(cmd.amount_untaxed)} TND</strong></span>
                      <span style={{ fontSize: 11, color: P.txtMid }}>TVA: <strong style={{ color: P.txt }}>{fmt(cmd.amount_tax)} TND</strong></span>
                      <span style={{ fontSize: 12, color: P.teal, fontWeight: 700 }}>Total TTC: {fmt(cmd.amount_total)} TND</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Factures Page ─────────────────────────────────────────────
  function FacturesPage({ token }) {
    const [factures, setFactures]   = useState([]);
    const [stats, setStats]         = useState(null);
    const [loading, setLoading]     = useState(true);
    const [filtre, setFiltre]       = useState('tous');
    const [expanded, setExpanded]   = useState(null);
    const [detail, setDetail]       = useState({});

    useEffect(() => {
      Promise.all([
        axios.get(`${API}/api/fournisseur/factures`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/fournisseur/factures/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]).then(([fRes, sRes]) => {
        setFactures(fRes.data.data || []);
        setStats(sRes.data.data);
      }).catch(console.error).finally(() => setLoading(false));
    }, [token]);

    const toggleDetail = async (id) => {
      if (expanded === id) { setExpanded(null); return; }
      setExpanded(id);
      if (detail[id]) return;
      try {
        const res = await axios.get(`${API}/api/fournisseur/factures/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setDetail(d => ({ ...d, [id]: res.data.data }));
      } catch {}
    };

    const filtres = [
      { key: 'tous',       label: 'Toutes'     },
      { key: 'not_paid',   label: 'Non payé'   },
      { key: 'partial',    label: 'Partiel'    },
      { key: 'paid',       label: 'Payé'       },
      { key: 'in_payment', label: 'En cours'   },
    ];

    const filtered = filtre === 'tous' ? factures : factures.filter(f => f.payment_state === filtre);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: P.txtMute }}><Loader2 size={18} color={P.teal} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 13 }}>Chargement…</span></div>;

    return (
      <div>
        {/* KPIs */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <KpiCard label="Total facturé"  value={`${fmt(stats.total_facture)} TND`}  color={P.teal}   bg={P.tealBg}   border={P.tealBd}   icon={<FileText size={15} color={P.teal} />}      sub={`${stats.nb_factures} factures`}    />
            <KpiCard label="Montant payé"   value={`${fmt(stats.total_paye)} TND`}     color={P.green}  bg={P.greenBg}  border={P.greenBd}  icon={<CheckCircle2 size={15} color={P.green} />} sub="Réglé"                              />
            <KpiCard label="Restant dû"     value={`${fmt(stats.total_restant)} TND`}  color={parseFloat(stats.total_restant)>0 ? P.red : P.green} bg={parseFloat(stats.total_restant)>0 ? P.redBg : P.greenBg} border={parseFloat(stats.total_restant)>0 ? P.redBd : P.greenBd} icon={<CreditCard size={15} color={parseFloat(stats.total_restant)>0 ? P.red : P.green} />} sub="À régler" />
            <KpiCard label="Avoirs"         value={stats.nb_avoirs || 0}              color={P.purple} bg={P.purpleBg} border={P.purpleBd} icon={<ArrowUpRight size={15} color={P.purple} />} sub="Notes de crédit"                   />
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {filtres.map(f => (
            <button key={f.key} onClick={() => setFiltre(f.key)} style={{ padding: '5px 14px', fontSize: 12, fontWeight: filtre === f.key ? 600 : 400, border: `1px solid ${filtre === f.key ? P.teal : P.border}`, borderRadius: 20, cursor: 'pointer', background: filtre === f.key ? P.tealBg : P.surface, color: filtre === f.key ? P.teal : P.txtMid }}>
              {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>({factures.filter(x => f.key === 'tous' ? true : x.payment_state === f.key).length})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: P.surface, borderRadius: 14, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: P.shadow }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 110px 100px 80px', padding: '8px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
            {['FACTURE', 'DATE', 'ÉCHÉANCE', 'MONTANT', 'PAIEMENT', ''].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: P.txtMute, fontSize: 13 }}>Aucune facture.</div>
          ) : filtered.map(fac => {
            const isOverdue = fac.invoice_date_due && new Date(fac.invoice_date_due) < new Date() && fac.payment_state === 'not_paid';
            const isAvoir   = fac.move_type === 'in_refund';
            return (
              <div key={fac.id}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 110px 100px 80px', padding: '12px 16px', borderBottom: `1px solid ${P.border}`, alignItems: 'center', background: isOverdue ? '#FFF8F8' : P.surface }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: P.txt }}>{fac.name}</span>
                      {isAvoir && <span style={{ fontSize: 10, color: P.purple, background: P.purpleBg, padding: '1px 6px', borderRadius: 8, fontWeight: 500, border: `1px solid ${P.purpleBd}` }}>Avoir</span>}
                      {isOverdue && <span style={{ fontSize: 10, color: P.red, background: P.redBg, padding: '1px 6px', borderRadius: 8, fontWeight: 500 }}>⚠ En retard</span>}
                    </div>
                    {fac.po_name && <div style={{ fontSize: 10, color: P.txtMute, marginTop: 1 }}>Réf: {fac.po_name}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: P.txtMid }}>{fmtDate(fac.invoice_date)}</div>
                  <div style={{ fontSize: 11, color: isOverdue ? P.red : P.txtMid, fontWeight: isOverdue ? 600 : 400 }}>{fmtDate(fac.invoice_date_due)}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>{fmt(fac.amount_total)} <span style={{ fontSize: 10, color: P.txtMute }}>TND</span></div>
                    {parseFloat(fac.amount_residual) > 0 && (
                      <div style={{ fontSize: 10, color: P.red }}>Restant: {fmt(fac.amount_residual)} TND</div>
                    )}
                  </div>
                  <Badge config={PAY_STATE[fac.payment_state] || PAY_STATE.not_paid} />
                  <button onClick={() => toggleDetail(fac.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, border: `1px solid ${P.border}`, borderRadius: 8, background: P.surface, color: P.txtMid, cursor: 'pointer', fontWeight: 500 }}>
                    {expanded === fac.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    Détail
                  </button>
                </div>

                {expanded === fac.id && detail[fac.id] && (
                  <div style={{ padding: '12px 16px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                    <div style={{ background: P.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${P.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px', padding: '6px 12px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
                        {['DÉSIGNATION', 'QTÉ', 'P.U.', 'TOTAL'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute }}>{h}</span>)}
                      </div>
                      {(detail[fac.id].lines || []).map((line, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px', padding: '9px 12px', borderBottom: `1px solid ${P.border}`, alignItems: 'center', fontSize: 12 }}>
                          <span style={{ color: P.txt, fontWeight: 500 }}>{line.name}</span>
                          <span style={{ color: P.txtMid }}>{parseFloat(line.quantity).toFixed(0)}</span>
                          <span style={{ color: P.txtMid }}>{fmt(line.price_unit)}</span>
                          <span style={{ color: P.txt, fontWeight: 600 }}>{fmt(line.price_total)} TND</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, padding: '10px 12px', background: P.greenBg, borderTop: `1px solid ${P.greenBd}` }}>
                        <span style={{ fontSize: 11, color: P.txtMid }}>HT: <strong>{fmt(fac.amount_untaxed)} TND</strong></span>
                        <span style={{ fontSize: 11, color: P.txtMid }}>TVA: <strong>{fmt(fac.amount_tax)} TND</strong></span>
                        <span style={{ fontSize: 12, color: P.green, fontWeight: 700 }}>TTC: {fmt(fac.amount_total)} TND</span>
                      </div>
                    </div>
                    {fac.narration && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: P.surface, borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 11, color: P.txtMid }}>
                        📝 {fac.narration}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Historique Page ───────────────────────────────────────────
  function HistoriquePage({ token }) {
    const [historique, setHistorique] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [filtre, setFiltre]         = useState('tous');

    useEffect(() => {
      axios.get(`${API}/api/fournisseur/historique`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setHistorique(res.data.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [token]);

    const filtered = filtre === 'tous' ? historique
      : filtre === 'facture' ? historique.filter(h => h.move_type === 'in_invoice')
      : historique.filter(h => h.move_type === 'in_refund');

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: P.txtMute }}><Loader2 size={18} color={P.teal} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 13 }}>Chargement…</span></div>;

    return (
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[{ key: 'tous', label: 'Tout' }, { key: 'facture', label: 'Factures' }, { key: 'avoir', label: 'Avoirs' }].map(f => (
            <button key={f.key} onClick={() => setFiltre(f.key)} style={{ padding: '5px 14px', fontSize: 12, fontWeight: filtre === f.key ? 600 : 400, border: `1px solid ${filtre === f.key ? P.teal : P.border}`, borderRadius: 20, cursor: 'pointer', background: filtre === f.key ? P.tealBg : P.surface, color: filtre === f.key ? P.teal : P.txtMid }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ background: P.surface, borderRadius: 14, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: P.shadow }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 120px 100px 110px', padding: '8px 16px', background: P.bg, borderBottom: `1px solid ${P.border}` }}>
            {['RÉFÉRENCE', 'DATE', 'MONTANT', 'PAYÉ', 'RESTANT', 'SOLDE CUMULÉ'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, color: P.txtMute, letterSpacing: '0.4px' }}>{h}</span>)}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: P.txtMute, fontSize: 13 }}>Aucune écriture.</div>
          ) : filtered.map((h, i) => {
            const isAvoir   = h.move_type === 'in_refund';
            const totalPaye = parseFloat(h.amount_total) - parseFloat(h.amount_residual);
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 120px 100px 110px', padding: '11px 16px', borderBottom: `1px solid ${P.border}`, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: P.txt }}>{h.name}</span>
                    {isAvoir && <span style={{ fontSize: 10, color: P.purple, background: P.purpleBg, padding: '1px 6px', borderRadius: 8, border: `1px solid ${P.purpleBd}` }}>Avoir</span>}
                  </div>
                  {h.po_name && <div style={{ fontSize: 10, color: P.txtMute }}>Réf: {h.po_name}</div>}
                </div>
                <div style={{ fontSize: 11, color: P.txtMid }}>{fmtDate(h.invoice_date)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isAvoir ? P.purple : P.txt }}>
                  {isAvoir ? '−' : '+'}{fmt(h.amount_total)} TND
                </div>
                <div style={{ fontSize: 12, color: P.green, fontWeight: 500 }}>{fmt(totalPaye)} TND</div>
                <div style={{ fontSize: 12, color: parseFloat(h.amount_residual) > 0 ? P.red : P.green, fontWeight: 500 }}>{fmt(h.amount_residual)} TND</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: parseFloat(h.solde_cumul) > 0 ? P.teal : P.green }}>{fmt(h.solde_cumul)} TND</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Main FournisseurDashboard ─────────────────────────────────
  const FournisseurDashboard = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('dashboard');

    const handleLogout = async () => { await logout(); navigate('/login'); };

    const navItems = [
      { id: 'dashboard',  label: 'Tableau de bord', icon: <LayoutDashboard size={14} /> },
      { id: 'commandes',  label: 'Commandes',        icon: <ShoppingCart size={14} />    },
      { id: 'factures',   label: 'Factures',          icon: <FileText size={14} />        },
      { id: 'historique', label: 'Historique',        icon: <History size={14} />         },
      { id: 'profil',     label: 'Mon Profil',        icon: <UserCircle size={14} />      },
    ];

    const pageTitle = {
      dashboard:  'Tableau de bord',
      commandes:  'Mes commandes',
      factures:   'Factures & paiements',
      historique: 'Historique comptable',
      profil:     'Mon Profil',
    };

    return (
      <>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --c-teal:#00A09D; --c-teal-bg:#E6F7F7; --c-green:#17A84A; --c-green-bg:#E8F7EE;
            --c-amber:#F59E0B; --c-amber-bg:#FEF3C7; --c-red:#E8454A; --c-red-bg:#FDECEC;
            --c-indigo:#6366F1; --c-indigo-bg:#EEF2FF; --c-txt:#1F2937;
            --c-border:#E5E7EB; --c-bg:#F9FAFB; --c-surface:#FFFFFF;
            --r-lg:14px; --r-md:8px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        `}</style>

        <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: P.bg }}>

          {/* Sidebar */}
          <div style={{ width: 220, background: P.surface, borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '16px', borderBottom: `1px solid ${P.border}` }}>
              <img src="/logo_mitech.png" alt="Mitech" style={{ height: 44, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              <div style={{ fontSize: 12, fontWeight: 600, color: P.txt, marginTop: 6 }}>Mitech Tunisie</div>
              <div style={{ fontSize: 10, color: P.txtMute }}>Espace Fournisseur</div>
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
                  <div style={{ fontSize: 10, color: P.txtMute }}>Fournisseur</div>
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
              {activePage === 'dashboard'  && <DashboardHome user={user} token={token} onNavigate={setActivePage} />}
              {activePage === 'commandes'  && <CommandesPage token={token} />}
              {activePage === 'factures'   && <FacturesPage token={token} />}
              {activePage === 'historique' && <HistoriquePage token={token} />}
              {activePage === 'profil'     && <ProfileSection accentColor={P.teal} />}
            </div>
          </div>
        </div>
      </>
    );
  };

  export default FournisseurDashboard;
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

// ──────────────────────────────────────────────────
// 1. DÉFINITION DES FONCTIONS
// ──────────────────────────────────────────────────

// ── LISTE TOUS LES UTILISATEURS (Admin only) ──
const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, prenom, email, telephone,
              statut, avatar_url, role, role_label,
              created_at, updated_at
       FROM v_users
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── PROFIL PERSONNEL (L'utilisateur connecté) ──
const getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, prenom, email, telephone,
              statut, avatar_url, role, role_label, created_at
       FROM v_users WHERE id=$1`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── CRÉER UN UTILISATEUR (Par l'admin) ──
const create = async (req, res) => {
  const { nom, prenom, email, mot_de_passe, telephone, role_id } = req.body;

  // Verification mtaa el champs obligatoires
  if (!nom || !prenom || !email || !mot_de_passe || !role_id)
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });

  try {
    // Check ken l-email deja mawjoud
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length)
      return res.status(409).json({ success: false, message: 'Email déjà utilisé.' });

    // Hachage mtaa el password mtaa el user jdid
    const hash = await bcrypt.hash(mot_de_passe, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, telephone, role_id, statut)
       VALUES ($1,$2,$3,$4,$5,$6,'inactif') RETURNING id`,
      [nom, prenom, email.toLowerCase(), hash, telephone || null, role_id]
    );

    res.status(201).json({ success: true, message: 'Utilisateur créé.', id: rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── ACTIVER / BLOQUER LE STATUT ──
const updateStatut = async (req, res) => {
  const { statut } = req.body;
  
  if (!['actif', 'inactif', 'bloque'].includes(statut))
    return res.status(400).json({ success: false, message: 'Statut invalide.' });

  try {
    const { rowCount } = await pool.query(
      'UPDATE users SET statut=$1 WHERE id=$2',
      [statut, req.params.id]
    );
    if (!rowCount)
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });

    res.json({ success: true, message: `Statut mis à jour : ${statut}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── MODIFIER PROFIL (Self-service) ──
const updateProfil = async (req, res) => {
  const { nom, prenom, telephone } = req.body;
  try {
    await pool.query(
      'UPDATE users SET nom=$1, prenom=$2, telephone=$3 WHERE id=$4',
      [nom, prenom, telephone, req.user.id]
    );
    res.json({ success: true, message: 'Profil mis à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── LOGS DE CONNEXION (Historique) ──
const getLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.nom || ' ' || u.prenom AS user_nom, u.email
       FROM logs_connexion l
       JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC
       LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ── GET STATS DASHBOARD (Query sala7thelek hna) ──
const getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE u.statut = 'actif')   AS actifs,
        COUNT(*) FILTER (WHERE u.statut = 'inactif') AS inactifs,
        COUNT(*) FILTER (WHERE u.statut = 'bloque')  AS bloques,
        COUNT(*) FILTER (WHERE r.nom = 'client')     AS clients,
        COUNT(*) FILTER (WHERE r.nom = 'fournisseur') AS fournisseurs,
        COUNT(*) FILTER (WHERE r.nom = 'partenaire')  AS partenaires,
        COUNT(*) FILTER (WHERE r.nom = 'admin')       AS admins,
        COUNT(*) AS total
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────
// 2. EXPORTATION UNIQUE
// ──────────────────────────────────────────────────
module.exports = { 
  getAll, 
  getMe, 
  create, 
  updateStatut, 
  updateProfil, 
  getLogs, 
  getStats 
};
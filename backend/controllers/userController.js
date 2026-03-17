const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

// ─────────────────────────────────────
// LISTE TOUS LES UTILISATEURS — GET /api/users
// Accessible uniquement par l'admin
// ─────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, prenom, email, telephone,
              statut, avatar_url, role, role_label,
              created_at, updated_at
       FROM v_users
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────
// PROFIL PERSONNEL — GET /api/users/me
// Chaque utilisateur voit son propre profil
// ─────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, prenom, email, telephone,
              statut, avatar_url, role, role_label, created_at
       FROM v_users WHERE id=$1`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────
// CRÉER UN UTILISATEUR — POST /api/users
// Accessible uniquement par l'admin
// ─────────────────────────────────────
exports.create = async (req, res) => {
  const { nom, prenom, email, mot_de_passe, telephone, role_id } = req.body;

  // Vérifier que tous les champs obligatoires sont remplis
  if (!nom || !prenom || !email || !mot_de_passe || !role_id)
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });

  try {
    // Vérifier si l'email existe déjà
    const exists = await pool.query(
      'SELECT id FROM users WHERE email=$1', [email.toLowerCase()]
    );
    if (exists.rows.length)
      return res.status(409).json({ success: false, message: 'Email déjà utilisé.' });

    // Hasher le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 12);

    // Créer l'utilisateur avec statut inactif par défaut
    const { rows } = await pool.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, telephone, role_id, statut)
       VALUES ($1,$2,$3,$4,$5,$6,'inactif') RETURNING id`,
      [nom, prenom, email.toLowerCase(), hash, telephone || null, role_id]
    );

    res.status(201).json({ success: true, message: 'Utilisateur créé.', id: rows[0].id });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────
// ACTIVER / BLOQUER — PATCH /api/users/:id/statut
// Accessible uniquement par l'admin
// ─────────────────────────────────────
exports.updateStatut = async (req, res) => {
  const { statut } = req.body;

  // Vérifier que le statut est valide
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
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────
// MODIFIER PROFIL — PUT /api/users/profil
// Chaque utilisateur modifie son propre profil
// ─────────────────────────────────────
exports.updateProfil = async (req, res) => {
  const { nom, prenom, telephone } = req.body;
  try {
    await pool.query(
      'UPDATE users SET nom=$1, prenom=$2, telephone=$3 WHERE id=$4',
      [nom, prenom, telephone, req.user.id]
    );
    res.json({ success: true, message: 'Profil mis à jour.' });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────
// LOGS CONNEXION — GET /api/users/logs
// Accessible uniquement par l'admin
// ─────────────────────────────────────
exports.getLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.nom || ' ' || u.prenom AS user_nom, u.email
       FROM logs_connexion l
       JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC
       LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
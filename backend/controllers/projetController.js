const pool = require('../config/db');

// ============================================================
// GET /api/projets/mes-projets — Client voit SES projets
// ============================================================
const getMesProjets = async (req, res) => {
  try {
    const clientId = req.user.id; // JWT

    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.date_start,
        p.date AS date_fin,
        p.description,
        p.last_update_status,
        p.priority,
        p.active,
        COUNT(t.id) AS total_tasks,
        COUNT(CASE WHEN t.stage_id = 'Done' THEN 1 END) AS done_tasks
      FROM project_project p
      LEFT JOIN project_task t ON t.project_id = p.id
      WHERE p.partner_id = $1 AND p.active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      [clientId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getMesProjets error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/projets/:id — Détail d'un projet (Client)
// ============================================================
const getProjetById = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        u.nom || ' ' || u.prenom AS manager_name
      FROM project_project p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.id = $1 AND p.partner_id = $2 AND p.active = true`,
      [id, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getProjetById error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/projets/:id/tasks — Tâches d'un projet (Client)
// ============================================================
const getProjetTasks = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { id } = req.params;

    // Vérifier que le projet appartient au client
    const projetCheck = await pool.query(
      `SELECT id FROM project_project WHERE id = $1 AND partner_id = $2`,
      [id, clientId]
    );

    if (projetCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const result = await pool.query(
      `SELECT 
        t.id,
        t.name,
        t.stage_id,
        t.priority,
        t.kanban_state,
        t.date_deadline,
        t.description,
        t.sequence
      FROM project_task t
      WHERE t.project_id = $1
      ORDER BY t.sequence ASC, t.created_at ASC`,
      [id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getProjetTasks error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/projets — Tous les projets (Admin)
// ============================================================
const getAllProjets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.date_start,
        p.date AS date_fin,
        p.last_update_status,
        p.priority,
        p.active,
        u.nom || ' ' || u.prenom AS client_name,
        u.email AS client_email,
        COUNT(t.id) AS total_tasks,
        COUNT(CASE WHEN t.stage_id = 'Done' THEN 1 END) AS done_tasks
      FROM project_project p
      LEFT JOIN users u ON u.id = p.partner_id
      LEFT JOIN project_task t ON t.project_id = p.id
      GROUP BY p.id, u.nom, u.prenom, u.email
      ORDER BY p.created_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getAllProjets error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// POST /api/projets — Créer projet (Admin)
// ============================================================
const createProjet = async (req, res) => {
  try {
    const {
      name, partner_id, date_start, date,
      description, last_update_status, priority
    } = req.body;

    if (!name || !partner_id) {
      return res.status(400).json({ success: false, message: 'Nom et client obligatoires' });
    }

    const result = await pool.query(
      `INSERT INTO project_project 
        (name, partner_id, user_id, date_start, date, description, last_update_status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        partner_id,
        req.user.id, // Admin = manager
        date_start || null,
        date || null,
        description || null,
        last_update_status || 'on_track',
        priority || '0'
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createProjet error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// PATCH /api/projets/:id — Modifier projet (Admin)
// ============================================================
const updateProjet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, date_start, date,
      description, last_update_status, priority, active
    } = req.body;

    const result = await pool.query(
      `UPDATE project_project SET
        name = COALESCE($1, name),
        date_start = COALESCE($2, date_start),
        date = COALESCE($3, date),
        description = COALESCE($4, description),
        last_update_status = COALESCE($5, last_update_status),
        priority = COALESCE($6, priority),
        active = COALESCE($7, active)
       WHERE id = $8
       RETURNING *`,
      [name, date_start, date, description, last_update_status, priority, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateProjet error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getMesProjets,
  getProjetById,
  getProjetTasks,
  getAllProjets,
  createProjet,
  updateProjet
};
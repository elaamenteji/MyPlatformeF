// backend/controllers/partenaireController.js

const pool = require('../config/db');
const path = require('path');
const fs   = require('fs');

// ============================================================
// GET /api/partenaire/mes-projets
// Projets en cours liés au partenaire connecté
// ============================================================
const getMesProjets = async (req, res) => {
  try {
    const partenaireId = req.user.id;

    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.date_start,
        p.date       AS date_fin,
        p.description,
        p.last_update_status,
        p.priority,
        pp.role_projet,
        pp.date_debut,
        COUNT(t.id)  AS total_tasks,
        COUNT(CASE WHEN t.stage_id = 'Done' THEN 1 END) AS done_tasks
      FROM partenaire_projets pp
      JOIN project_project p ON p.id = pp.projet_id
      LEFT JOIN project_task t ON t.project_id = p.id
      WHERE pp.partenaire_id = $1
        AND p.active = true
      GROUP BY p.id, pp.role_projet, pp.date_debut
      ORDER BY p.date_start DESC`,
      [partenaireId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getMesProjets (partenaire) error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/partenaire/projets/:id/tasks
// Tâches d'un projet lié au partenaire
// ============================================================
const getProjetTasks = async (req, res) => {
  try {
    const partenaireId = req.user.id;
    const { id } = req.params;

    // Vérif accès
    const check = await pool.query(
      `SELECT id FROM partenaire_projets WHERE partenaire_id = $1 AND projet_id = $2`,
      [partenaireId, id]
    );
    if (check.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Accès refusé' });

    const result = await pool.query(
      `SELECT id, name, stage_id, priority, kanban_state, date_deadline, sequence
       FROM project_task WHERE project_id = $1
       ORDER BY sequence ASC, created_at ASC`,
      [id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getProjetTasks (partenaire) error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/partenaire/documents
// Documents techniques accessibles au partenaire
// ============================================================
const getDocuments = async (req, res) => {
  try {
    const partenaireId = req.user.id;
    const { type_doc, projet_id } = req.query;

    let query = `
      SELECT 
        d.id, d.titre, d.description, d.fichier_url, d.fichier_nom,
        d.type_doc, d.created_at,
        p.name AS projet_name,
        u.nom || ' ' || u.prenom AS uploaded_by_name
      FROM documents d
      LEFT JOIN project_project p ON p.id = d.projet_id
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE (
        d.projet_id IN (
          SELECT projet_id FROM partenaire_projets WHERE partenaire_id = $1
        )
        OR d.projet_id IS NULL
      )
    `;
    const params = [partenaireId];

    if (type_doc) { query += ` AND d.type_doc = $${params.length+1}`; params.push(type_doc); }
    if (projet_id){ query += ` AND d.projet_id = $${params.length+1}`; params.push(projet_id); }

    query += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getDocuments error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// POST /api/partenaire/documents/upload
// Upload d'un document technique
// ============================================================
const uploadDocument = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'Fichier manquant' });

    const { titre, description, type_doc, projet_id } = req.body;
    const uploadedBy = req.user.id;

    const fichierUrl = `/uploads/docs/${req.file.filename}`;
    const fichierNom = req.file.originalname;

    const result = await pool.query(
      `INSERT INTO documents (titre, description, fichier_url, fichier_nom, type_doc, projet_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        titre || fichierNom,
        description || null,
        fichierUrl,
        fichierNom,
        type_doc || 'technique',
        projet_id || null,
        uploadedBy,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('uploadDocument error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// DELETE /api/partenaire/documents/:id
// Supprimer un document (uploadé par soi-même)
// ============================================================
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const doc = await pool.query(
      `SELECT * FROM documents WHERE id = $1 AND uploaded_by = $2`,
      [id, userId]
    );
    if (doc.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Non autorisé' });

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '../../uploads/docs', path.basename(doc.rows[0].fichier_url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Document supprimé' });
  } catch (err) {
    console.error('deleteDocument error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/partenaire/kpis
// KPIs départementaux
// ============================================================
const getKpis = async (req, res) => {
  try {
    const { departement, periode } = req.query;

    let query = `SELECT * FROM kpis_departement WHERE 1=1`;
    const params = [];

    if (departement) { query += ` AND departement = $${params.length+1}`; params.push(departement); }
    if (periode)     { query += ` AND periode = $${params.length+1}`;     params.push(periode); }

    query += ` ORDER BY departement, indicateur`;

    const result = await pool.query(query, params);

    // Regrouper par département
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.departement]) grouped[row.departement] = [];
      grouped[row.departement].push(row);
    });

    res.json({ success: true, data: grouped, raw: result.rows });
  } catch (err) {
    console.error('getKpis error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/partenaire/kpis/periodes
// Liste des périodes disponibles
// ============================================================
const getKpiPeriodes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT periode FROM kpis_departement ORDER BY periode DESC`
    );
    res.json({ success: true, data: result.rows.map(r => r.periode) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getMesProjets,
  getProjetTasks,
  getDocuments,
  uploadDocument,
  deleteDocument,
  getKpis,
  getKpiPeriodes,
};
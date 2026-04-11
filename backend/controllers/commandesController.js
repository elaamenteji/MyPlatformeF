// ============================================================
// commandesController.js — MITECH TUNISIE
// Gestion des commandes clients
// ============================================================
const db = require('../config/db');

// ── Générer référence unique ─────────────────────────────────
async function genererReference(prefix, table, colonne) {
  const annee = new Date().getFullYear();
  const { rows } = await db.query(
    `SELECT COUNT(*) FROM ${table} WHERE ${colonne} LIKE $1`,
    [`${prefix}-${annee}-%`]
  );
  const num = String(parseInt(rows[0].count) + 1).padStart(4, '0');
  return `${prefix}-${annee}-${num}`;
}

// ── GET /api/commandes ───────────────────────────────────────
// Admin: toutes | Client: les siennes seulement
exports.getCommandes = async (req, res) => {
  try {
    const { statut, client_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = [];

    // Client voit seulement ses commandes
    if (req.user.role === 'client') {
      where.push(`c.user_id = $${params.length + 1}`);
      params.push(req.user.id);
    } else if (client_id) {
      where.push(`c.client_id = $${params.length + 1}`);
      params.push(client_id);
    }

    if (statut) {
      where.push(`c.statut = $${params.length + 1}`);
      params.push(statut);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         c.id, c.reference, c.modele_vehicule, c.type_piece,
         c.quantite, c.prix_total, c.statut,
         c.date_commande, c.date_livraison, c.notes,
         cl.nom AS client_nom, cl.pays AS client_pays, cl.code AS client_code
       FROM commandes c
       JOIN clients cl ON cl.id = c.client_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const { rows: total } = await db.query(
      `SELECT COUNT(*) FROM commandes c ${whereClause}`,
      params
    );

    res.json({
      data:       rows,
      total:      parseInt(total[0].count),
      page:       parseInt(page),
      totalPages: Math.ceil(total[0].count / limit),
    });
  } catch (err) {
    console.error('getCommandes:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── GET /api/commandes/:id ───────────────────────────────────
exports.getCommandeById = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         c.*, cl.nom AS client_nom, cl.pays AS client_pays,
         cl.contact_email AS client_email
       FROM commandes c
       JOIN clients cl ON cl.id = c.client_id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable' });

    // Client peut voir seulement ses commandes
    if (req.user.role === 'client' && rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'Accès refusé' });

    // Récupérer les étapes de production
    const { rows: productions } = await db.query(
      `SELECT etape, statut, operateur, quantite_traitee, date_debut, date_fin
       FROM productions WHERE commande_id = $1 ORDER BY created_at`,
      [req.params.id]
    );

    // Récupérer la livraison
    const { rows: livraisons } = await db.query(
      `SELECT * FROM livraisons WHERE commande_id = $1`,
      [req.params.id]
    );

    res.json({ ...rows[0], productions, livraison: livraisons[0] || null });
  } catch (err) {
    console.error('getCommandeById:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── POST /api/commandes ──────────────────────────────────────
// Admin seulement
exports.createCommande = async (req, res) => {
  try {
    const { client_id, user_id, modele_vehicule, type_piece,
            quantite, prix_unitaire, date_livraison, notes } = req.body;

    if (!client_id || !modele_vehicule || !type_piece || !quantite || !prix_unitaire)
      return res.status(400).json({ message: 'Champs obligatoires manquants' });

    const reference = await genererReference('CMD', 'commandes', 'reference');

    const { rows } = await db.query(
      `INSERT INTO commandes
         (reference, client_id, user_id, modele_vehicule, type_piece,
          quantite, prix_unitaire, date_livraison, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [reference, client_id, user_id || null, modele_vehicule,
       type_piece, quantite, prix_unitaire, date_livraison || null, notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createCommande:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── PATCH /api/commandes/:id/statut ─────────────────────────
// Admin seulement
exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const valides = ['en_attente','confirmee','en_production','prete','livree','annulee'];
    if (!valides.includes(statut))
      return res.status(400).json({ message: 'Statut invalide' });

    const { rows } = await db.query(
      `UPDATE commandes SET statut=$1 WHERE id=$2 RETURNING *`,
      [statut, req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('updateStatut:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── DELETE /api/commandes/:id ────────────────────────────────
// Admin seulement
exports.deleteCommande = async (req, res) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM commandes WHERE id=$1 RETURNING id`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable' });
    res.json({ message: 'Commande supprimée' });
  } catch (err) {
    console.error('deleteCommande:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
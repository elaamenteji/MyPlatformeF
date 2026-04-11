// ============================================================
// statsController.js — MITECH TUNISIE
// Stats & KPIs par rôle
// ============================================================
const db = require('../config/db');

// ── GET /api/stats/admin ─────────────────────────────────────
// Dashboard admin — vue globale
exports.getStatsAdmin = async (req, res) => {
  try {
    // Stats globales
    const { rows: global } = await db.query(`SELECT * FROM v_stats_globales`);

    // CA par mois (12 derniers mois)
    const { rows: caParMois } = await db.query(`
      SELECT
        TO_CHAR(date_commande, 'YYYY-MM') AS mois,
        SUM(prix_total)                   AS ca,
        COUNT(*)                          AS nb_commandes
      FROM commandes
      WHERE statut != 'annulee'
        AND date_commande >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY mois
      ORDER BY mois
    `);

    // Répartition par client
    const { rows: parClient } = await db.query(`
      SELECT
        cl.nom        AS client,
        COUNT(*)      AS nb_commandes,
        SUM(c.prix_total) AS ca_total
      FROM commandes c
      JOIN clients cl ON cl.id = c.client_id
      WHERE c.statut != 'annulee'
      GROUP BY cl.nom
      ORDER BY ca_total DESC
    `);

    // Répartition statuts commandes
    const { rows: parStatut } = await db.query(`
      SELECT statut, COUNT(*) AS nb
      FROM commandes
      GROUP BY statut
      ORDER BY nb DESC
    `);

    // Livraisons récentes
    const { rows: livraisons } = await db.query(`
      SELECT
        l.reference, l.statut, l.date_expedition,
        l.date_livraison_reelle, l.transporteur,
        c.reference AS commande_ref,
        cl.nom      AS client_nom
      FROM livraisons l
      JOIN commandes c  ON c.id  = l.commande_id
      JOIN clients   cl ON cl.id = c.client_id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    res.json({
      global:     global[0],
      caParMois,
      parClient,
      parStatut,
      livraisonsRecentes: livraisons,
    });
  } catch (err) {
    console.error('getStatsAdmin:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── GET /api/stats/client ────────────────────────────────────
// Dashboard client — ses propres commandes
exports.getStatsClient = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows: commandes } = await db.query(`
      SELECT statut, COUNT(*) AS nb, SUM(prix_total) AS total
      FROM commandes
      WHERE user_id = $1
      GROUP BY statut
    `, [userId]);

    const { rows: dernieres } = await db.query(`
      SELECT
        c.reference, c.modele_vehicule, c.type_piece,
        c.quantite, c.prix_total, c.statut, c.date_livraison,
        cl.nom AS client_nom
      FROM commandes c
      JOIN clients cl ON cl.id = c.client_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [userId]);

    const { rows: enCours } = await db.query(`
      SELECT
        c.reference, c.modele_vehicule, c.statut,
        p.etape, p.quantite_traitee, c.quantite
      FROM commandes c
      LEFT JOIN LATERAL (
        SELECT etape, quantite_traitee
        FROM productions
        WHERE commande_id = c.id
        ORDER BY created_at DESC LIMIT 1
      ) p ON true
      WHERE c.user_id = $1
        AND c.statut IN ('confirmee','en_production','prete')
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({ commandes, dernieres, enCours });
  } catch (err) {
    console.error('getStatsClient:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── GET /api/stats/fournisseur ───────────────────────────────
// Dashboard fournisseur — ses achats et livraisons
exports.getStatsFournisseur = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows: achats } = await db.query(`
      SELECT statut, COUNT(*) AS nb, SUM(prix_total) AS total
      FROM achats
      WHERE user_id = $1
      GROUP BY statut
    `, [userId]);

    const { rows: derniersAchats } = await db.query(`
      SELECT
        a.reference, a.type_matiere, a.quantite_kg,
        a.prix_total, a.statut, a.date_livraison_prevue,
        f.nom AS fournisseur_nom
      FROM achats a
      JOIN fournisseurs f ON f.id = a.fournisseur_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({ achats, derniersAchats });
  } catch (err) {
    console.error('getStatsFournisseur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── GET /api/stats/partenaire ────────────────────────────────
// Dashboard partenaire — KPIs globaux lecture seule
exports.getStatsPartenaire = async (req, res) => {
  try {
    const { rows: kpis } = await db.query(`
      SELECT * FROM kpis
      ORDER BY periode DESC
      LIMIT 12
    `);

    const { rows: global } = await db.query(`SELECT * FROM v_stats_globales`);

    const { rows: topClients } = await db.query(`
      SELECT cl.nom, COUNT(*) AS nb_commandes, SUM(c.prix_total) AS ca
      FROM commandes c
      JOIN clients cl ON cl.id = c.client_id
      WHERE c.statut != 'annulee'
      GROUP BY cl.nom
      ORDER BY ca DESC
      LIMIT 5
    `);

    res.json({ kpis, global: global[0], topClients });
  } catch (err) {
    console.error('getStatsPartenaire:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
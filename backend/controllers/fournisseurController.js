// controllers/fournisseurController.js
// Sprint 4 — Module Fournisseur (Nour)
// Routes: /api/fournisseur/*

const pool = require('../config/db');

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
const getPartnerId = (req) => req.user.id; // JWT payload

// ─────────────────────────────────────────────
// COMMANDES (purchase_order)
// ─────────────────────────────────────────────

// GET /api/fournisseur/commandes
// Liste toutes les commandes du fournisseur connecté
exports.getCommandes = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    const { state, from, to, search } = req.query;

    let conditions = ['po.partner_id = $1'];
    let params = [partnerId];
    let i = 2;

    if (state) {
      conditions.push(`po.state = $${i++}`);
      params.push(state);
    }
    if (from) {
      conditions.push(`po.date_order >= $${i++}`);
      params.push(from);
    }
    if (to) {
      conditions.push(`po.date_order <= $${i++}`);
      params.push(to);
    }
    if (search) {
      conditions.push(`(po.name ILIKE $${i} OR po.notes ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.join(' AND ');

    const { rows } = await pool.query(
      `SELECT
          po.id, po.name, po.date_order, po.date_approve,
          po.date_planned, po.state, po.invoice_status,
          po.amount_untaxed, po.amount_tax, po.amount_total,
          po.currency_id, po.notes,
          buyer.nom   AS buyer_nom,
          buyer.prenom AS buyer_prenom
       FROM purchase_order po
       LEFT JOIN users buyer ON buyer.id = po.user_id
       WHERE ${where}
       ORDER BY po.date_order DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getCommandes:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/fournisseur/commandes/:id
// Détail d'une commande + ses lignes
exports.getCommandeById = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    const { id } = req.params;

    const { rows: [po] } = await pool.query(
      `SELECT po.*, buyer.nom AS buyer_nom, buyer.prenom AS buyer_prenom
       FROM purchase_order po
       LEFT JOIN users buyer ON buyer.id = po.user_id
       WHERE po.id = $1 AND po.partner_id = $2`,
      [id, partnerId]
    );

    if (!po) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    const { rows: lines } = await pool.query(
      `SELECT * FROM purchase_order_line WHERE order_id = $1 ORDER BY id`,
      [id]
    );

    res.json({ success: true, data: { ...po, lines } });
  } catch (err) {
    console.error('getCommandeById:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/fournisseur/commandes/stats
// Stats globales pour le dashboard fournisseur
exports.getCommandesStats = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);

    const { rows } = await pool.query(
      `SELECT
          COUNT(*)                                            AS total,
          COUNT(*) FILTER (WHERE state = 'draft')            AS draft,
          COUNT(*) FILTER (WHERE state = 'sent')             AS sent,
          COUNT(*) FILTER (WHERE state = 'purchase')         AS confirmed,
          COUNT(*) FILTER (WHERE state = 'done')             AS done,
          COUNT(*) FILTER (WHERE state = 'cancel')           AS cancelled,
          COALESCE(SUM(amount_total), 0)                     AS montant_total,
          COALESCE(SUM(amount_total) FILTER (WHERE state IN ('purchase','done')), 0) AS montant_confirme
       FROM purchase_order
       WHERE partner_id = $1`,
      [partnerId]
    );

    // Évolution mensuelle (12 derniers mois)
    const { rows: monthly } = await pool.query(
      `SELECT
          TO_CHAR(date_order, 'YYYY-MM') AS mois,
          COUNT(*)                        AS nb,
          COALESCE(SUM(amount_total), 0)  AS montant
       FROM purchase_order
       WHERE partner_id = $1
         AND date_order >= NOW() - INTERVAL '12 months'
       GROUP BY mois
       ORDER BY mois`,
      [partnerId]
    );

    res.json({ success: true, data: { ...rows[0], monthly } });
  } catch (err) {
    console.error('getCommandesStats:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────
// FACTURES (account_move)
// ─────────────────────────────────────────────

// GET /api/fournisseur/factures
// Liste toutes les factures du fournisseur connecté
exports.getFactures = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    const { payment_state, move_type, from, to } = req.query;

    let conditions = ['am.partner_id = $1'];
    let params = [partnerId];
    let i = 2;

    if (payment_state) {
      conditions.push(`am.payment_state = $${i++}`);
      params.push(payment_state);
    }
    if (move_type) {
      conditions.push(`am.move_type = $${i++}`);
      params.push(move_type);
    }
    if (from) {
      conditions.push(`am.invoice_date >= $${i++}`);
      params.push(from);
    }
    if (to) {
      conditions.push(`am.invoice_date <= $${i++}`);
      params.push(to);
    }

    const where = conditions.join(' AND ');

    const { rows } = await pool.query(
      `SELECT
          am.id, am.name, am.move_type, am.invoice_date, am.invoice_date_due,
          am.state, am.payment_state,
          am.amount_untaxed, am.amount_tax, am.amount_total, am.amount_residual,
          am.currency_id, am.ref, am.narration,
          po.name AS po_name
       FROM account_move am
       LEFT JOIN purchase_order po ON po.id = am.purchase_id
       WHERE ${where}
       ORDER BY am.invoice_date DESC NULLS LAST`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getFactures:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/fournisseur/factures/:id
// Détail facture + lignes
exports.getFactureById = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    const { id } = req.params;

    const { rows: [am] } = await pool.query(
      `SELECT am.*, po.name AS po_name
       FROM account_move am
       LEFT JOIN purchase_order po ON po.id = am.purchase_id
       WHERE am.id = $1 AND am.partner_id = $2`,
      [id, partnerId]
    );

    if (!am) return res.status(404).json({ success: false, message: 'Facture introuvable' });

    const { rows: lines } = await pool.query(
      `SELECT * FROM account_move_line WHERE move_id = $1 ORDER BY id`,
      [id]
    );

    res.json({ success: true, data: { ...am, lines } });
  } catch (err) {
    console.error('getFactureById:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/fournisseur/factures/stats
// Stats paiements pour le dashboard
exports.getFacturesStats = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);

    const { rows } = await pool.query(
      `SELECT
          COUNT(*) FILTER (WHERE move_type = 'in_invoice')           AS nb_factures,
          COUNT(*) FILTER (WHERE move_type = 'in_refund')            AS nb_avoirs,
          COALESCE(SUM(amount_total) FILTER (WHERE move_type = 'in_invoice' AND state = 'posted'), 0) AS total_facture,
          COALESCE(SUM(amount_residual) FILTER (WHERE move_type = 'in_invoice' AND state = 'posted'), 0) AS total_restant,
          COALESCE(SUM(amount_total - amount_residual) FILTER (WHERE move_type = 'in_invoice' AND state = 'posted'), 0) AS total_paye,
          COUNT(*) FILTER (WHERE payment_state = 'not_paid' AND state = 'posted' AND invoice_date_due < NOW()) AS en_retard
       FROM account_move
       WHERE partner_id = $1`,
      [partnerId]
    );

    // Évolution paiements par mois
    const { rows: monthly } = await pool.query(
      `SELECT
          TO_CHAR(invoice_date, 'YYYY-MM')             AS mois,
          COALESCE(SUM(amount_total), 0)                AS facture,
          COALESCE(SUM(amount_total - amount_residual), 0) AS paye
       FROM account_move
       WHERE partner_id = $1
         AND move_type = 'in_invoice'
         AND state = 'posted'
         AND invoice_date >= NOW() - INTERVAL '12 months'
       GROUP BY mois
       ORDER BY mois`,
      [partnerId]
    );

    res.json({ success: true, data: { ...rows[0], monthly } });
  } catch (err) {
    console.error('getFacturesStats:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────
// HISTORIQUE COMPTABLE
// ─────────────────────────────────────────────

// GET /api/fournisseur/historique
// Toutes les écritures (factures + avoirs) triées par date
exports.getHistorique = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);
    const { from, to, type } = req.query;

    let conditions = ['am.partner_id = $1', "am.state = 'posted'"];
    let params = [partnerId];
    let i = 2;

    if (type === 'facture') {
      conditions.push(`am.move_type = 'in_invoice'`);
    } else if (type === 'avoir') {
      conditions.push(`am.move_type = 'in_refund'`);
    }
    if (from) {
      conditions.push(`am.invoice_date >= $${i++}`);
      params.push(from);
    }
    if (to) {
      conditions.push(`am.invoice_date <= $${i++}`);
      params.push(to);
    }

    const where = conditions.join(' AND ');

    const { rows } = await pool.query(
      `SELECT
          am.id,
          am.name,
          am.move_type,
          am.invoice_date,
          am.invoice_date_due,
          am.payment_state,
          am.amount_total,
          am.amount_residual,
          am.currency_id,
          am.ref,
          am.narration,
          po.name AS po_name,
          -- Solde cumulatif (montant signé)
          CASE WHEN am.move_type = 'in_refund'
               THEN -am.amount_total
               ELSE  am.amount_total
          END AS montant_signe
       FROM account_move am
       LEFT JOIN purchase_order po ON po.id = am.purchase_id
       WHERE ${where}
       ORDER BY am.invoice_date DESC NULLS LAST, am.id DESC`,
      params
    );

    // Calcul solde courant
    let solde = 0;
    const withSolde = [...rows].reverse().map((r) => {
      solde += parseFloat(r.montant_signe);
      return { ...r, solde_cumul: parseFloat(solde.toFixed(2)) };
    }).reverse();

    res.json({ success: true, data: withSolde });
  } catch (err) {
    console.error('getHistorique:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/fournisseur/dashboard
// Toutes les stats en un seul appel pour le FournisseurDashboard
exports.getDashboard = async (req, res) => {
  try {
    const partnerId = getPartnerId(req);

    const [cmdStats, factStats] = await Promise.all([
      pool.query(
        `SELECT
            COUNT(*) AS total_commandes,
            COUNT(*) FILTER (WHERE state IN ('purchase','done')) AS commandes_confirmees,
            COALESCE(SUM(amount_total) FILTER (WHERE state IN ('purchase','done')), 0) AS montant_commandes
         FROM purchase_order WHERE partner_id = $1`,
        [partnerId]
      ),
      pool.query(
        `SELECT
            COALESCE(SUM(amount_total) FILTER (WHERE move_type='in_invoice' AND state='posted'), 0) AS total_facture,
            COALESCE(SUM(amount_residual) FILTER (WHERE move_type='in_invoice' AND state='posted'), 0) AS restant,
            COUNT(*) FILTER (WHERE payment_state='not_paid' AND state='posted' AND invoice_date_due < NOW()) AS en_retard
         FROM account_move WHERE partner_id = $1`,
        [partnerId]
      ),
    ]);

    // 5 dernières commandes
    const { rows: recentCmds } = await pool.query(
      `SELECT id, name, date_order, state, amount_total
       FROM purchase_order WHERE partner_id = $1
       ORDER BY date_order DESC LIMIT 5`,
      [partnerId]
    );

    // 5 dernières factures
    const { rows: recentFacts } = await pool.query(
      `SELECT id, name, invoice_date, invoice_date_due, payment_state, amount_total, amount_residual
       FROM account_move WHERE partner_id = $1 AND state = 'posted'
       ORDER BY invoice_date DESC NULLS LAST LIMIT 5`,
      [partnerId]
    );

    res.json({
      success: true,
      data: {
        commandes: cmdStats.rows[0],
        factures: factStats.rows[0],
        recent_commandes: recentCmds,
        recent_factures: recentFacts,
      },
    });
  } catch (err) {
    console.error('getDashboard:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
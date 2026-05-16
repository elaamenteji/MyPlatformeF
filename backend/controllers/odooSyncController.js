const odooService = require('../odooService');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../config/mailer');

// POST /api/sync/odoo — Sync manuelle
const syncOdoo = async (req, res) => {
  try {
    const results = await odooService.syncAll();
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/sync/status — Test connexion Odoo
const getStatus = async (req, res) => {
  try {
    const status = await odooService.testConnection();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Odoo non connecté: ' + err.message });
  }
};

// GET /api/sync/logs — Logs synchronisation
const getLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM odoo_sync_logs 
      ORDER BY synced_at DESC 
      LIMIT 50
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/sync/odoo-contacts — Contacts Odoo moch mawjoudin fil plateforme
const getOdooContacts = async (req, res) => {
  try {
    const uid = await odooService.authenticate();
    const contacts = await odooService.searchRead(uid, 'res.partner',
      [['is_company', '=', false], ['email', '!=', false]],
      ['id', 'name', 'email', 'phone', 'mobile', 'function', 'company_id']);

    // Filter — na7i eli déjà 3andhom compte fil plateforme
    const existingResult = await pool.query(`SELECT email, odoo_id FROM users`);
    const emailSet  = new Set(existingResult.rows.map(r => r.email.toLowerCase()));
    const odooIdSet = new Set(existingResult.rows.map(r => r.odoo_id).filter(Boolean));

    const filtered = contacts.filter(c =>
      c.email &&
      !emailSet.has(c.email.toLowerCase().trim()) &&
      !odooIdSet.has(c.id)
    );

    // Format response
    const formatted = filtered.map(c => {
      const parts  = (c.name || '').trim().split(' ');
      const prenom = parts[0] || c.name;
      const nom    = parts.slice(1).join(' ') || prenom;
      const fn     = typeof c.function === 'string' ? c.function.toLowerCase() : '';

      let role = 'client';
      if (fn.includes('fournisseur') || fn.includes('supplier'))  role = 'fournisseur';
      else if (fn.includes('partenaire') || fn.includes('partner')) role = 'partenaire';

      return {
        odoo_id:    c.id,
        name:       c.name,
        prenom,
        nom,
        email:      c.email.toLowerCase().trim(),
        telephone:  c.phone || c.mobile || '',
        function:   c.function || '',
        company:    c.company_id ? c.company_id[1] : '',
        role_suggere: role,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/sync/create-from-odoo — Créer compte depuis contact Odoo
const createFromOdoo = async (req, res) => {
  try {
    const { odoo_id, nom, prenom, email, telephone, role_id } = req.body;

    if (!email || !nom || !prenom)
      return res.status(400).json({ success: false, message: 'Données manquantes.' });

    // Check email déjà utilisé
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(400).json({ success: false, message: 'Email déjà utilisé.' });

    // Générer password aléatoire
    const chars    = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!$%';
    const password = Array.from({ length: 12 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    const hashed = await bcrypt.hash(password, 12);

    // Créer user fil DB
    const result = await pool.query(`
      INSERT INTO users 
        (nom, prenom, email, mot_de_passe, role_id, statut, 
         telephone, odoo_id, last_sync_at, must_change_password)
      VALUES ($1, $2, $3, $4, $5, 'actif', $6, $7, NOW(), true)
      RETURNING id, nom, prenom, email, role_id
    `, [nom, prenom, email.toLowerCase(), hashed, role_id || 2,
        telephone || null, odoo_id || null]);

    const newUser = result.rows[0];

    // Envoyer email welcome
    try {
      await sendWelcomeEmail(email, prenom, password);
    } catch (mailErr) {
      console.error('Mail welcome error:', mailErr.message);
      // Mch nwa99fou — user yetkhla9 7atta ki mail fchel
    }

    res.json({
      success: true,
      message: `✅ Compte créé pour ${prenom} ${nom}. Email envoyé à ${email}`,
      data: newUser,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { syncOdoo, getStatus, getLogs, getOdooContacts, createFromOdoo };
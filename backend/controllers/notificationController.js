// backend/controllers/notificationController.js
const pool     = require('../config/db');
const bcrypt   = require('bcryptjs');
const { sendMail } = require('../config/mailer');

// ─────────────────────────────────────────────────────────────
// Helper — mail alert lil kol admin actif
// ─────────────────────────────────────────────────────────────
const notifyAdminByMail = async (userNom, userPrenom, userEmail) => {
  try {
    const admins = await pool.query(
      `SELECT u.email, u.prenom FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.nom = 'admin' AND u.statut = 'actif'`
    );

    for (const admin of admins.rows) {
      await sendMail({
        to: admin.email,
        subject: `🔔 Demande de réinitialisation — ${userPrenom} ${userNom}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
            <h2 style="color:#3b5bdb;margin:0 0 16px">MyPlatforme — Notification Admin</h2>
            <p>Bonjour <strong>${admin.prenom || 'Admin'}</strong>,</p>
            <p>Un utilisateur a demandé une réinitialisation de mot de passe :</p>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #3b5bdb">
              <p style="margin:4px 0">👤 <strong>Nom :</strong> ${userPrenom} ${userNom}</p>
              <p style="margin:4px 0">📧 <strong>Email :</strong> ${userEmail}</p>
            </div>
            <p>Connectez-vous au dashboard pour traiter cette demande.</p>
            <a href="${process.env.CLIENT_URL}/admin"
               style="display:inline-block;margin:16px 0;padding:12px 28px;background:#3b5bdb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              🔗 Accéder au Dashboard
            </a>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="color:#94a3b8;font-size:11px">Mitech Tunisie — Gruppo Mastrotto</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error('notifyAdminByMail error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// Helper — mail lil user kif admin reset mdps mta3ou
// ─────────────────────────────────────────────────────────────
const sendPasswordResetConfirmEmail = async (userEmail, userPrenom, newPassword) => {
  await sendMail({
    to: userEmail,
    subject: '🔐 Votre mot de passe a été réinitialisé — MyPlatforme',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#3b5bdb;margin:0 0 16px">MyPlatforme — Mitech Tunisie</h2>
        <p>Bonjour <strong>${userPrenom}</strong>,</p>
        <p>Votre demande de réinitialisation a été traitée par l'administrateur.</p>
        <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #16a34a">
          <p style="margin:4px 0">📧 <strong>Email :</strong> ${userEmail}</p>
          <p style="margin:4px 0">🔑 <strong>Nouveau mot de passe :</strong>
            <span style="font-family:monospace;font-size:16px;font-weight:700;color:#16a34a">${newPassword}</span>
          </p>
        </div>
        <p style="color:#64748b;font-size:13px">⚠️ Vous serez invité à changer ce mot de passe à votre prochaine connexion.</p>
        <a href="${process.env.CLIENT_URL}/login"
           style="display:inline-block;margin:16px 0;padding:12px 28px;background:#3b5bdb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          👉 Se connecter
        </a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#94a3b8;font-size:11px">Mitech Tunisie — Gruppo Mastrotto</p>
      </div>
    `,
  });
};

// ─────────────────────────────────────────────
// POST /api/notifications/reset-request
// PUBLIC — el user yibaat demande reset
// ─────────────────────────────────────────────
exports.createResetRequest = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requis.' });
  }

  try {
    const userResult = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.email
       FROM users u
       WHERE u.email = $1 AND u.statut = 'actif'`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "Votre demande a été envoyée à l'administrateur.",
      });
    }

    const user = userResult.rows[0];

    // Vérifier pas de demande déjà en attente
    const existing = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND type = 'reset_password_request' AND statut = 'non_lue'`,
      [user.id]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: "Votre demande a déjà été envoyée. L'admin va vous contacter.",
      });
    }

    // Créer notification dashboard
    await pool.query(
      `INSERT INTO notifications (type, titre, message, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'reset_password_request',
        `Demande de récupération : ${user.prenom} ${user.nom}`,
        `L'utilisateur ${user.prenom} ${user.nom} (${user.email}) a demandé une réinitialisation de mot de passe.`,
        user.id,
        JSON.stringify({ email: user.email }),
      ]
    );

    // Log
    await pool.query(
      `INSERT INTO logs_connexion (user_id, action, detail, ip_address)
       VALUES ($1, 'failed_attempt', 'Demande reset password', $2)`,
      [user.id, req.ip]
    );

    // ✅ Mail lil admin
    await notifyAdminByMail(user.nom, user.prenom, user.email);

    return res.json({
      success: true,
      message: "Votre demande a été envoyée à l'administrateur.",
    });

  } catch (err) {
    console.error('createResetRequest error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/notifications
// ADMIN — récupère toutes les notifications
// ─────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM v_notifications ORDER BY created_at DESC LIMIT 50`
    );
    const unreadCount = result.rows.filter(n => n.statut === 'non_lue').length;
    res.json({ success: true, notifications: result.rows, unreadCount });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────
// POST /api/notifications/:id/traiter
// ADMIN — reset password + marque notif traitée
// ─────────────────────────────────────────────
exports.traiterNotification = async (req, res) => {
  const { id }          = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mot de passe trop court (minimum 6 caractères).' });
  }

  try {
    // Récupérer notification + infos user
    const notifResult = await pool.query(
      `SELECT n.*, u.nom, u.prenom, u.email
       FROM notifications n
       JOIN users u ON u.id = n.user_id
       WHERE n.id = $1`,
      [id]
    );

    if (notifResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification introuvable.' });
    }

    const notif = notifResult.rows[0];

    if (notif.statut === 'traitee') {
      return res.status(400).json({ success: false, message: 'Déjà traitée.' });
    }

    // Hash nouveau password
    const hash = await bcrypt.hash(newPassword, 12);

    // Update user
    await pool.query(
      `UPDATE users SET mot_de_passe = $1, must_change_password = TRUE WHERE id = $2`,
      [hash, notif.user_id]
    );

    // Supprimer refresh tokens
    await pool.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1`,
      [notif.user_id]
    );

    // Marquer traitée
    await pool.query(
      `UPDATE notifications SET statut = 'traitee' WHERE id = $1`,
      [id]
    );

    // Log
    await pool.query(
      `INSERT INTO logs_connexion (user_id, action, detail, ip_address)
       VALUES ($1, 'password_change', 'Reset par admin via notification', $2)`,
      [notif.user_id, req.ip]
    );

    // ✅ Mail lil user bel mdps jdid
    try {
      await sendPasswordResetConfirmEmail(notif.email, notif.prenom, newPassword);
    } catch (mailErr) {
      console.error('Mail user reset error:', mailErr.message);
    }

    res.json({
      success: true,
      message: `Mot de passe réinitialisé. Email envoyé à ${notif.email}.`,
    });

  } catch (err) {
    console.error('traiterNotification error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
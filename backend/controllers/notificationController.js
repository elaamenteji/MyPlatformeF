// backend/controllers/notificationController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────
// POST /api/notifications/reset-request
// PUBLIC — el client yb3ath email mte3ou
// ─────────────────────────────────────────────
exports.createResetRequest = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requis.' });
  }

  try {
    // Vérifier que l'user existe w statut = actif
    const userResult = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.email
       FROM users u
       WHERE u.email = $1 AND u.statut = 'actif'`,
      [email]
    );

    // Sécurité : même message que l'user existe ou pas
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "Votre demande a été envoyée à l'administrateur. Veuillez le contacter pour récupérer votre nouveau code.",
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
        message: "Votre demande a été envoyée à l'administrateur. Veuillez le contacter pour récupérer votre nouveau code.",
      });
    }

    // Créer la notification
    await pool.query(
      `INSERT INTO notifications (type, titre, message, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'reset_password_request',
        `Demande de récupération de compte : ${user.prenom} ${user.nom}`,
        `L'utilisateur ${user.prenom} ${user.nom} (${user.email}) a demandé une réinitialisation de son mot de passe.`,
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

    return res.json({
      success: true,
      message: "Votre demande a été envoyée à l'administrateur. Veuillez le contacter pour récupérer votre nouveau code.",
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
// Body: { newPassword: "Mitech@2026" }
// ─────────────────────────────────────────────
exports.traiterNotification = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mot de passe trop court (minimum 6 caractères).' });
  }

  try {
    // Récupérer la notification
    const notifResult = await pool.query(
      `SELECT * FROM notifications WHERE id = $1`,
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
      `UPDATE users
       SET mot_de_passe = $1, must_change_password = TRUE
       WHERE id = $2`,
      [hash, notif.user_id]
    );

    // Supprimer refresh tokens (déconnexion forcée)
    await pool.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1`,
      [notif.user_id]
    );

    // Marquer notification traitée
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

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });

  } catch (err) {
    console.error('traiterNotification error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
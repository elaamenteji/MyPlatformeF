const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
const { sendResetLinkEmail, sendWelcomeEmail } = require('../config/mailer');
const crypto = require('crypto');
require('dotenv').config();

// --- Helpers ---

const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

const log = (userId, action, req, detail = null) =>
  pool.query(
    'INSERT INTO logs_connexion (user_id, action, ip_address, user_agent, detail) VALUES ($1,$2,$3,$4,$5)',
    [userId, action, req.ip, req.headers['user-agent'], detail]
  ).catch(() => {});

// --- 1. Login ---

exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe)
    return res.status(400).json({ success: false, message: 'Email et password requis.' });

  try {
    const { rows } = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Email ou password incorrect.' });

    const user = rows[0];

    if (user.statut === 'bloque')
      return res.status(403).json({ success: false, message: 'Compte bloqué.' });
    if (user.statut === 'inactif')
      return res.status(403).json({ success: false, message: 'Compte non activé.' });

    const ok = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!ok)
      return res.status(401).json({ success: false, message: 'Email ou password incorrect.' });

    const payload      = { id: user.id, email: user.email, role: user.role };
    const accessToken  = signAccess(payload);
    const refreshToken = signRefresh({ id: user.id });

    const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, ip_address, user_agent, expire_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, refreshToken, req.ip, req.headers['user-agent'], expire]
    );

    await log(user.id, 'login', req);

    const needsRecoverySetup = user.role === 'admin' && !user.recovery_key;

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id:                user.id,
        nom:               user.nom,
        prenom:            user.prenom,
        email:             user.email,
        role:              user.role,
        needsRecoverySetup
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 2. Logout ---

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken)
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    if (req.user)
      await log(req.user.id, 'logout', req);

    res.json({ success: true, message: 'Déconnecté avec succès.' });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 3. Refresh ---

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ success: false, message: 'Token manquant.' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token=$1 AND expire_at > NOW()',
      [refreshToken]
    );
    if (!rows.length)
      return res.status(403).json({ success: false, message: 'Token expiré ou invalide.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { rows: users } = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`,
      [decoded.id]
    );

    const accessToken = signAccess({ id: users[0].id, email: users[0].email, role: users[0].role });

    res.json({ success: true, accessToken });
  } catch {
    res.status(403).json({ success: false, message: 'Token invalide.' });
  }
};

// --- 4. Change Password ---

exports.changePassword = async (req, res) => {
  const { ancien, nouveau } = req.body;

  if (!ancien || !nouveau) return res.status(400).json({ success: false, message: 'Champs requis.' });
  if (nouveau.length < 8) return res.status(400).json({ success: false, message: 'Minimum 8 caractères.' });

  try {
    const { rows } = await pool.query('SELECT mot_de_passe FROM users WHERE id=$1', [req.user.id]);

    const ok = await bcrypt.compare(ancien, rows[0].mot_de_passe);
    if (!ok) return res.status(400).json({ success: false, message: 'Ancien password incorrect.' });

    const hash = await bcrypt.hash(nouveau, 12);
    await pool.query('UPDATE users SET mot_de_passe=$1 WHERE id=$2', [hash, req.user.id]);

    await log(req.user.id, 'password_change', req, 'Changement mot de passe');
    res.json({ success: true, message: 'Password modifié avec succès.' });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 5. Generate Recovery Key ---

exports.generateRecoveryKey = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { recoveryCode } = req.body;

    if (!recoveryCode || !/^\d{6}$/.test(recoveryCode))
      return res.status(400).json({ success: false, message: 'Code doit être 6 chiffres.' });

    const hash = await bcrypt.hash(recoveryCode, 12);
    await pool.query(`UPDATE users SET recovery_key = $1 WHERE id = $2`, [hash, adminId]);
    await log(adminId, 'password_change', req, 'Recovery Key défini par admin');

    res.json({ success: true, message: 'Recovery Key enregistré avec succès.' });
  } catch (err) {
    console.error('generateRecoveryKey error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 6. Verify Recovery Key ---

exports.verifyRecoveryKey = async (req, res) => {
  try {
    const { email, recoveryCode } = req.body;

    if (!email || !recoveryCode)
      return res.status(400).json({ success: false, message: 'Email et code requis.' });

    const result = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1 AND r.nom = 'admin'`,
      [email.toLowerCase().trim()]
    );

    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Compte introuvable.' });

    const admin = result.rows[0];

    if (admin.statut === 'bloque')
      return res.status(403).json({ success: false, message: 'Compte bloqué.' });

    if (!admin.recovery_key)
      return res.status(400).json({ success: false, message: 'NO_RECOVERY_KEY' });

    const isValid = await bcrypt.compare(recoveryCode.toString(), admin.recovery_key);

    if (!isValid) {
      await log(admin.id, 'failed_attempt', req, 'Recovery Key incorrect');
      return res.status(401).json({ success: false, message: 'Code incorrect.' });
    }

    const resetToken = jwt.sign(
      { id: admin.id, purpose: 'reset_password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    await log(admin.id, 'login', req, 'Recovery Key vérifié — reset autorisé');

    res.json({ success: true, resetToken, message: 'Code vérifié.' });
  } catch (err) {
    console.error('verifyRecoveryKey error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 7. Reset Password via Recovery Key token ---

exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { resetToken, nouveau } = req.body;

    if (!resetToken || !nouveau)
      return res.status(400).json({ success: false, message: 'Token et password requis.' });

    if (nouveau.length < 8)
      return res.status(400).json({ success: false, message: 'Minimum 8 caractères.' });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Token expiré ou invalide.' });
    }

    if (decoded.purpose !== 'reset_password')
      return res.status(401).json({ success: false, message: 'Token invalide.' });

    const hash = await bcrypt.hash(nouveau, 12);

    await pool.query(
      `UPDATE users SET mot_de_passe = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
      [hash, decoded.id]
    );

    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.id]);

    await pool.query(
      `INSERT INTO logs_connexion (user_id, action, detail) VALUES ($1, 'password_change', 'Reset via token')`,
      [decoded.id]
    );

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error('resetPasswordWithToken error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 8. Forgot Password Admin — envoyer lien bel mail ---

exports.forgotPasswordAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: 'Email requis.' });

    const result = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1 AND r.nom = 'admin'`,
      [email.toLowerCase().trim()]
    );

    if (!result.rows.length)
      return res.json({ success: true, message: 'Si ce compte existe, un email a été envoyé.' });

    const admin = result.rows[0];

    if (admin.statut === 'bloque')
      return res.json({ success: true, message: 'Si ce compte existe, un email a été envoyé.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires    = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
      [resetToken, expires, admin.id]
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const emailDestination = admin.email_contact || admin.email;
await sendResetLinkEmail(emailDestination, resetLink, admin.prenom || 'Admin');
    await log(admin.id, 'password_change', req, 'Lien reset envoyé par mail');

    res.json({ success: true, message: 'Un lien de réinitialisation a été envoyé à votre email.' });
  } catch (err) {
    console.error('forgotPasswordAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 9. Reset Password via lien mail ---

exports.resetPasswordViaEmail = async (req, res) => {
  try {
    const { token, nouveau } = req.body;

    if (!token || !nouveau)
      return res.status(400).json({ success: false, message: 'Token et password requis.' });

    if (nouveau.length < 8)
      return res.status(400).json({ success: false, message: 'Minimum 8 caractères.' });

    const result = await pool.query(
      `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [token]
    );

    if (!result.rows.length)
      return res.status(401).json({ success: false, message: 'Lien expiré ou invalide.' });

    const user = result.rows[0];
    const hash = await bcrypt.hash(nouveau, 12);

    await pool.query(
      `UPDATE users SET mot_de_passe = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
      [hash, user.id]
    );

    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

    await pool.query(
      `INSERT INTO logs_connexion (user_id, action, detail) VALUES ($1, 'password_change', 'Reset via lien mail')`,
      [user.id]
    );

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error('resetPasswordViaEmail error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 10. Create User + mail welcome ---

exports.createUserWithMail = async (req, res) => {
  try {
    const { nom, prenom, email, role_id } = req.body;

    if (!nom || !prenom || !email || !role_id)
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (exists.rows.length)
      return res.status(409).json({ success: false, message: 'Email déjà utilisé.' });

    // Password random fort
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    const motDePasseOriginal = Array.from(
      { length: 10 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('') + '@1';

    const hash = await bcrypt.hash(motDePasseOriginal, 12);

    const result = await pool.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, role_id, statut, must_change_password)
       VALUES ($1, $2, $3, $4, $5, 'actif', true)
       RETURNING id, nom, prenom, email, role_id`,
      [nom, prenom, email.toLowerCase().trim(), hash, role_id]
    );

    const newUser = result.rows[0];

    try {
      await sendWelcomeEmail(email, prenom, motDePasseOriginal);
    } catch (mailErr) {
      console.error('Mail welcome error:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Compte créé et email envoyé à ${email}`,
      data: newUser,
    });
  } catch (err) {
    console.error('createUserWithMail error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
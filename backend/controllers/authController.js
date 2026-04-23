const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
require('dotenv').config();

// --- 1. Fonctions nasta3mlouhom barcha ---

const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

const log = (userId, action, req, detail = null) =>
  pool.query(
    'INSERT INTO logs_connexion (user_id, action, ip_address, user_agent, detail) VALUES ($1,$2,$3,$4,$5)',
    [userId, action, req.ip, req.headers['user-agent'], detail]
  ).catch(() => {});

// --- 2. Login ---

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

    // Ken admin w recovery_key NULL → lazem yaaml setup
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

// --- 3. Logout ---

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

// --- 4. Refresh ---

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

// --- 5. Change Password ---

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

// --- 6. Generate Recovery Key (Admin seulement) ---

exports.generateRecoveryKey = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { recoveryCode } = req.body;

    if (!recoveryCode || !/^\d{6}$/.test(recoveryCode)) {
      return res.status(400).json({ success: false, message: 'Code doit être 6 chiffres.' });
    }

    const hash = await bcrypt.hash(recoveryCode, 12);
    await pool.query(`UPDATE users SET recovery_key = $1 WHERE id = $2`, [hash, adminId]);
    await log(adminId, 'password_change', req, 'Recovery Key défini par admin');

    res.json({ success: true, message: 'Recovery Key enregistré avec succès.' });

  } catch (err) {
    console.error('generateRecoveryKey error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
// --- 7. Verify Recovery Key (Forgot Password flow) ---

exports.verifyRecoveryKey = async (req, res) => {
  try {
    const { email, recoveryCode } = req.body;

    if (!email || !recoveryCode)
      return res.status(400).json({ success: false, message: 'Email et code requis.' });

    const result = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1
       AND r.nom = 'admin'`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Compte introuvable.' });

    const admin = result.rows[0];

    if (admin.statut === 'bloque')
      return res.status(403).json({ success: false, message: 'Compte bloqué.' });

    if (!admin.recovery_key)
      return res.status(400).json({
        success: false,
        message: 'Aucun recovery key configuré. Contactez le DBA.'
      });

    const isValid = await bcrypt.compare(recoveryCode.toString(), admin.recovery_key);

    if (!isValid) {
      await log(admin.id, 'failed_attempt', req, 'Recovery Key incorrect');
      return res.status(401).json({ success: false, message: 'Code incorrect.' });
    }

    // Token temporaire 15min pour reset password
    const resetToken = jwt.sign(
      { id: admin.id, purpose: 'reset_password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    await log(admin.id, 'login', req, 'Recovery Key vérifié — reset autorisé');

    res.json({
      success: true,
      resetToken,
      message: 'Code vérifié. Vous pouvez réinitialiser votre mot de passe.'
    });

  } catch (err) {
    console.error('verifyRecoveryKey error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 8. Reset Password (ba3d verify recovery key) ---

exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { resetToken, nouveau } = req.body;

    if (!resetToken || !nouveau)
      return res.status(400).json({ success: false, message: 'Token et password requis.' });

    if (nouveau.length < 8)
      return res.status(400).json({ success: false, message: 'Minimum 8 caractères.' });

    // Vérifier el token temporaire
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
      `UPDATE users SET mot_de_passe = $1 WHERE id = $2`,
      [hash, decoded.id]
    );

    // Supprimer tous les refresh tokens (sécurité)
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [decoded.id]
    );

    await pool.query(
      `INSERT INTO logs_connexion (user_id, action, detail)
       VALUES ($1, 'password_change', 'Reset password via Recovery Key')`,
      [decoded.id]
    );

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.'
    });

  } catch (err) {
    console.error('resetPasswordWithToken error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
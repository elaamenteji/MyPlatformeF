const bcrypt = require('bcryptjs'); // Njibou el mshaffer mte3 el passwords
const jwt    = require('jsonwebtoken'); // Njibou mta3 el "tessra" (tokens)
const pool   = require('../config/db'); // Njibou el "tuyau" li mchebel l'base
require('dotenv').config(); // Naqrou el asrar mte3na mel .env

// --- 1. Fonctions nasta3mlouhom barcha ---

// Sna3et Ticket sghira (Access Token) mte3 sa3a
const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Sna3et Ticket kbiira (Refresh Token) mte3 7 ayem
const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

// Tasjil el dkhoul wal khrouj fi journal (logs)
const log = (userId, action, req) =>
  pool.query(
    'INSERT INTO logs_connexion (user_id, action, ip_address, user_agent) VALUES ($1,$2,$3,$4)',
    [userId, action, req.ip, req.headers['user-agent']]
  ).catch(() => {}); // Ken tfchel el log, ma twaqqafsh el denya (oskot)

// --- 2. El Login (Dkhoul l'dar) ---

exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body; // Nakhdhou el email w pass mel formulaire

  // Thabet elli el email w pass maba3thin
  if (!email || !mot_de_passe)
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });

  try {
    // Nlaoujou 3la el user fi l'base b'email mte3ou (nrodouh sghir w nna7ou el frawet)
    const { rows } = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    // Ken l'email mouch mawjoud fi l'base
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });

    const user = rows[0]; // Nakhdhou el user elli lqinah

    // Thabet ken el compte m'bloki wala mazel ma t'activach
    if (user.statut === 'bloque')
      return res.status(403).json({ success: false, message: 'Compte bloqué.' });
    if (user.statut === 'inactif')
      return res.status(403).json({ success: false, message: 'Compte non activé.' });

    // Qarn el password li jé mel front-end m3a li f'base (bcrypt yfok el loghz)
    const ok = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!ok)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });

    // Sna3et el "Tickets" (Payload fih: id, email, role)
    const payload      = { id: user.id, email: user.email, role: user.role };
    const accessToken  = signAccess(payload);
    const refreshToken = signRefresh({ id: user.id });

    // Nasbou el waqt (7 ayem mel tawa) bech nkhabiouh f'base
    const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, ip_address, user_agent, expire_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, refreshToken, req.ip, req.headers['user-agent'], expire]
    );

    // Sajel fil journal elli houwa dkhél
    await log(user.id, 'login', req);

    // Rajja3 el tickets w chwaya info lel Front-end
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err); // Warri el ghalat fi el console mte3ek
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 3. El Logout (Khrouj) ---

exports.logout = async (req, res) => {
  const { refreshToken } = req.body; // Nakhdhou el ticket kbiira bech nfasskhouha
  try {
    if (refreshToken)
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    if (req.user)
      await log(req.user.id, 'logout', req); // Sajel elli houwa khraj

    res.json({ success: true, message: 'Déconnecté avec succès.' });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- 4. El Refresh (Tajdid el "Tessra") ---

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ success: false, message: 'Token manquant.' });

  try {
    // Thabet el ticket f'base (mawjouda? mazelt jdida?)
    const { rows } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token=$1 AND expire_at > NOW()',
      [refreshToken]
    );
    if (!rows.length)
      return res.status(403).json({ success: false, message: 'Token expiré ou invalide.' });

    // Hall el ticket w chouf chkoun mouleha
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { rows: users } = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`,
      [decoded.id]
    );

    // A3tih Access Token jdid (Ticket sghira)
    const accessToken = signAccess({ id: users[0].id, email: users[0].email, role: users[0].role });

    res.json({ success: true, accessToken });
  } catch {
    res.status(403).json({ success: false, message: 'Token invalide.' });
  }
};

// --- 5. Tbaddil el Mot de Passe ---

exports.changePassword = async (req, res) => {
  const { ancien, nouveau } = req.body;

  if (!ancien || !nouveau) return res.status(400).json({ success: false, message: 'Champs requis.' });
  if (nouveau.length < 8) return res.status(400).json({ success: false, message: 'Minimum 8 caractères.' });

  try {
    // Jib el pass el mchaffir li 3anna f'base
    const { rows } = await pool.query('SELECT mot_de_passe FROM users WHERE id=$1', [req.user.id]);

    // Thabet ken el password el qdim s'hih
    const ok = await bcrypt.compare(ancien, rows[0].mot_de_passe);
    if (!ok) return res.status(400).json({ success: false, message: 'Ancien mot de passe incorrect.' });

    // Chaffir el pass jdid (12 = Salt strength)
    const hash = await bcrypt.hash(nouveau, 12);
    await pool.query('UPDATE users SET mot_de_passe=$1 WHERE id=$2', [hash, req.user.id]);

    await log(req.user.id, 'password_change', req); // Sajel el tbaddila fi journal
    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
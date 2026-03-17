const jwt = require('jsonwebtoken');
require('dotenv').config();

// ✅ Vérifie le token JWT
const verifyToken = (req, res, next) => {
  const auth  = req.headers['authorization'];
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token)
    return res.status(401).json({ success: false, message: 'Token manquant.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};

// ✅ Vérifie le rôle
const checkRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      success: false,
      message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`
    });
  next();
};

module.exports = { verifyToken, checkRole };
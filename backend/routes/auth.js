const router = require('express').Router();
const { verifyToken } = require('../middlewares/auth');
const ctrl = require('../controllers/authController');

// Connexion
router.post('/login',    ctrl.login);

// Déconnexion (token requis)
router.post('/logout',   verifyToken, ctrl.logout);

// Renouveler le token
router.post('/refresh',  ctrl.refresh);

// Changer mot de passe (token requis)
router.put('/password',  verifyToken, ctrl.changePassword);

module.exports = router;
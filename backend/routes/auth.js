const router = require('express').Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const ctrl = require('../controllers/authController');

// Connexion
router.post('/login',                 ctrl.login);

// Déconnexion (token requis)
router.post('/logout',                verifyToken, ctrl.logout);

// Renouveler le token
router.post('/refresh',               ctrl.refresh);

// Changer mot de passe (token requis)
router.put('/password',               verifyToken, ctrl.changePassword);

// Generate Recovery Key (admin seulement — connecté)
router.post('/generate-recovery-key', verifyToken, checkRole('admin'), ctrl.generateRecoveryKey);

// Verify Recovery Key (public — forgot password flow)
router.post('/verify-recovery-key',   ctrl.verifyRecoveryKey);

// Reset Password via Recovery Key (public — token temporaire 15min)
router.post('/reset-password-token',  ctrl.resetPasswordWithToken);

module.exports = router;
const router = require('express').Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const ctrl = require('../controllers/userController');

// ── Profil personnel (tout utilisateur connecté) ──
router.get('/me', verifyToken, ctrl.getMe);

// ── Modifier son propre profil ──
router.put('/profil', verifyToken,ctrl.updateProfil);

// ── Stats dashboard (admin seulement) ──
router.get('/stats', verifyToken, checkRole('admin'), ctrl.getStats);

// ── Liste tous les utilisateurs (admin seulement) ──
router.get('/',   verifyToken, checkRole('admin'), ctrl.getAll);

// ── Historique des connexions (admin seulement) ──
router.get('/logs', verifyToken, checkRole('admin'), ctrl.getLogs);

// ── Créer un utilisateur (admin seulement) ──
router.post('/',  verifyToken, checkRole('admin'), ctrl.create);

// ── Activer / Bloquer un utilisateur (admin seulement) ──
router.patch('/:id/statut', verifyToken, checkRole('admin'), ctrl.updateStatut);

module.exports = router;
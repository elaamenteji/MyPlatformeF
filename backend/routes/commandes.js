// ============================================================
// routes/commandes.js — MITECH TUNISIE
// ============================================================
const router                = require('express').Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const ctrl                  = require('../controllers/commandesController');

// Toutes les routes nécessitent un token valide
router.use(verifyToken);

// ✅ Après
router.get('/',     checkRole('admin','client'),  ctrl.getCommandes);
router.get('/:id',  checkRole('admin','client'),  ctrl.getCommandeById);
router.post('/',    checkRole('admin'),            ctrl.createCommande);
router.patch('/:id/statut', checkRole('admin'),   ctrl.updateStatut);
router.delete('/:id', checkRole('admin'),         ctrl.deleteCommande);
module.exports = router;
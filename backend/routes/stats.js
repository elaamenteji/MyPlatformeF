// ============================================================
// routes/stats.js — MITECH TUNISIE
// ============================================================
const router = require('express').Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const ctrl   = require('../controllers/statsController');

router.use(verifyToken);
// ✅
router.get('/admin',       checkRole('admin'),                    ctrl.getStatsAdmin);
router.get('/client',      checkRole('admin','client'),           ctrl.getStatsClient);
router.get('/fournisseur', checkRole('admin','fournisseur'),      ctrl.getStatsFournisseur);
router.get('/partenaire',  checkRole('admin','partenaire'),       ctrl.getStatsPartenaire);
module.exports = router;
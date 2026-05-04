// routes/fournisseur.js
// Sprint 4 — Module Fournisseur (Nour)

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const ctrl = require('../controllers/fournisseurController');

// Toutes les routes fournisseur nécessitent d'être authentifié + rôle fournisseur
router.use(verifyToken, checkRole('fournisseur'));

// ── Dashboard (vue globale) ──────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── Commandes ────────────────────────────────────────────────────
// ⚠️ /stats AVANT /:id (leçon apprise Sprint 3 !)
router.get('/commandes/stats',  ctrl.getCommandesStats);
router.get('/commandes',        ctrl.getCommandes);
router.get('/commandes/:id',    ctrl.getCommandeById);

// ── Factures & Paiements ─────────────────────────────────────────
router.get('/factures/stats',   ctrl.getFacturesStats);
router.get('/factures',         ctrl.getFactures);
router.get('/factures/:id',     ctrl.getFactureById);

// ── Historique comptable ─────────────────────────────────────────
router.get('/historique',       ctrl.getHistorique);

module.exports = router;
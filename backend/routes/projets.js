const express = require('express');
const router = express.Router();
const {
  getMesProjets,
  getProjetById,
  getProjetTasks,
  getAllProjets,
  createProjet,
  updateProjet
} = require('../controllers/projetController');

const { verifyToken, checkRole } = require('../middlewares/auth');

// ⚠️ IMPORTANT: /mes-projets AVANT /:id sinon Express capte mal
// Client
router.get('/mes-projets', verifyToken, checkRole('client'), getMesProjets);
router.get('/:id/tasks', verifyToken, checkRole('client'), getProjetTasks);
router.get('/:id', verifyToken, checkRole('client'), getProjetById);

// Admin
router.get('/', verifyToken, checkRole('admin'), getAllProjets);
router.post('/', verifyToken, checkRole('admin'), createProjet);
router.patch('/:id', verifyToken, checkRole('admin'), updateProjet);

module.exports = router;
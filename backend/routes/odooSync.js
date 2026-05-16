const express = require('express');
const router = express.Router();
const { syncOdoo, getStatus, getLogs, getOdooContacts, createFromOdoo } = require('../controllers/odooSyncController');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.post('/odoo', verifyToken, checkRole('admin'), syncOdoo);
router.get('/status', verifyToken, checkRole('admin'), getStatus);
router.get('/logs', verifyToken, checkRole('admin'), getLogs);
router.get('/odoo-contacts', verifyToken, checkRole('admin'), getOdooContacts);
router.post('/create-from-odoo', verifyToken, checkRole('admin'), createFromOdoo);

module.exports = router;
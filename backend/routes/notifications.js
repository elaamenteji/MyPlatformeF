// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const {
  createResetRequest,
  getNotifications,
  traiterNotification,
} = require('../controllers/notificationController');

// PUBLIC — el client yb3ath email (pas de token)
router.post('/reset-request', createResetRequest);

// ADMIN uniquement
router.get('/', verifyToken, checkRole('admin'), getNotifications);
router.post('/:id/traiter', verifyToken, checkRole('admin'), traiterNotification);

module.exports = router;
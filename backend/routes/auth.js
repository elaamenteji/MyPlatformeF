const router = require('express').Router();
const { verifyToken, checkRole } = require('../middlewares/auth');
const ctrl = require('../controllers/authController');

router.post('/login',                  ctrl.login);
router.post('/logout',                 verifyToken, ctrl.logout);
router.post('/refresh',                ctrl.refresh);
router.put('/password',                verifyToken, ctrl.changePassword);
router.post('/generate-recovery-key',  verifyToken, checkRole('admin'), ctrl.generateRecoveryKey);
router.post('/verify-recovery-key',    ctrl.verifyRecoveryKey);
router.post('/reset-password-token',   ctrl.resetPasswordWithToken);
router.post('/forgot-password-admin',  ctrl.forgotPasswordAdmin);
router.post('/reset-password-email',   ctrl.resetPasswordViaEmail);
router.post('/create-user-mail',       verifyToken, checkRole('admin'), ctrl.createUserWithMail);

// TEST MAIL — temporaire
router.get('/test-mail', async (req, res) => {
  const { sendWelcomeEmail } = require('../config/mailer');
  try {
    await sendWelcomeEmail('aelament2003@gmail.com', 'Elaa', 'Test@1234');
    res.json({ ok: true, message: 'Email envoyé !' });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

module.exports = router;
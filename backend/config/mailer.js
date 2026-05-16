const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Generic sendMail ───────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `MyPlatforme <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

// ── Reset link (admin forgot password) ────────────────────────
const sendResetLinkEmail = async (toEmail, resetLink, prenom) => {
  await transporter.sendMail({
    from: `MyPlatforme <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: '🔐 Réinitialisation de votre mot de passe — MyPlatforme',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#3b5bdb">MyPlatforme — Mitech Tunisie</h2>
        <p>Bonjour <strong>${prenom}</strong>,</p>
        <p>Vous avez demandé une réinitialisation de mot de passe.</p>
        <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#3b5bdb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          🔗 Réinitialiser mon mot de passe
        </a>
        <p style="color:#94a3b8;font-size:12px">Ce lien expire dans <strong>15 minutes</strong>.</p>
        <p style="color:#94a3b8;font-size:12px">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#94a3b8;font-size:11px">Mitech Tunisie — Gruppo Mastrotto</p>
      </div>
    `,
  });
};

// ── Welcome email (nouvel utilisateur) ────────────────────────
const sendWelcomeEmail = async (toEmail, prenom, mdps) => {
  await transporter.sendMail({
    from: `Mitech TN <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: '🎉 Bienvenue sur Mitech TN — Vos identifiants',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#3b5bdb">Mitech TN — Mitech Tunisie</h2>
        <p>Bonjour <strong>${prenom}</strong>,</p>
        <p>Votre compte a été créé avec succès !</p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0">📧 <strong>Email :</strong> ${toEmail}</p>
          <p style="margin:4px 0">🔑 <strong>Mot de passe :</strong> ${mdps}</p>
        </div>
        <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#3b5bdb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          👉 Se connecter
        </a>
        <p style="color:#94a3b8;font-size:12px">Vous serez invité à changer votre mot de passe à la première connexion.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#94a3b8;font-size:11px">Mitech Tunisie — Gruppo Mastrotto</p>
      </div>
    `,
  });
};

module.exports = { sendMail, sendResetLinkEmail, sendWelcomeEmail };
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function dbaReset() {
  const newPassword = process.argv[2];

  if (!newPassword || newPassword.length < 8) {
    console.error('❌ Usage: node scripts/dba-reset.js <nouveau_password>');
    console.error('❌ Password doit être >= 8 caractères');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(newPassword, 12);

    const result = await pool.query(
      `UPDATE users
       SET mot_de_passe = $1,
           statut = 'actif'
       WHERE role_id = (SELECT id FROM roles WHERE nom = 'admin')
       RETURNING id, nom, prenom, email`,
      [hash]
    );

    if (result.rows.length === 0) {
      console.error('❌ Aucun admin trouvé en base !');
      process.exit(1);
    }

    const admin = result.rows[0];

    // Supprimer tous les refresh tokens
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [admin.id]
    );

    // Logger l'action
    await pool.query(
      `INSERT INTO logs_connexion (user_id, action, detail)
       VALUES ($1, 'password_change', 'DBA Emergency Reset via terminal')`,
      [admin.id]
    );

    console.log('=====================================');
    console.log('✅ DBA RESET — SUCCÈS');
    console.log('👤 Admin  :', admin.prenom, admin.nom);
    console.log('📧 Email  :', admin.email);
    console.log('🕐 Timestamp :', new Date().toISOString());
    console.log('=====================================');

  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

dbaReset();
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const pool    = require('./config/db');

const notificationsRouter = require('./routes/notifications');

const app = express();


// Autoriser le frontend React à communiquer avec le backend
app.use(cors({ origin: true, credentials: true }));

// Accepter les données JSON
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/notifications', notificationsRouter);
app.use('/api/projets', require('./routes/projets'));
app.use('/api/fournisseur', require('./routes/fournisseur'));
 

// Vérifier que le serveur et la base de données fonctionnent
app.get('/api/myplateforme', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: '✅ Serveur OK — PostgreSQL connecté!' });
  } catch {
    res.status(500).json({ success: false, message: '❌ Erreur base de données.' });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MyPlatforme Backend — http://localhost:${PORT}`);
});
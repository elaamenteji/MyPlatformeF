// 1. Nadiw el "Library" mta3 PostgreSQL bsh nasta3mlu l'fazza mta3 el "Pool" (Piscine)
const { Pool } = require('pg');

// 2. Nfa3lou el fichier .env bsh Node.js ya9ra el passwords el m5obbiya
require('dotenv').config();

// 3. Nabniw el "Pool" (el 9antra) elli faha el connections l'kol
const pool = new Pool({
  // Njibu el ma3loumet mel .env (L'adresse mta3 el base, el user, l'password...)
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // max 10: N7illou 10 biben (connections) barka dima 7adhrin bsh el PC ma yerzench
  max: 10,

  // idleTimeout: Ken connection ma sta3mleha 7ad l'30 sanya, tsakkarha bsh tkhaffef el RAM
  idleTimeoutMillis: 30000,

  // connectionTimeout: Ken el base ma jaoubetch fi 2 sawani, i9oss l'7kaya (Error)
  connectionTimeoutMillis: 2000,
});

// 4. El "Alarme": Ken saret moshkla kbira fil base, i9olna "Error" fil console
pool.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});

// 5. El "Export": Nkhalliw el Pool hedha 7adhir bsh nasta3mlouh fil Login w fil Chantiers
module.exports = pool;
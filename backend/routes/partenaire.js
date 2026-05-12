// backend/routes/partenaire.js

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const {
  getMesProjets,
  getProjetTasks,
  getDocuments,
  uploadDocument,
  deleteDocument,
  getKpis,
  getKpiPeriodes,
} = require('../controllers/partenaireController');

const { verifyToken, checkRole } = require('../middlewares/auth');

// ── Multer config (upload docs) ───────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/docs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random()*1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.dwg', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Type de fichier non autorisé'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// ── Routes (toutes protégées partenaire) ─────────────────────
const auth = [verifyToken, checkRole('partenaire')];

// Projets
router.get('/mes-projets',            ...auth, getMesProjets);
router.get('/projets/:id/tasks',      ...auth, getProjetTasks);

// Documents
router.get('/documents',              ...auth, getDocuments);
router.post('/documents/upload',      ...auth, upload.single('fichier'), uploadDocument);
router.delete('/documents/:id',       ...auth, deleteDocument);

// KPIs
router.get('/kpis',                   ...auth, getKpis);
router.get('/kpis/periodes',          ...auth, getKpiPeriodes);

module.exports = router;
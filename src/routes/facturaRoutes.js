// src/routes/facturaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verificarToken } = require('../middlewares/authMiddleware');
const { leerPreview, confirmar } = require('../controllers/facturaController');

// Los archivos van a memoria (se mandan a la IA como buffer, no se guardan en disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB por archivo
});

router.post('/leer', verificarToken, upload.array('archivos', 10), leerPreview);
router.post('/confirmar', verificarToken, confirmar);

module.exports = router;
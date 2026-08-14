const express = require('express');
const router = express.Router();
const { resumen } = require('../controllers/reporteController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/resumen', verificarToken, resumen);

module.exports = router;
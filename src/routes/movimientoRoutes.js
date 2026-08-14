const express = require('express');
const router = express.Router();
const { crearMovimiento } = require('../controllers/movimientoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearMovimiento);

module.exports = router;
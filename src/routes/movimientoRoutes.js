const express = require('express');
const router = express.Router();
const { crearMovimiento, movimientosPorBooking } = require('../controllers/movimientoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearMovimiento);
router.get('/booking/:bookingId', verificarToken, movimientosPorBooking);
module.exports = router;
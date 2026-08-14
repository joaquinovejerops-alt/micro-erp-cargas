const express = require('express');
const router = express.Router();
const { crearMovimiento, movimientosPorBooking, editarMovimiento, borrarMovimiento } = require('../controllers/movimientoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearMovimiento);
router.get('/booking/:bookingId', verificarToken, movimientosPorBooking);
router.put('/:id', verificarToken, editarMovimiento);
router.delete('/:id', verificarToken, borrarMovimiento);

module.exports = router;
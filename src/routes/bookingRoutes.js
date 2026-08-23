const express = require('express');
const router = express.Router();
const { crearBooking, listarBookings, editarBooking, cambiarEstado, obtenerHistorial, splitBooking, cambiarEstadoDeclaracion } = require('../controllers/bookingController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearBooking);
router.get('/', verificarToken, listarBookings);
router.put('/:id', verificarToken, editarBooking);
router.patch('/:id/estado', verificarToken, cambiarEstado);
router.get('/:id/historial', verificarToken, obtenerHistorial);
router.post('/:id/split', verificarToken, splitBooking);
router.patch('/declaraciones/:id/estado', verificarToken, cambiarEstadoDeclaracion);

module.exports = router;
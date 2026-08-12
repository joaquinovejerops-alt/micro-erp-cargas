const express = require('express');
const router = express.Router();
const { crearBooking, listarBookings, editarBooking } = require('../controllers/bookingController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearBooking);
router.get('/', verificarToken, listarBookings);
router.put('/:id', verificarToken, editarBooking);

module.exports = router;
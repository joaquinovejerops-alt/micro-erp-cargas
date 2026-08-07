const express = require('express');
const router = express.Router();
const { crearBooking, listarBookings } = require('../controllers/bookingController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearBooking);
router.get('/', verificarToken, listarBookings);

module.exports = router;
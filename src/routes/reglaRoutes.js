// src/routes/reglaRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const {
  listarReglas, verRegla, crearConcepto, editarConcepto, borrarConcepto,
} = require('../controllers/reglaController');

router.get('/', verificarToken, listarReglas);
router.get('/:id', verificarToken, verRegla);
router.post('/:id/conceptos', verificarToken, crearConcepto);
router.put('/conceptos/:id', verificarToken, editarConcepto);
router.delete('/conceptos/:id', verificarToken, borrarConcepto);

module.exports = router;
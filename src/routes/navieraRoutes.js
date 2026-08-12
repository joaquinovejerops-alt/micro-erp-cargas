const express = require('express');
const router = express.Router();
const { listarNavieras, obtenerNaviera, editarNaviera } = require('../controllers/navieraController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, listarNavieras);
router.get('/:id', verificarToken, obtenerNaviera);
router.put('/:id', verificarToken, editarNaviera);

module.exports = router;
const express = require('express');
const router = express.Router();
const { listarClientes, obtenerCliente, editarCliente } = require('../controllers/clienteController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, listarClientes);
router.get('/:id', verificarToken, obtenerCliente);
router.put('/:id', verificarToken, editarCliente);

module.exports = router;
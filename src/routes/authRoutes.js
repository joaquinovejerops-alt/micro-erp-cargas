const express = require('express');
const router = express.Router();
const { register, login, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verificarToken, perfil);

module.exports = router;
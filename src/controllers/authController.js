const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../validators/authValidators');

const register = asyncHandler(async (req, res) => {
  const datos = registerSchema.parse(req.body);
  const resultado = await authService.registrar(datos);
  res.status(201).json(resultado);
});

const login = asyncHandler(async (req, res) => {
  const datos = loginSchema.parse(req.body);
  const resultado = await authService.login(datos);
  res.json(resultado);
});

const perfil = asyncHandler(async (req, res) => {
  res.json(req.usuario);
});

module.exports = { register, login, perfil };
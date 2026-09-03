const AppError = require('../utils/AppError');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const mensajes = err.issues.map((i) => i.message).join(', ');
    return res.status(400).json({ error: mensajes });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor' });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = errorHandler;
const AppError = require('../utils/AppError');

// Middleware de errores de Express. Se reconoce porque tiene 4 parámetros
// (err primero). Express lo llama SOLO cuando algo falla.
function errorHandler(err, req, res, next) {
  // 1. Errores conocidos de Prisma (ej: valor único duplicado)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor' });
  }
  // 2. Nuestros errores controlados (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  // 3. Cualquier otra cosa = bug inesperado
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
module.exports = errorHandler;
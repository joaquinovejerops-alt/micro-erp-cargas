// Envuelve una función async. Si algo falla dentro, en vez de romper,
// manda el error al middleware de errores automáticamente (con next).
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
module.exports = asyncHandler;
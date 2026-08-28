// Un error "nuestro", con mensaje + código HTTP.
// Extiende el Error normal de JavaScript y le agrega statusCode.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);            // guarda el mensaje (lo hereda de Error)
    this.statusCode = statusCode; // 400, 401, 404, 409...
  }
}
module.exports = AppError;
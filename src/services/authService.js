const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// 👇 PEGÁ ACÁ TU MISMA LÍNEA DE IMPORT DE PRISMA (la que ya usás en authController)
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

async function registrar({ nombre, email, password }) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash: hash },
  });
  return { token: firmarToken(usuario) };
}

async function login({ email, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) throw new AppError('Credenciales inválidas', 401);

  const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordOk) throw new AppError('Credenciales inválidas', 401);

  return { token: firmarToken(usuario) };
}

module.exports = { registrar, login };
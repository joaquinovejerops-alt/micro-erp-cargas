const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function crearBooking(req, res) {
  try {
    const {
      bkgNumber, cliente, naviera, buqueViaje, pol, pod,
      producto, eta, cutoffDoc, cutoffFisico, contenedores,
    } = req.body;

    if (!bkgNumber || !cliente || !naviera) {
      return res.status(400).json({ error: 'BKG, cliente y naviera son obligatorios' });
    }

    const clienteNombre = cliente.trim().toUpperCase();
    const navieraNombre = naviera.trim().toUpperCase();

    const nuevoBooking = await prisma.booking.create({
      data: {
        bkgNumber: bkgNumber.trim(),
        buqueViaje,
        pol,
        pod,
        producto,
        eta: eta ? new Date(eta) : null,
        cutoffDoc: cutoffDoc ? new Date(cutoffDoc) : null,
        cutoffFisico: cutoffFisico ? new Date(cutoffFisico) : null,
        cliente: {
          connectOrCreate: {
            where: { nombre: clienteNombre },
            create: { nombre: clienteNombre },
          },
        },
        naviera: {
          connectOrCreate: {
            where: { nombre: navieraNombre },
            create: { nombre: navieraNombre },
          },
        },
        contenedores: {
          create: (contenedores || []).map((c) => ({
            tipo: c.tipo,
            cantidad: c.cantidad,
          })),
        },
      },
      include: {
        cliente: true,
        naviera: true,
        contenedores: true,
      },
    });

    res.status(201).json(nuevoBooking);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ese BKG ya existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno al crear el booking' });
  }
}

async function listarBookings(req, res) {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        cliente: true,
        naviera: true,
        contenedores: true,
      },
      orderBy: [
        { eta: { sort: 'desc', nulls: 'first' } },
        { buqueViaje: 'asc' },
        { clienteId: 'asc' },
        { creadoEn: 'asc' },
      ],
    });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al listar los bookings' });
  }
}

module.exports = { crearBooking, listarBookings };
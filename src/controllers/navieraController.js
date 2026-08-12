const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// GET /api/navieras — lista todas con su conteo de bookings
async function listarNavieras(req, res) {
  try {
    const navieras = await prisma.naviera.findMany({
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(navieras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al listar las navieras' });
  }
}

// GET /api/navieras/:id — una naviera con sus bookings
async function obtenerNaviera(req, res) {
  try {
    const { id } = req.params;
    const navieraId = parseInt(id, 10);

    const naviera = await prisma.naviera.findUnique({
      where: { id: navieraId },
      include: {
        bookings: {
          include: { cliente: true, contenedores: true },
          orderBy: { creadoEn: 'desc' },
        },
      },
    });

    if (!naviera) {
      return res.status(404).json({ error: 'Naviera no encontrada' });
    }
    res.json(naviera);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al obtener la naviera' });
  }
}

// PUT /api/navieras/:id — renombrar (corregir carga)
async function editarNaviera(req, res) {
  try {
    const { id } = req.params;
    const navieraId = parseInt(id, 10);
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const nombreNormalizado = nombre.trim().toUpperCase();

    const navieraActualizada = await prisma.naviera.update({
      where: { id: navieraId },
      data: { nombre: nombreNormalizado },
    });

    res.json(navieraActualizada);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una naviera con ese nombre' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Naviera no encontrada' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno al editar la naviera' });
  }
}

module.exports = { listarNavieras, obtenerNaviera, editarNaviera };
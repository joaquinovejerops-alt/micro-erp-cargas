const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// GET /api/clientes — lista todos con su conteo de bookings
async function listarClientes(req, res) {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al listar los clientes' });
  }
}

// GET /api/clientes/:id — un cliente con sus bookings
async function obtenerCliente(req, res) {
  try {
    const { id } = req.params;
    const clienteId = parseInt(id, 10);

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        bookings: {
          include: { naviera: true, contenedores: true },
          orderBy: { creadoEn: 'desc' },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al obtener el cliente' });
  }
}

// PUT /api/clientes/:id — renombrar (corregir carga)
async function editarCliente(req, res) {
  try {
    const { id } = req.params;
    const clienteId = parseInt(id, 10);
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const nombreNormalizado = nombre.trim().toUpperCase();

    const clienteActualizado = await prisma.cliente.update({
      where: { id: clienteId },
      data: { nombre: nombreNormalizado },
    });

    res.json(clienteActualizado);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese nombre' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno al editar el cliente' });
  }
}

module.exports = { listarClientes, obtenerCliente, editarCliente };
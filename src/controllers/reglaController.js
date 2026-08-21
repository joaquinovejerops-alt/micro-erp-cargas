// src/controllers/reglaController.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const CATEGORIAS_VALIDAS = ['LOCAL', 'FLETE', 'EXTRA'];

// GET /api/reglas — lista las navieras con su diccionario
async function listarReglas(req, res) {
  try {
    const reglas = await prisma.reglaNaviera.findMany({
      orderBy: { codigo: 'asc' },
      include: {
        conceptos: { orderBy: { patron: 'asc' } },
        _count: { select: { conceptos: true } },
      },
    });
    res.json(reglas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar las reglas' });
  }
}

// GET /api/reglas/:id — una naviera con su diccionario
async function verRegla(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const regla = await prisma.reglaNaviera.findUnique({
      where: { id },
      include: { conceptos: { orderBy: { patron: 'asc' } } },
    });
    if (!regla) return res.status(404).json({ error: 'Regla no encontrada' });
    res.json(regla);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la regla' });
  }
}

// POST /api/reglas/:id/conceptos — agregar un concepto a una naviera
async function crearConcepto(req, res) {
  try {
    const reglaNavieraId = parseInt(req.params.id, 10);
    const { patron, categoria, moneda, tipoMatch } = req.body;

    if (!patron || !patron.trim()) {
      return res.status(400).json({ error: 'El patrón es obligatorio' });
    }
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      return res.status(400).json({ error: `categoria inválida. Valores: ${CATEGORIAS_VALIDAS.join(', ')}` });
    }

    const regla = await prisma.reglaNaviera.findUnique({ where: { id: reglaNavieraId } });
    if (!regla) return res.status(404).json({ error: 'Regla no encontrada' });

    const concepto = await prisma.reglaConcepto.create({
      data: {
        reglaNavieraId,
        patron: patron.toUpperCase().trim(),
        categoria,
        moneda: moneda || 'USD',
        tipoMatch: tipoMatch || 'includes',
        origen: 'MANUAL',
      },
    });
    res.status(201).json(concepto);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ese concepto ya existe en esta naviera' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear el concepto' });
  }
}

// PUT /api/reglas/conceptos/:id — editar un concepto
async function editarConcepto(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { patron, categoria, moneda, tipoMatch } = req.body;

    if (categoria !== undefined && !CATEGORIAS_VALIDAS.includes(categoria)) {
      return res.status(400).json({ error: `categoria inválida. Valores: ${CATEGORIAS_VALIDAS.join(', ')}` });
    }

    const data = {};
    if (patron !== undefined) data.patron = patron.toUpperCase().trim();
    if (categoria !== undefined) data.categoria = categoria;
    if (moneda !== undefined) data.moneda = moneda;
    if (tipoMatch !== undefined) data.tipoMatch = tipoMatch;

    const concepto = await prisma.reglaConcepto.update({ where: { id }, data });
    res.json(concepto);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Concepto no encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Ya existe otro concepto con ese patrón en la naviera' });
    console.error(error);
    res.status(500).json({ error: 'Error al editar el concepto' });
  }
}

// DELETE /api/reglas/conceptos/:id — borrar un concepto
async function borrarConcepto(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.reglaConcepto.delete({ where: { id } });
    res.json({ mensaje: 'Concepto eliminado', id });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Concepto no encontrado' });
    console.error(error);
    res.status(500).json({ error: 'Error al borrar el concepto' });
  }
}

module.exports = { listarReglas, verRegla, crearConcepto, editarConcepto, borrarConcepto };
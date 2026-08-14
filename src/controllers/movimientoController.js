const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Valores permitidos (String controlado)
const TIPOS_VALIDOS = ['INGRESO', 'EGRESO'];
const CATEGORIAS_VALIDAS = ['LOCAL', 'FLETE', 'EXTRA'];
const MONEDAS_VALIDAS = ['USD', 'ARS'];

// POST /api/movimientos — cargar una línea del libro (factura real)
async function crearMovimiento(req, res) {
  try {
    const {
      bookingId, tipo, categoria, proveedor,
      descripcion, montoOriginal, moneda, tipoCambio,
    } = req.body;

    // 1. El booking tiene que existir
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'El booking indicado no existe' });
    }

    // 2. tipo obligatorio y válido
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: `tipo inválido. Valores: ${TIPOS_VALIDOS.join(', ')}` });
    }

    // 3. categoria: obligatoria y válida SOLO si es EGRESO; en INGRESO se ignora
    let categoriaFinal = null;
    if (tipo === 'EGRESO') {
      if (!CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ error: `categoria inválida para egreso. Valores: ${CATEGORIAS_VALIDAS.join(', ')}` });
      }
      categoriaFinal = categoria;
    }

    // 4. descripcion y monto obligatorios
    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }
    if (typeof montoOriginal !== 'number' || montoOriginal <= 0) {
      return res.status(400).json({ error: 'montoOriginal debe ser un número mayor a 0' });
    }

    // 5. moneda válida
    if (!MONEDAS_VALIDAS.includes(moneda)) {
      return res.status(400).json({ error: `moneda inválida. Valores: ${MONEDAS_VALIDAS.join(', ')}` });
    }

    // 6. Conversión a USD (el montoUsd se congela acá)
    let montoUsd;
    let tipoCambioFinal = null;
    if (moneda === 'USD') {
      montoUsd = montoOriginal;
    } else {
      // ARS: el TC es obligatorio
      if (typeof tipoCambio !== 'number' || tipoCambio <= 0) {
        return res.status(400).json({ error: 'Para moneda ARS, el tipoCambio es obligatorio y debe ser mayor a 0' });
      }
      tipoCambioFinal = tipoCambio;
      montoUsd = montoOriginal / tipoCambio;
    }

    const movimiento = await prisma.movimiento.create({
      data: {
        bookingId,
        tipo,
        categoria: categoriaFinal,
        proveedor: proveedor || null,
        descripcion: descripcion.trim(),
        montoOriginal,
        moneda,
        tipoCambio: tipoCambioFinal,
        montoUsd,
        usuarioId: req.usuario.id,
      },
    });

    res.status(201).json(movimiento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al crear el movimiento' });
  }
}

// GET /api/movimientos/booking/:bookingId — movimientos + totales calculados
async function movimientosPorBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const id = parseInt(bookingId, 10);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { contenedores: true },
    });
    if (!booking) {
      return res.status(404).json({ error: 'El booking indicado no existe' });
    }

    const movimientos = await prisma.movimiento.findMany({
      where: { bookingId: id },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { creadoEn: 'asc' },
    });

    // --- Cálculo de totales, sumando el libro (todo en USD) ---
    let totalLocal = 0;   // X
    let totalFlete = 0;   // Y
    let totalExtra = 0;   // Z
    let totalIngreso = 0; // W (facturado / venta)

    for (const m of movimientos) {
      if (m.tipo === 'INGRESO') {
        totalIngreso += m.montoUsd;
      } else { // EGRESO
        if (m.categoria === 'LOCAL') totalLocal += m.montoUsd;
        else if (m.categoria === 'FLETE') totalFlete += m.montoUsd;
        else if (m.categoria === 'EXTRA') totalExtra += m.montoUsd;
      }
    }

    const pagoEmbarque = totalLocal + totalFlete + totalExtra; // AA
    const profit = totalIngreso - pagoEmbarque;                // AD = W - AA

    // Cantidad de contenedores (para profit x contenedor)
    const cantContenedores = booking.contenedores.reduce((acc, c) => acc + c.cantidad, 0);
    const profitPorContenedor = cantContenedores > 0 ? profit / cantContenedores : null;

    res.json({
      bookingId: id,
      movimientos,
      totales: {
        local: totalLocal,        // X
        flete: totalFlete,        // Y
        extra: totalExtra,        // Z
        pagoEmbarque,             // AA = X+Y+Z
        facturado: totalIngreso,  // W
        profit,                   // AD = W - AA
        profitPorContenedor,      // AC = AD / contenedores
        cantContenedores,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al obtener los movimientos' });
  }
}

// PUT /api/movimientos/:id — editar un movimiento (recalcula montoUsd)
async function editarMovimiento(req, res) {
  try {
    const { id } = req.params;
    const movimientoId = parseInt(id, 10);

    const actual = await prisma.movimiento.findUnique({ where: { id: movimientoId } });
    if (!actual) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    const {
      tipo, categoria, proveedor,
      descripcion, montoOriginal, moneda, tipoCambio,
    } = req.body;

    // Usamos el valor nuevo si vino, o el actual si no (edición parcial)
    const tipoFinal = tipo !== undefined ? tipo : actual.tipo;
    const monedaFinal = moneda !== undefined ? moneda : actual.moneda;
    const montoFinal = montoOriginal !== undefined ? montoOriginal : actual.montoOriginal;
    const tcRecibido = tipoCambio !== undefined ? tipoCambio : actual.tipoCambio;
    const descFinal = descripcion !== undefined ? descripcion : actual.descripcion;

    // Validaciones (mismas reglas que crear)
    if (!TIPOS_VALIDOS.includes(tipoFinal)) {
      return res.status(400).json({ error: `tipo inválido. Valores: ${TIPOS_VALIDOS.join(', ')}` });
    }

    let categoriaFinal = null;
    if (tipoFinal === 'EGRESO') {
      const cat = categoria !== undefined ? categoria : actual.categoria;
      if (!CATEGORIAS_VALIDAS.includes(cat)) {
        return res.status(400).json({ error: `categoria inválida para egreso. Valores: ${CATEGORIAS_VALIDAS.join(', ')}` });
      }
      categoriaFinal = cat;
    }

    if (!descFinal || !descFinal.trim()) {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }
    if (typeof montoFinal !== 'number' || montoFinal <= 0) {
      return res.status(400).json({ error: 'montoOriginal debe ser un número mayor a 0' });
    }
    if (!MONEDAS_VALIDAS.includes(monedaFinal)) {
      return res.status(400).json({ error: `moneda inválida. Valores: ${MONEDAS_VALIDAS.join(', ')}` });
    }

    // Recalcular montoUsd
    let montoUsd;
    let tipoCambioFinal = null;
    if (monedaFinal === 'USD') {
      montoUsd = montoFinal;
    } else {
      if (typeof tcRecibido !== 'number' || tcRecibido <= 0) {
        return res.status(400).json({ error: 'Para moneda ARS, el tipoCambio es obligatorio y debe ser mayor a 0' });
      }
      tipoCambioFinal = tcRecibido;
      montoUsd = montoFinal / tcRecibido;
    }

    const actualizado = await prisma.movimiento.update({
      where: { id: movimientoId },
      data: {
        tipo: tipoFinal,
        categoria: categoriaFinal,
        proveedor: proveedor !== undefined ? proveedor : actual.proveedor,
        descripcion: descFinal.trim(),
        montoOriginal: montoFinal,
        moneda: monedaFinal,
        tipoCambio: tipoCambioFinal,
        montoUsd,
      },
    });

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al editar el movimiento' });
  }
}

// DELETE /api/movimientos/:id — borrar un movimiento
async function borrarMovimiento(req, res) {
  try {
    const { id } = req.params;
    const movimientoId = parseInt(id, 10);

    await prisma.movimiento.delete({ where: { id: movimientoId } });

    res.json({ mensaje: 'Movimiento eliminado', id: movimientoId });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno al borrar el movimiento' });
  }
}

module.exports = { crearMovimiento, movimientosPorBooking, editarMovimiento, borrarMovimiento };
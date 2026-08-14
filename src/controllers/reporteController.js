const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// GET /api/reportes/resumen — reporte con filtros + totales + listado
async function resumen(req, res) {
  try {
    const { clienteId, navieraId, producto, desde, hasta } = req.query;

    // --- Armamos el filtro de bookings dinámicamente ---
    const where = {};

    if (clienteId) where.clienteId = parseInt(clienteId, 10);
    if (navieraId) where.navieraId = parseInt(navieraId, 10);
    if (producto) where.producto = producto.trim().toUpperCase();

    // --- Filtro de fecha efectiva (zarpó → zarpadoEn; no zarpó → eta) ---
    if (desde || hasta) {
      const rango = {};
      if (desde) rango.gte = new Date(desde);
      if (hasta) rango.lte = new Date(hasta);

      where.OR = [
        // Zarpó: su fecha de zarpe cae en el rango
        { zarpadoEn: { not: null, ...rango } },
        // No zarpó: su ETA cae en el rango (los TBA sin eta quedan afuera)
        { zarpadoEn: null, eta: { not: null, ...rango } },
      ];
    }

    // --- Traemos los bookings que pasan el filtro, con sus datos ---
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        cliente: { select: { nombre: true } },
        naviera: { select: { nombre: true } },
        contenedores: true,
        movimientos: true,
      },
      orderBy: [
        { zarpadoEn: 'desc' },
        { eta: 'desc' },
      ],
    });

    // --- Acumuladores para los totales ---
    let totalFacturado = 0;
    let totalEgreso = 0;
    let totalContenedores = 0;

    // --- Procesamos cada booking: sus totales de plata + su volumen ---
    const listado = bookings.map((b) => {
      let facturado = 0;
      let egreso = 0;

      for (const m of b.movimientos) {
        if (m.tipo === 'INGRESO') facturado += m.montoUsd;
        else egreso += m.montoUsd; // EGRESO (local/flete/extra)
      }

      const profit = facturado - egreso;
      const cantContenedores = b.contenedores.reduce((acc, c) => acc + c.cantidad, 0);

      // Sumamos a los totales generales
      totalFacturado += facturado;
      totalEgreso += egreso;
      totalContenedores += cantContenedores;

      return {
        id: b.id,
        bkgNumber: b.bkgNumber,
        buqueViaje: b.buqueViaje,
        destino: b.pod,
        cliente: b.cliente.nombre,
        naviera: b.naviera.nombre,
        producto: b.producto,
        subcliente: b.subcliente,
        zarpadoEn: b.zarpadoEn,
        eta: b.eta,
        contenedores: b.contenedores.map((c) => ({ tipo: c.tipo, cantidad: c.cantidad })),
        facturado,
        egreso,
        profit,
      };
    });

    res.json({
      filtrosAplicados: { clienteId, navieraId, producto, desde, hasta },
      totales: {
        cantidadBookings: bookings.length,
        cantidadContenedores: totalContenedores,
        facturado: totalFacturado,
        egreso: totalEgreso,
        profit: totalFacturado - totalEgreso,
      },
      bookings: listado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al generar el reporte' });
  }
}

module.exports = { resumen };
// src/controllers/facturaController.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { leerFactura } = require('../services/ia');
const { elegirNaviera, procesarItems } = require('../services/reglas/motor');
const CATEGORIAS_VALIDAS = ['LOCAL', 'FLETE', 'EXTRA'];
const MONEDAS_VALIDAS = ['USD', 'ARS'];

// Congela el monto en USD igual que el movimientoController
function calcularMontoUsd(montoOriginal, moneda, tipoCambio) {
  if (moneda === 'USD') return montoOriginal;
  if (typeof tipoCambio === 'number' && tipoCambio > 0) return montoOriginal / tipoCambio;
  return null; // ARS sin TC todavía: se resuelve al confirmar
}

// POST /api/facturas/leer — lee comprobantes y devuelve un PREVIEW (no escribe nada)
async function leerPreview(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Adjuntá al menos un archivo en el campo "archivos"' });
    }

    // 1) La IA lee todos los comprobantes juntos
    const archivos = req.files.map((f) => ({ buffer: f.buffer, mimeType: f.mimetype }));
    const extraccion = await leerFactura(archivos);

    // 2) Cargamos las reglas activas y elegimos la naviera
    const reglas = await prisma.reglaNaviera.findMany({
      where: { activo: true },
      include: { conceptos: true },
    });
    const regla = elegirNaviera(extraccion.navieraDetectada, reglas);

    // 3) Categorizamos con TU diccionario
    const items = procesarItems(extraccion.items || [], regla).map((it) => ({
      ...it,
      tipoCambio: it.moneda === 'ARS' ? extraccion.tipoCambio : null,
      montoUsd: calcularMontoUsd(it.montoOriginal, it.moneda, extraccion.tipoCambio),
    }));

    // 4) Totales del preview (los impuestos van aparte del costo)
    const totales = { local: 0, flete: 0, extra: 0, impuestos: 0 };
    for (const it of items) {
      const usd = it.montoUsd || 0;
      if (it.esImpuesto) totales.impuestos += usd;
      else if (it.categoria === 'LOCAL') totales.local += usd;
      else if (it.categoria === 'FLETE') totales.flete += usd;
      else if (it.categoria === 'EXTRA') totales.extra += usd;
    }
    totales.pagoEmbarque = totales.local + totales.flete + totales.extra;

    res.json({
      navieraDetectada: extraccion.navieraDetectada,
      reglaAplicada: regla ? { id: regla.id, codigo: regla.codigo } : null,
      bl: extraccion.bl || null,
      moneda: extraccion.moneda || 'USD',
      tipoCambio: extraccion.tipoCambio || null,
      items,
      totales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al leer la factura', detalle: error.message });
  }
}

// POST /api/facturas/confirmar — inserta las líneas revisadas en el libro y aprende conceptos
async function confirmar(req, res) {
  try {
    const { bookingId, reglaNavieraId, items } = req.body;

    if (!bookingId) return res.status(400).json({ error: 'bookingId es obligatorio' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Enviá al menos un ítem para confirmar' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'El booking indicado no existe' });

    // Validamos y preparamos cada ítem ANTES de tocar la base
    const preparados = [];
    for (const [i, it] of items.entries()) {
      if (!CATEGORIAS_VALIDAS.includes(it.categoria)) {
        return res.status(400).json({ error: `Ítem ${i}: categoria inválida (${it.categoria})` });
      }
      if (!MONEDAS_VALIDAS.includes(it.moneda)) {
        return res.status(400).json({ error: `Ítem ${i}: moneda inválida (${it.moneda})` });
      }
      if (typeof it.montoOriginal !== 'number' || it.montoOriginal <= 0) {
        return res.status(400).json({ error: `Ítem ${i}: montoOriginal debe ser mayor a 0` });
      }

      let montoUsd;
      let tipoCambioFinal = null;
      if (it.moneda === 'USD') {
        montoUsd = it.montoOriginal;
      } else {
        if (typeof it.tipoCambio !== 'number' || it.tipoCambio <= 0) {
          return res.status(400).json({ error: `Ítem ${i}: en ARS el tipoCambio es obligatorio` });
        }
        tipoCambioFinal = it.tipoCambio;
        montoUsd = it.montoOriginal / it.tipoCambio;
      }

      preparados.push({
        data: {
          bookingId,
          tipo: 'EGRESO', // las facturas de navieras siempre son egresos
          categoria: it.categoria,
          proveedor: it.proveedor || null,
          descripcion: (it.descripcion || '').trim(),
          montoOriginal: it.montoOriginal,
          moneda: it.moneda,
          tipoCambio: tipoCambioFinal,
          montoUsd,
          usuarioId: req.usuario.id,
        },
        aprender: it.aprender === true,
        patron: (it.patron || it.descripcion || '').toUpperCase().trim(),
      });
    }

    // Transacción: insertamos los movimientos y aprendemos los conceptos nuevos
    const resultado = await prisma.$transaction(async (tx) => {
      const creados = [];
      for (const p of preparados) {
        creados.push(await tx.movimiento.create({ data: p.data }));
      }

      let aprendidos = 0;
      if (reglaNavieraId) {
        for (const p of preparados) {
          if (p.aprender && p.patron) {
            await tx.reglaConcepto.upsert({
              where: { reglaNavieraId_patron: { reglaNavieraId, patron: p.patron } },
              update: { categoria: p.data.categoria },
              create: {
                reglaNavieraId,
                patron: p.patron,
                categoria: p.data.categoria,
                origen: 'APRENDIDO',
              },
            });
            aprendidos++;
          }
        }
      }
      return { creados, aprendidos };
    });

    res.status(201).json({
      mensaje: 'Movimientos cargados en el libro',
      cantidad: resultado.creados.length,
      conceptosAprendidos: resultado.aprendidos,
      movimientos: resultado.creados,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar la factura', detalle: error.message });
  }
}

module.exports = { leerPreview, confirmar };
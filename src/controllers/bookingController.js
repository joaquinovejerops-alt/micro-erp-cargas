const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
// pasa a MAYÚSCULAS y recorta espacios (respeta null/undefined)
const up = (s) => (s == null ? s : String(s).trim().toUpperCase());

async function crearBooking(req, res) {
  try {
    const {
      bkgNumber, cliente, naviera, buqueViaje, pol, pod,
      producto, subcliente, eta, cutoffDoc, cutoffFisico, contenedores,
    } = req.body;

    if (!bkgNumber || !cliente || !naviera) {
      return res.status(400).json({ error: 'BKG, cliente y naviera son obligatorios' });
    }

    const clienteNombre = cliente.trim().toUpperCase();
    const navieraNombre = naviera.trim().toUpperCase();

    const nuevoBooking = await prisma.booking.create({
      data: {
        bkgNumber: up(bkgNumber),
        buqueViaje: up(buqueViaje),
        pol: up(pol),
        pod: up(pod),
        producto: up(producto),
        subcliente: up(subcliente),
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
        historial: { select: { cambios: true } },
        declaraciones: true,
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

async function editarBooking(req, res) {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id, 10);

    const actual = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { cliente: true, naviera: true },
    });

    if (!actual) {
      return res.status(404).json({ error: 'Booking no encontrado' });
    }

    let {
      cliente, naviera, buqueViaje, pol, pod,
      producto, subcliente, eta, cutoffDoc, cutoffFisico,
    } = req.body;
    // normalizar a MAYÚSCULAS (up() respeta undefined, no pisa lo que no vino)
    buqueViaje = up(buqueViaje);
    pol = up(pol);
    pod = up(pod);
    producto = up(producto);
    subcliente = up(subcliente);

    const cambios = {};
    const dataActualizar = {};

    // --- Campos de texto/fecha simples ---
    const nuevoBuque = buqueViaje !== undefined ? buqueViaje : actual.buqueViaje;
    if (buqueViaje !== undefined && buqueViaje !== actual.buqueViaje) {
      cambios.buqueViaje = { de: actual.buqueViaje, a: buqueViaje };
      dataActualizar.buqueViaje = buqueViaje;
    }
    if (pol !== undefined && pol !== actual.pol) {
      cambios.pol = { de: actual.pol, a: pol };
      dataActualizar.pol = pol;
    }
    if (pod !== undefined && pod !== actual.pod) {
      cambios.pod = { de: actual.pod, a: pod };
      dataActualizar.pod = pod;
    }
    if (producto !== undefined && producto !== actual.producto) {
      cambios.producto = { de: actual.producto, a: producto };
      dataActualizar.producto = producto;
    }
    // subcliente: se puede editar pero NO va al historial (dato descriptivo)
    if (subcliente !== undefined && subcliente !== actual.subcliente) {
      dataActualizar.subcliente = subcliente;
    }

    // --- Fechas (comparadas como ISO string) ---
    const compararFecha = (nueva, vieja) => {
      const nuevaISO = nueva ? new Date(nueva).toISOString() : null;
      const viejaISO = vieja ? vieja.toISOString() : null;
      return nuevaISO !== viejaISO;
    };
    if (eta !== undefined && compararFecha(eta, actual.eta)) {
      cambios.eta = { de: actual.eta, a: eta ? new Date(eta) : null };
      dataActualizar.eta = eta ? new Date(eta) : null;
    }
    if (cutoffDoc !== undefined && compararFecha(cutoffDoc, actual.cutoffDoc)) {
      cambios.cutoffDoc = { de: actual.cutoffDoc, a: cutoffDoc ? new Date(cutoffDoc) : null };
      dataActualizar.cutoffDoc = cutoffDoc ? new Date(cutoffDoc) : null;
    }
    if (cutoffFisico !== undefined && compararFecha(cutoffFisico, actual.cutoffFisico)) {
      cambios.cutoffFisico = { de: actual.cutoffFisico, a: cutoffFisico ? new Date(cutoffFisico) : null };
      dataActualizar.cutoffFisico = cutoffFisico ? new Date(cutoffFisico) : null;
    }

    // --- Cliente y naviera (con connectOrCreate y mayúsculas) ---
    if (cliente !== undefined) {
      const clienteNombre = cliente.trim().toUpperCase();
      if (clienteNombre !== actual.cliente.nombre) {
        cambios.cliente = { de: actual.cliente.nombre, a: clienteNombre };
        dataActualizar.cliente = {
          connectOrCreate: {
            where: { nombre: clienteNombre },
            create: { nombre: clienteNombre },
          },
        };
      }
    }
    if (naviera !== undefined) {
      const navieraNombre = naviera.trim().toUpperCase();
      if (navieraNombre !== actual.naviera.nombre) {
        cambios.naviera = { de: actual.naviera.nombre, a: navieraNombre };
        dataActualizar.naviera = {
          connectOrCreate: {
            where: { nombre: navieraNombre },
            create: { nombre: navieraNombre },
          },
        };
      }
    }

    // --- Regla de negocio: rolado de buque resetea DECLA ---
    if (cambios.buqueViaje && actual.estadoDeclaracion !== 'FALTA') {
      cambios.estadoDeclaracion = { de: actual.estadoDeclaracion, a: 'FALTA' };
      dataActualizar.estadoDeclaracion = 'FALTA';
    }

    // --- Si no cambió nada, no tocamos la base ---
    if (Object.keys(cambios).length === 0 && Object.keys(dataActualizar).length === 0) {
      return res.status(200).json({ mensaje: 'No hubo cambios', booking: actual });
    }

    // --- Armamos las operaciones de la transacción ---
    // Siempre actualizamos el booking. El historial se crea SOLO si hay
    // cambios auditables (si editaste solo el subcliente, cambios está vacío
    // y no queremos una fila de historial vacía).
    const operaciones = [
      prisma.booking.update({
        where: { id: bookingId },
        data: dataActualizar,
        include: { cliente: true, naviera: true, contenedores: true },
      }),
    ];

    if (Object.keys(cambios).length > 0) {
      operaciones.push(
        prisma.historialCambio.create({
          data: {
            bookingId: bookingId,
            cambios: cambios,
            usuarioId: req.usuario.id,
          },
        })
      );
    }

    const [bookingActualizado] = await prisma.$transaction(operaciones);

    res.json(bookingActualizado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al editar el booking' });
  }
}

async function cambiarEstado(req, res) {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id, 10);

    const actual = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!actual) {
      return res.status(404).json({ error: 'Booking no encontrado' });
    }

    const { documentacionOk, zarpadoEn, estadoDeclaracion, estadoVgm } = req.body;

    // Valores permitidos para los estados de texto (String controlado)
    const DECLA_VALIDOS = ['FALTA', 'HECHO', 'ENVIADO', 'EN_CORRECCION'];
    const VGM_VALIDOS = ['FALTA', 'ENVIADO'];

    const usuarioId = req.usuario.id;
    const ahora = new Date();
    const dataActualizar = {};

    // --- documentacionOk (boolean) ---
    if (documentacionOk !== undefined) {
      if (typeof documentacionOk !== 'boolean') {
        return res.status(400).json({ error: 'documentacionOk debe ser true o false' });
      }
      dataActualizar.documentacionOk = documentacionOk;
      dataActualizar.documentacionOkPor = usuarioId;
      dataActualizar.documentacionOkEn = ahora;
    }

    // --- zarpado (ahora es una fecha real de zarpe) ---
    // Enviar zarpadoEn con una fecha = marca el booking como zarpado ese día.
    // Enviar zarpadoEn: null = desmarca (revierte el zarpado).
    if (zarpadoEn !== undefined) {
      if (zarpadoEn === null) {
        // Desmarcar zarpado
        dataActualizar.zarpadoEn = null;
        dataActualizar.zarpadoPor = null;
      } else {
        const fecha = new Date(zarpadoEn);
        if (isNaN(fecha.getTime())) {
          return res.status(400).json({ error: 'zarpadoEn debe ser una fecha válida' });
        }
        dataActualizar.zarpadoEn = fecha;
        dataActualizar.zarpadoPor = usuarioId;
      }
    }

    // --- estadoDeclaracion (texto controlado) ---
    if (estadoDeclaracion !== undefined) {
      if (!DECLA_VALIDOS.includes(estadoDeclaracion)) {
        return res.status(400).json({
          error: `estadoDeclaracion inválido. Valores: ${DECLA_VALIDOS.join(', ')}`,
        });
      }
      dataActualizar.estadoDeclaracion = estadoDeclaracion;
      dataActualizar.declaracionPor = usuarioId;
      dataActualizar.declaracionEn = ahora;
    }

    // --- estadoVgm (texto controlado) ---
    if (estadoVgm !== undefined) {
      if (!VGM_VALIDOS.includes(estadoVgm)) {
        return res.status(400).json({
          error: `estadoVgm inválido. Valores: ${VGM_VALIDOS.join(', ')}`,
        });
      }
      dataActualizar.estadoVgm = estadoVgm;
      dataActualizar.vgmPor = usuarioId;
      dataActualizar.vgmEn = ahora;
    }

    // Si no vino ningún estado para cambiar
    if (Object.keys(dataActualizar).length === 0) {
      return res.status(400).json({ error: 'No se envió ningún estado para actualizar' });
    }

    const bookingActualizado = await prisma.booking.update({
      where: { id: bookingId },
      data: dataActualizar,
      include: {
        cliente: true,
        naviera: true,
        contenedores: true,
        usuarioDocOk: { select: { nombre: true } },
        usuarioZarpado: { select: { nombre: true } },
        usuarioDeclaracion: { select: { nombre: true } },
        usuarioVgm: { select: { nombre: true } },
      },
    });

    res.json(bookingActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al cambiar el estado' });
  }
}

async function obtenerHistorial(req, res) {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id, 10);

    // Verificamos que el booking exista (para dar 404 claro si no)
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking no encontrado' });
    }

    const historial = await prisma.historialCambio.findMany({
      where: { bookingId: bookingId },
      include: {
        usuario: { select: { nombre: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al obtener el historial' });
  }
}

// ---- SPLIT: crear declaraciones hijas a partir de una madre ----
async function splitBooking(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { hijas } = req.body; // [{ bkgNumber, c20, c40 }]
    const madre = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { contenedores: true, declaraciones: true },
    });
    if (!madre) return res.status(404).json({ error: 'Booking no encontrado' });
    if (madre.declaraciones.length > 0) return res.status(409).json({ error: 'Este booking ya está spliteado' });
    if (!Array.isArray(hijas) || hijas.length < 2) return res.status(400).json({ error: 'Un split necesita al menos 2 declaraciones' });

    const tot = (m) => (madre.contenedores.find((c) => String(c.tipo).includes(m))?.cantidad || 0);
    const madre20 = tot('20'), madre40 = tot('40');
    const sum20 = hijas.reduce((a, h) => a + (Number(h.c20) || 0), 0);
    const sum40 = hijas.reduce((a, h) => a + (Number(h.c40) || 0), 0);
    if (sum20 !== madre20 || sum40 !== madre40) {
      return res.status(400).json({ error: `La suma no coincide con la madre (20': ${sum20}/${madre20}, 40': ${sum40}/${madre40})` });
    }
    for (const h of hijas) {
      if (!h.bkgNumber || !h.bkgNumber.trim()) return res.status(400).json({ error: 'Cada declaración necesita su BKG' });
    }

    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    await prisma.$transaction(
      hijas.map((h, i) => prisma.declaracion.create({
        data: {
          bookingId,
          bkgNumber: up(h.bkgNumber),
          sufijo: letras[i] || String(i + 1),
          c20: Number(h.c20) || 0,
          c40: Number(h.c40) || 0,
        },
      }))
    );
    const actualizado = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { cliente: true, naviera: true, contenedores: true, declaraciones: true },
    });
    res.status(201).json(actualizado);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Alguno de los BKG de las hijas ya existe' });
    console.error(error);
    res.status(500).json({ error: 'Error interno al splitear' });
  }
}

// ---- cambiar DECLA/VGM de una declaración hija ----
async function cambiarEstadoDeclaracion(req, res) {
  try {
    const declId = parseInt(req.params.id, 10);
    const { estadoDeclaracion, estadoVgm } = req.body;
    const DECLA_VALIDOS = ['FALTA', 'HECHO', 'ENVIADO', 'EN_CORRECCION'];
    const VGM_VALIDOS = ['FALTA', 'ENVIADO'];
    const data = {};
    if (estadoDeclaracion !== undefined) {
      if (!DECLA_VALIDOS.includes(estadoDeclaracion)) return res.status(400).json({ error: 'estadoDeclaracion inválido' });
      data.estadoDeclaracion = estadoDeclaracion;
    }
    if (estadoVgm !== undefined) {
      if (!VGM_VALIDOS.includes(estadoVgm)) return res.status(400).json({ error: 'estadoVgm inválido' });
      data.estadoVgm = estadoVgm;
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    const decl = await prisma.declaracion.update({ where: { id: declId }, data });
    res.json(decl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al actualizar la declaración' });
  }
}

module.exports = { crearBooking, listarBookings, editarBooking, cambiarEstado, obtenerHistorial, splitBooking, cambiarEstadoDeclaracion };
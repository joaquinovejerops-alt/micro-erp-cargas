const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

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
        bkgNumber: bkgNumber.trim(),
        buqueViaje,
        pol,
        pod,
        producto,
        subcliente,
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

    const {
      cliente, naviera, buqueViaje, pol, pod,
      producto, subcliente, eta, cutoffDoc, cutoffFisico,
    } = req.body;

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

    const { documentacionOk, zarpado, estadoDeclaracion, estadoVgm } = req.body;

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

    // --- zarpado (boolean) ---
    if (zarpado !== undefined) {
      if (typeof zarpado !== 'boolean') {
        return res.status(400).json({ error: 'zarpado debe ser true o false' });
      }
      dataActualizar.zarpado = zarpado;
      dataActualizar.zarpadoPor = usuarioId;
      dataActualizar.zarpadoEn = ahora;
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

module.exports = { crearBooking, listarBookings, editarBooking, cambiarEstado, obtenerHistorial };
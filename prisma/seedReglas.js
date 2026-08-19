// prisma/seedReglas.js
// Carga las reglas de lectura de facturas por naviera (diccionario semilla).
// Correr con: node prisma/seedReglas.js
const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

// Cada naviera: código, nombre, textos para identificar la factura,
// regex de limpieza de basura, y su diccionario de conceptos.
const NAVIERAS = [
  {
    codigo: "MAERSK",
    nombre: "Maersk",
    emisores: ["MAERSK A/S", "MAERSK ARGENTINA", "MAERSK"],
    limpiezaRegex: [],
    conceptos: [
      ["FREETIME EXTENSION", "EXTRA"],
      ["FREE TIME", "EXTRA"],
      ["TASA DE DOCUMENTACION", "LOCAL"],
      ["MANIPULACION EN TERMINAL", "LOCAL"],
      ["SERVICIO DE EXPORTACION", "LOCAL"],
      ["TARIFA DE COMBUSTIBLE DE EMERGENCIA", "FLETE"],
      ["BASIC OCEAN FREIGHT", "FLETE"],
    ],
  },
  {
    codigo: "CMA_CGM",
    nombre: "CMA CGM",
    emisores: ["CMA CGM", "LARA INVOICE"],
    limpiezaRegex: [{ patron: "^(20ST|40HC|40ST|20RF)\\s*", flags: "i" }],
    conceptos: [
      ["FLETE OCEANICO", "FLETE"],
      ["OCEAN FREIGHT", "FLETE"],
      ["TERMINAL HANDLING CHARGE", "LOCAL"],
      ["ISPS", "FLETE"],
      ["ENTRADA /SALIDA", "LOCAL"],
      ["CONTAINER RELEASE SERVICES", "LOCAL"],
      ["SEALING SERVICE", "LOCAL"],
      ["EXPORT DOCUMENTATION", "LOCAL"],
      ["BILL OF LADING AMENDMENT", "EXTRA"],
    ],
  },
  {
    codigo: "PIL",
    nombre: "Pacific International Lines",
    emisores: [
      "AGENCIA MARITIMA INTERNACIONAL",
      "PACIFIC INTERNATIONAL LINES",
      "PIL",
    ],
    limpiezaRegex: [{ patron: "\\s*-\\s*[A-Z0-9]+$", flags: "" }],
    conceptos: [
      ["BASIC OCEAN FREIGHT", "FLETE"],
      ["SUPERCHARGE", "FLETE"],
      ["ISP FACILITY SECURITY", "FLETE"],
      ["TERMINAL HANDLING CHARGE", "LOCAL"],
      ["LOCAL ADMIN CHARGE", "LOCAL"],
      ["LOCAL CONTAINER HANDLING AND DELIVERY", "LOCAL"],
      ["BL FEE", "LOCAL"],
      ["SEAL FEE CHARGE", "LOCAL"],
      ["ADVANCE MANIFEST SURCHARGE", "LOCAL"],
      ["BL AMENDMENT", "EXTRA"],
      ["CHARGE", "FLETE"],
    ],
  },
  {
    codigo: "MSC",
    nombre: "Mediterranean Shipping Company",
    emisores: ["MEDITERRANEAN SHIPPING COMPANY", "MSC"],
    limpiezaRegex: [{ patron: "^[\\*\\-\\s]+", flags: "" }],
    conceptos: [
      ["OCEAN FREIGHT", "FLETE"],
      ["CARRIER SECURITY FEE", "FLETE"],
      ["EMERGENCY FUEL SURCHARGE", "FLETE"],
      ["EMISSIONS TRADING SYSTEM", "FLETE"],
      ["FUEL EU SURCHARGE", "FLETE"],
      ["LOW SULPHUR FUEL CONTRIBUTION", "FLETE"],
      ["RIVER PLATE TOLL FEE", "FLETE"],
      ["TERMINAL HANDLING CHARGE", "LOCAL"],
      ["BILL OF LADING C/O PRINCIPAL", "LOCAL"],
      ["BL PRINTING FEE", "LOCAL"],
      ["CARGO DATA DECLARATION", "LOCAL"],
      ["LOGISTICS FEE ARGENTINA", "LOCAL"],
      ["PRECINTO", "LOCAL"],
      ["HANDLING", "LOCAL"],
    ],
  },
  {
    codigo: "HAPAG_LLOYD",
    nombre: "Hapag-Lloyd",
    emisores: ["HAPAG-LLOYD", "HAPAG LLOYD", "HLCU"],
    limpiezaRegex: [],
    conceptos: [
      ["CARGO DOCUMENTO", "LOCAL"],
      ["SERV MANIP CNTR", "LOCAL"],
      ["SER VALOR AGRE ORI", "LOCAL"],
      ["DETEN", "EXTRA"],
      ["CORREC", "EXTRA"],
    ],
  },
  {
    codigo: "EVERGREEN",
    nombre: "Evergreen",
    emisores: ["EVERGREEN SHIPPING AGENCY", "EVERGREEN"],
    limpiezaRegex: [],
    conceptos: [
      ["RIVER PLATE CHANNEL TOLL", "FLETE"],
      ["SHIP/PORT FACILITY SECURITY", "FLETE"],
      ["LIFT ON", "LOCAL"],
      ["TERMINAL HANDLING CHARGE", "LOCAL"],
      ["CONTAINER SEAL FEE", "LOCAL"],
      ["SECURITY COMPLIANCE MANAGEMENT", "LOCAL"],
      ["EQUIPMENT CONDITION", "LOCAL"],
      ["BL FEE", "LOCAL"],
    ],
  },
  {
    codigo: "COSCO",
    nombre: "COSCO Shipping Lines",
    emisores: ["COSCO SHIPPING LINES", "COSCO"],
    limpiezaRegex: [{ patron: "\\s*O\\/?B.*$", flags: "i" }],
    conceptos: [
      ["THC", "LOCAL"],
      ["RCT", "FLETE"],
      ["LOCAL ADM FEE", "LOCAL"],
      ["GATE OUT", "LOCAL"],
      ["ORIGIN DOC FEE", "LOCAL"],
    ],
  },
  {
    codigo: "ZIM",
    nombre: "ZIM",
    emisores: ["STAR SHIPPING ARGENTINA", "ZIM"],
    limpiezaRegex: [{ patron: "\\s*(EX)?ZIMU[A-Z0-9]+$", flags: "i" }],
    conceptos: [
      ["CONTAINER SERVICE FEE", "LOCAL"],
      ["GATE CHARGE OUT", "LOCAL"],
      ["CHANNEL TOLL", "FLETE"],
      ["SECURITY CUSTOM SEAL", "LOCAL"],
      ["THC", "LOCAL"],
    ],
  },
  {
    codigo: "ONE",
    nombre: "Ocean Network Express",
    emisores: ["OCEAN NETWORK EXPRESS", "ONEY", "ONE"],
    limpiezaRegex: [{ patron: "\\s*ONEY[A-Z0-9]+$", flags: "i" }],
    conceptos: [
      ["CONTAINER CARGO SECURITY CHARGE", "LOCAL"],
      ["DOC FEE", "LOCAL"],
      ["ENTRY SUMMARY DECLARATION SURCHARGE", "LOCAL"],
      ["EUROPE ENVIRONMENT SURCHARGE", "FLETE"],
      ["RIVER PLATE CHANNEL", "FLETE"],
      ["GATE CHARGE", "LOCAL"],
      ["SEAL FEE", "LOCAL"],
      ["TERMINAL HANDLING CHARGE", "LOCAL"],
    ],
  },
];

async function main() {
  let totalConceptos = 0;

  for (const nav of NAVIERAS) {
    // Cabezal de la naviera (upsert por código: no duplica)
    const regla = await prisma.reglaNaviera.upsert({
      where: { codigo: nav.codigo },
      update: {
        nombre: nav.nombre,
        emisores: nav.emisores,
        limpiezaRegex: nav.limpiezaRegex,
      },
      create: {
        codigo: nav.codigo,
        nombre: nav.nombre,
        emisores: nav.emisores,
        limpiezaRegex: nav.limpiezaRegex,
      },
    });

    // Diccionario de conceptos (upsert por naviera+patrón)
    for (const [patron, categoria] of nav.conceptos) {
      await prisma.reglaConcepto.upsert({
        where: {
          reglaNavieraId_patron: {
            reglaNavieraId: regla.id,
            patron: patron,
          },
        },
        update: { categoria: categoria },
        create: {
          reglaNavieraId: regla.id,
          patron: patron,
          categoria: categoria,
          origen: "SEMILLA",
        },
      });
      totalConceptos++;
    }

    console.log(`✓ ${nav.codigo} — ${nav.conceptos.length} conceptos`);
  }

  console.log(`\nListo: ${NAVIERAS.length} navieras, ${totalConceptos} conceptos cargados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
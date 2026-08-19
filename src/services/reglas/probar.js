// src/services/reglas/probar.js
// Prueba el pipeline: node src/services/reglas/probar.js facturas-prueba/tu-factura.pdf
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("../../generated/prisma");
const { leerFactura } = require("../ia");
const { elegirNaviera, procesarItems } = require("./motor");

const prisma = new PrismaClient();
const RUTA = process.argv[2];

function mimePorExtension(ruta) {
  const ext = path.extname(ruta).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext))
    return "image/" + (ext === ".jpg" ? "jpeg" : ext.slice(1));
  throw new Error("Formato no soportado: " + ext);
}

async function main() {
  if (!RUTA) throw new Error("Pasá la ruta de la factura como argumento.");

  // 1) La IA lee la factura
  const buffer = fs.readFileSync(RUTA);
  const extraccion = await leerFactura([{ buffer, mimeType: mimePorExtension(RUTA) }]);

  // 2) Cargamos las reglas de la base (con sus conceptos)
  const reglas = await prisma.reglaNaviera.findMany({
    where: { activo: true },
    include: { conceptos: true },
  });

  // 3) Elegimos la naviera y categorizamos
  const regla = elegirNaviera(extraccion.navieraDetectada, reglas);
  const itemsCategorizados = procesarItems(extraccion.items, regla);

  // 4) Mostramos el resultado
  console.log("\n=== LECTURA ===");
  console.log("Naviera detectada:", extraccion.navieraDetectada);
  console.log("Regla aplicada:", regla ? regla.codigo : "NINGUNA (naviera desconocida)");
  console.log("B/L:", extraccion.bl, "| TC:", extraccion.tipoCambio);
  console.log("\n=== ÍTEMS CATEGORIZADOS ===");
  for (const it of itemsCategorizados) {
    const flag = it.necesitaRevision ? "  ⚠ REVISAR" : "";
    console.log(
      `[${it.categoria}] ${it.descripcionLimpia} — ${it.montoOriginal} ${it.moneda} (${it.origen})${flag}`
    );
  }
}

main()
  .catch((e) => console.error("ERROR:", e.message))
  .finally(() => prisma.$disconnect());
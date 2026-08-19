// src/services/ia/probar.js
// Prueba manual: node src/services/ia/probar.js /ruta/a/tu/factura.pdf
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { leerFactura } = require("./index");

const RUTA = process.argv[2]; // la ruta la pasás como argumento

function mimePorExtension(ruta) {
  const ext = path.extname(ruta).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  throw new Error("Formato no soportado: " + ext);
}

async function main() {
  if (!RUTA) throw new Error("Pasá la ruta de la factura como argumento.");
  const buffer = fs.readFileSync(RUTA);
  const mimeType = mimePorExtension(RUTA);
  console.log("Leyendo:", RUTA, `(${mimeType})\n`);

  const resultado = await leerFactura([{ buffer, mimeType }]);
  console.log(JSON.stringify(resultado, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
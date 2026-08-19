// src/services/ia/index.js
// Capa agnóstica: el backend siempre llama acá, sin saber qué proveedor hay atrás.
const gemini = require("./geminiProvider");

const PROVEEDOR = process.env.IA_PROVEEDOR || "gemini";

async function leerFactura(archivos) {
  switch (PROVEEDOR) {
    case "gemini":
      return gemini.leerFactura(archivos);
    default:
      throw new Error(`Proveedor de IA no soportado: ${PROVEEDOR}`);
  }
}

module.exports = { leerFactura };
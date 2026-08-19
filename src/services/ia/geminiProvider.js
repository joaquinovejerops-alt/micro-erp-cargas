// src/services/ia/geminiProvider.js
// Lee una factura (imagen/PDF) con Gemini y extrae los ítems en JSON.
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELO = "gemini-3.6-flash"; // rápido, multimodal y económico

const INSTRUCCION = `
Sos un asistente que LEE facturas de navieras y agencias marítimas para un
forwarder argentino (ARPAFLU). Tu tarea es EXTRAER datos, nunca inventar.
Devolvé SOLO JSON válido según el esquema pedido.

Extraé:
- navieraDetectada: el nombre de la naviera según el emisor de la factura.
- bl: el número de B/L o Booking si aparece (ej "HLCU1234567", "BUE600117200").
- moneda: la moneda predominante de los ítems (casi siempre "USD").
- tipoCambio: si la factura muestra una leyenda legal de tipo de cambio
  (ej "1 US $ = 1.576,92 $" o "U$S 1= $1488.00"), devolvé ese número como
  ARS por USD (ej 1576.92). Si no hay leyenda, devolvé null.
- items: una entrada por CADA línea de cargo, con:
    · descripcion: el texto del concepto TAL CUAL aparece (no lo traduzcas ni
      lo limpies; incluí prefijos/sufijos como "20ST" o el número de B/L pegado).
    · montoOriginal: el importe de esa línea como número (sin separador de miles).
    · moneda: "USD" o "ARS" según ese ítem.
    · categoriaSugerida: tu mejor estimación entre LOCAL / FLETE / EXTRA:
        LOCAL  = gastos en puerto o tierra, documentación, THC, gate, precintos.
        FLETE  = transporte oceánico, combustibles, peajes de navegación,
                 seguridad del barco (ISPS/ETS), recargos de tarifa (GRI).
        EXTRA  = penalidades, enmiendas documentales, detention/demurrage, freetime.
      Si dudás, poné "LOCAL". NUNCA pongas FLETE si no estás razonablemente seguro.
    · esImpuesto: true si la línea es IVA o una percepción (IIBB); si no, false.
`;

const ESQUEMA = {
  type: Type.OBJECT,
  properties: {
    navieraDetectada: { type: Type.STRING },
    bl: { type: Type.STRING },
    moneda: { type: Type.STRING },
    tipoCambio: { type: Type.NUMBER, nullable: true },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          descripcion: { type: Type.STRING },
          montoOriginal: { type: Type.NUMBER },
          moneda: { type: Type.STRING },
          categoriaSugerida: { type: Type.STRING },
          esImpuesto: { type: Type.BOOLEAN },
        },
        required: ["descripcion", "montoOriginal"],
      },
    },
  },
  required: ["items"],
};

// archivos = [{ buffer, mimeType }]  (uno o varios comprobantes)
async function leerFactura(archivos) {
  const partes = archivos.map((a) => ({
    inlineData: { mimeType: a.mimeType, data: a.buffer.toString("base64") },
  }));
  partes.push({ text: INSTRUCCION });

  const resp = await ai.models.generateContent({
    model: MODELO,
    contents: [{ role: "user", parts: partes }],
    config: {
      responseMimeType: "application/json",
      responseSchema: ESQUEMA,
      temperature: 0, // determinístico: misma factura → misma lectura
    },
  });

  return JSON.parse(resp.text);
}

module.exports = { leerFactura };
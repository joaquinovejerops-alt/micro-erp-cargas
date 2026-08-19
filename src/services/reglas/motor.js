// src/services/reglas/motor.js
// Motor determinístico: limpia, matchea contra el diccionario y categoriza.

// Normaliza texto para comparar: MAYÚSCULAS, sin acentos, espacios colapsados.
function normalizar(texto) {
  return (texto || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ")
    .trim();
}

// Aplica los regex de limpieza de la naviera (los prefijos/sufijos basura).
function limpiarDescripcion(desc, limpiezaRegex) {
  let out = desc || "";
  for (const r of limpiezaRegex || []) {
    try {
      out = out.replace(new RegExp(r.patron, r.flags || ""), "");
    } catch (e) {
      // si un regex está mal escrito, lo salteamos en vez de romper todo
    }
  }
    // saca guiones y espacios sueltos que quedan en las puntas
  return out.replace(/^[\s\-]+|[\s\-]+$/g, "").trim();
}

// Elige la ReglaNaviera cuyo texto de emisor aparece en lo que detectó la IA.
function elegirNaviera(textoDetectado, reglas) {
  const t = normalizar(textoDetectado);
  for (const regla of reglas) {
    for (const emisor of regla.emisores || []) {
      if (t.includes(normalizar(emisor))) return regla;
    }
  }
  return null;
}

// Busca la categoría de una descripción en el diccionario (concepto más largo primero).
function categorizar(descLimpia, conceptos) {
  const desc = normalizar(descLimpia);
  const ordenados = [...conceptos].sort(
    (a, b) => b.patron.length - a.patron.length
  );
  for (const c of ordenados) {
    const patron = normalizar(c.patron);
    let matchea = false;
    if (c.tipoMatch === "exact") matchea = desc === patron;
    else if (c.tipoMatch === "regex") {
      try {
        matchea = new RegExp(c.patron, "i").test(descLimpia);
      } catch (e) {}
    } else {
      matchea = desc.includes(patron); // "includes" = por defecto
    }
    if (matchea) {
      return { categoria: c.categoria, conceptoId: c.id, patron: c.patron };
    }
  }
  return null; // no encontrado
}

// Procesa todos los ítems de la IA contra una ReglaNaviera ya cargada.
function procesarItems(items, reglaNaviera) {
  const limpieza = reglaNaviera ? reglaNaviera.limpiezaRegex : [];
  const conceptos = reglaNaviera ? reglaNaviera.conceptos : [];

  return items.map((item) => {
    const descripcionLimpia = limpiarDescripcion(item.descripcion, limpieza);
    const match = categorizar(descripcionLimpia, conceptos);

    if (match) {
      return {
        ...item,
        descripcionLimpia,
        categoria: match.categoria,
        origen: "DICCIONARIO", // categorizado por tu diccionario
        necesitaRevision: false,
      };
    }
    // Sin match: usamos la sugerencia de la IA y marcamos para que un humano valide.
    return {
      ...item,
      descripcionLimpia,
      categoria: item.categoriaSugerida || "LOCAL",
      origen: "IA_SUGERIDA",
      necesitaRevision: true,
    };
  });
}

module.exports = {
  normalizar,
  limpiarDescripcion,
  elegirNaviera,
  categorizar,
  procesarItems,
};
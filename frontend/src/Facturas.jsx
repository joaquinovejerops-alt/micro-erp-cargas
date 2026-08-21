// frontend/src/Facturas.jsx
import { useEffect, useState } from "react";
import { api } from "./api";

const CATEGORIAS = ["LOCAL", "FLETE", "EXTRA"];

export default function Facturas() {
  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [archivos, setArchivos] = useState(null);
  const [preview, setPreview] = useState(null);
  const [items, setItems] = useState([]);
  const [tipoCambio, setTipoCambio] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    api.listarBookings().then(setBookings).catch((e) => setError(e.message));
  }, []);

  async function leer(e) {
    e.preventDefault();
    setError(""); setExito(""); setPreview(null);
    if (!archivos || archivos.length === 0) { setError("Elegí al menos un archivo"); return; }
    setCargando(true);
    try {
      const fd = new FormData();
      for (const f of archivos) fd.append("archivos", f);
      const data = await api.leerFactura(fd);
      setPreview(data);
      setTipoCambio(data.tipoCambio || "");
      setItems(
        data.items.map((it) => ({
          descripcion: it.descripcionLimpia || it.descripcion,
          categoria: it.categoria,
          montoOriginal: it.montoOriginal,
          moneda: it.moneda,
          origen: it.origen,
          necesitaRevision: it.necesitaRevision,
          aprender: it.necesitaRevision, // por defecto aprende los que hay que revisar
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function editarItem(i, campo, valor) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  }
  function quitarItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function confirmar() {
    setError(""); setExito("");
    if (!bookingId) { setError("Elegí un booking antes de confirmar"); return; }
    setCargando(true);
    try {
      const payload = {
        bookingId: Number(bookingId),
        reglaNavieraId: preview.reglaAplicada?.id || null,
        items: items.map((it) => ({
          categoria: it.categoria,
          proveedor: preview.navieraDetectada,
          descripcion: it.descripcion,
          montoOriginal: Number(it.montoOriginal),
          moneda: it.moneda,
          tipoCambio: it.moneda === "ARS" ? Number(tipoCambio) : undefined,
          aprender: it.aprender,
          patron: it.descripcion,
        })),
      };
      const res = await api.confirmarFactura(payload);
      setExito(`✅ ${res.cantidad} movimientos cargados · ${res.conceptosAprendidos} conceptos aprendidos`);
      setPreview(null); setItems([]); setArchivos(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // totales recalculados en vivo desde los ítems editados
  const totales = items.reduce(
    (acc, it) => {
      const usd = it.moneda === "ARS" && tipoCambio
        ? Number(it.montoOriginal) / Number(tipoCambio)
        : Number(it.montoOriginal);
      if (it.categoria === "LOCAL") acc.local += usd;
      else if (it.categoria === "FLETE") acc.flete += usd;
      else if (it.categoria === "EXTRA") acc.extra += usd;
      return acc;
    },
    { local: 0, flete: 0, extra: 0 }
  );
  const total = totales.local + totales.flete + totales.extra;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, color: "#1a3352" }}>Leer factura</h2>
        <form onSubmit={leer}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Booking</label>
              <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                <option value="">— Elegí un booking —</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>{b.bkgNumber}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Comprobante(s)</label>
              <input type="file" accept=".pdf,image/*" multiple onChange={(e) => setArchivos(e.target.files)} />
            </div>
            <button type="submit" disabled={cargando}>{cargando ? "Leyendo..." : "Leer factura"}</button>
          </div>
        </form>
      </div>

      {error && <div className="error">{error}</div>}
      {exito && <div className="card" style={{ borderColor: "#4a9a5e", color: "#2f7a43", marginBottom: 20 }}>{exito}</div>}

      {preview && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
            <div>
              <div><strong>Naviera:</strong> {preview.navieraDetectada} {preview.reglaAplicada ? `(regla ${preview.reglaAplicada.codigo})` : "(sin regla)"}</div>
              <div><strong>B/L:</strong> {preview.bl || "—"}</div>
            </div>
            <div>
              <label>Tipo de cambio (si hay ARS)</label>
              <input style={{ width: 160 }} value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} placeholder="ej. 1500" />
            </div>
          </div>

          <table className="tabla">
            <thead>
              <tr>
                <th>Descripción</th><th>Categoría</th><th>Monto</th><th>Moneda</th><th>Origen</th><th>Aprender</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={it.necesitaRevision ? { background: "#fdf3e9" } : {}}>
                  <td><input value={it.descripcion} onChange={(e) => editarItem(i, "descripcion", e.target.value)} /></td>
                  <td>
                    <select value={it.categoria} onChange={(e) => editarItem(i, "categoria", e.target.value)}>
                      {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td><input style={{ width: 90 }} value={it.montoOriginal} onChange={(e) => editarItem(i, "montoOriginal", e.target.value)} /></td>
                  <td>
                    <select value={it.moneda} onChange={(e) => editarItem(i, "moneda", e.target.value)}>
                      <option value="USD">USD</option><option value="ARS">ARS</option>
                    </select>
                  </td>
                  <td><span className="small">{it.origen === "DICCIONARIO" ? "📖 dicc." : "🤖 IA"}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <input type="checkbox" checked={it.aprender} onChange={(e) => editarItem(i, "aprender", e.target.checked)} />
                  </td>
                  <td>
                    <button type="button" className="secundario" onClick={() => quitarItem(i)} style={{ padding: "4px 9px" }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
            <div className="small">
              LOCAL {totales.local.toFixed(2)} · FLETE {totales.flete.toFixed(2)} · EXTRA {totales.extra.toFixed(2)} · <strong style={{ color: "#1a3352" }}>Total {total.toFixed(2)} USD</strong>
            </div>
            <button onClick={confirmar} disabled={cargando}>{cargando ? "Cargando..." : "Confirmar y cargar al libro"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
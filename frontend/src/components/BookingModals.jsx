// src/components/BookingModals.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

/* ---------- Historial (lista reutilizable) ---------- */
const CAMPO_LABEL = {
  buqueViaje: "Buque", pol: "POL", pod: "Destino", producto: "Producto",
  eta: "ETA", cutoffDoc: "Cut off doc.", cutoffFisico: "Cut off físico",
  cliente: "Cliente", naviera: "Naviera", estadoDeclaracion: "DECLA", subcliente: "Subcliente",
};
const FECHA_CAMPOS = new Set(["eta", "cutoffDoc", "cutoffFisico"]);
function valor(campo, v) {
  if (v == null || v === "") return "—";
  if (FECHA_CAMPOS.has(campo)) { const d = new Date(v); if (!isNaN(d)) return d.toLocaleDateString("es-AR"); }
  return String(v);
}
function HistItem({ it }) {
  const fecha = new Date(it.creadoEn).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const keys = Object.keys(it.cambios || {});
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1f83c9", marginTop: 4, flexShrink: 0 }} />
        <span style={{ flex: 1, width: 2, background: "#e4e9f0" }} />
      </div>
      <div style={{ paddingBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#98a6b6" }}>{fecha} · {it.usuario?.nombre || "—"}</div>
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {keys.map((k) => (
            <div key={k} style={{ fontSize: 13 }}>
              <b>{CAMPO_LABEL[k] || k}:</b>{" "}
              <span style={{ color: "#98a6b6" }}>{valor(k, it.cambios[k]?.de)}</span> → <b>{valor(k, it.cambios[k]?.a)}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function HistorialLista({ bookingId }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.obtenerHistorial(bookingId).then(setItems).catch((e) => setErr(e.message));
  }, [bookingId]);
  if (err) return <div className="error">{err}</div>;
  if (!items) return <p style={{ color: "#98a6b6", fontSize: 13, margin: 0 }}>Cargando historial…</p>;
  if (items.length === 0) return <p style={{ color: "#98a6b6", fontSize: 13, margin: 0 }}>Sin cambios registrados todavía.</p>;
  return <div>{items.map((it) => <HistItem key={it.id} it={it} />)}</div>;
}
export function HistorialModal({ booking, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>Historial · {booking.bkgNumber}</h3><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body"><HistorialLista bookingId={booking.id} /></div>
        <div className="modal-foot"><button className="btn" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
}

/* ---------- Rolear ---------- */
export function RolearModal({ booking, onClose, onSaved }) {
  const [buque, setBuque] = useState("");
  const [eta, setEta] = useState("");
  const [cutoffDoc, setCd] = useState("");
  const [cutoffFisico, setCf] = useState("");
  const [error, setError] = useState("");
  const [g, setG] = useState(false);
  async function guardar(e) {
    e.preventDefault(); setError("");
    if (!buque.trim()) { setError("El nuevo buque es obligatorio."); return; }
    setG(true);
    try {
      const payload = { buqueViaje: buque };
      if (eta) payload.eta = eta;
      if (cutoffDoc) payload.cutoffDoc = cutoffDoc;
      if (cutoffFisico) payload.cutoffFisico = cutoffFisico;
      const upd = await api.editarBooking(booking.id, payload);
      onSaved(upd); onClose();
    } catch (err) { setError(err.message); } finally { setG(false); }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <div className="modal-head"><h3>Rolear buque</h3><button type="button" className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div style={{ background: "#fff", border: "1px solid #e3e9f2", borderRadius: 9, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#134a76" }}>{booking.bkgNumber}</div>
            <div style={{ fontSize: 11.5, color: "#74849a" }}>Buque actual: <b>{booking.buqueViaje || "—"}</b></div>
          </div>
          <div className="form-field" style={{ marginBottom: 13 }}><label>Nuevo buque <span className="req">*</span></label><input value={buque} onChange={(e) => setBuque(e.target.value)} placeholder="Buque de reemplazo" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
            <div className="form-field"><label>Nueva ETA</label><input type="date" value={eta} onChange={(e) => setEta(e.target.value)} /></div>
            <div className="form-field"><label>Cut off doc.</label><input type="date" value={cutoffDoc} onChange={(e) => setCd(e.target.value)} /></div>
            <div className="form-field"><label>Cut off físico</label><input type="date" value={cutoffFisico} onChange={(e) => setCf(e.target.value)} /></div>
          </div>
          <div style={{ fontSize: 11.5, color: "#98a6b6", marginTop: 8 }}>Al rolear, la DECLA se resetea a FALTA automáticamente y queda registrado en el historial.</div>
          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-foot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={g}>{g ? "Roleando…" : "Rolear"}</button></div>
      </form>
    </div>
  );
}

/* ---------- Marcar zarpado ---------- */
export function ZarparModal({ booking, onClose, onSaved }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [g, setG] = useState(false);
  async function guardar(e) {
    e.preventDefault(); setError("");
    if (!fecha) { setError("Elegí la fecha de zarpe."); return; }
    setG(true);
    try {
      const upd = await api.cambiarEstado(booking.id, { zarpadoEn: fecha });
      onSaved(upd); onClose();
    } catch (err) { setError(err.message); } finally { setG(false); }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <div className="modal-head"><h3>Marcar como zarpado</h3><button type="button" className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div style={{ background: "#fff7db", border: "1px solid #f2e3ab", borderRadius: 9, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#134a76" }}>{booking.bkgNumber}</div>
            <div style={{ fontSize: 11.5, color: "#74849a" }}>{booking.naviera?.nombre} · {booking.buqueViaje || "—"} · a {booking.pod || "—"}</div>
          </div>
          <div className="form-field"><label>Fecha de zarpe</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-foot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={g}>{g ? "Guardando…" : "Confirmar zarpe"}</button></div>
      </form>
    </div>
  );
}

/* ---------- Split ---------- */
export function SplitModal({ booking, onClose, onSaved }) {
  const tot = (m) => (booking.contenedores || []).find((c) => String(c.tipo).includes(m))?.cantidad || 0;
  const madre20 = tot("20"), madre40 = tot("40");
  const defTam = madre20 > 0 && madre40 === 0 ? "20'" : "40'";
  const [hijas, setHijas] = useState([
    { bkgNumber: "", cantidad: "", tamano: defTam },
    { bkgNumber: "", cantidad: "", tamano: defTam },
  ]);
  const [error, setError] = useState("");
  const [g, setG] = useState(false);

  const setH = (i, k) => (e) => { const c = hijas.slice(); c[i] = { ...c[i], [k]: e.target.value }; setHijas(c); };
  const add = () => setHijas([...hijas, { bkgNumber: "", cantidad: "", tamano: defTam }]);
  const rm = (i) => setHijas(hijas.filter((_, j) => j !== i));

  const sum20 = hijas.filter((h) => h.tamano === "20'").reduce((a, h) => a + (Number(h.cantidad) || 0), 0);
  const sum40 = hijas.filter((h) => h.tamano === "40'").reduce((a, h) => a + (Number(h.cantidad) || 0), 0);
  const ok20 = sum20 === madre20, ok40 = sum40 === madre40;
  const bkgOk = hijas.every((h) => h.bkgNumber.trim());
  const cantOk = hijas.every((h) => Number(h.cantidad) > 0);
  const distintos = new Set(hijas.map((h) => h.bkgNumber.trim()).filter(Boolean)).size;
  const valido = ok20 && ok40 && bkgOk && cantOk && distintos >= 2;

  async function guardar(e) {
    e.preventDefault(); setError("");
    if (!valido) { setError("Revisá los BKG (mínimo 2 distintos) y que los contenedores sumen el total de la madre."); return; }
    setG(true);
    try {
      // combinar líneas con el mismo BKG (una hija puede tener 20' y 40')
      const map = {};
      for (const h of hijas) {
        const key = h.bkgNumber.trim();
        if (!map[key]) map[key] = { bkgNumber: h.bkgNumber, c20: 0, c40: 0 };
        if (h.tamano === "20'") map[key].c20 += Number(h.cantidad) || 0;
        else map[key].c40 += Number(h.cantidad) || 0;
      }
      const upd = await api.splitBooking(booking.id, { hijas: Object.values(map) });
      onSaved(upd); onClose();
    } catch (err) { setError(err.message); } finally { setG(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <div className="modal-head"><h3>Dividir reserva (Split)</h3><button type="button" className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #e3e9f2", borderRadius: 9, padding: "12px 14px", marginBottom: 15 }}>
            <div><div style={{ fontSize: 11.5, color: "#74849a" }}>BKG madre</div><div style={{ fontSize: 14, fontWeight: 800 }}>{booking.bkgNumber}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 11.5, color: "#74849a" }}>Contenedores</div><div style={{ fontSize: 14, fontWeight: 800 }}>{madre20 > 0 ? `${madre20}×20' ` : ""}{madre40 > 0 ? `${madre40}×40'` : ""}{madre20 === 0 && madre40 === 0 ? "—" : ""}</div></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#5f7185", textTransform: "uppercase", letterSpacing: ".2px" }}>Splits</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: (ok20 && ok40) ? "#e7f6ec" : "#f1ece0", color: (ok20 && ok40) ? "#1c7a41" : "#8a6d00" }}>20': {sum20}/{madre20} · 40': {sum40}/{madre40}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hijas.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 34px", gap: 10 }}>
                <input placeholder={`BKG hija ${String.fromCharCode(65 + i)}`} value={h.bkgNumber} onChange={setH(i, "bkgNumber")} />
                <input type="number" min="0" placeholder="Cant." value={h.cantidad} onChange={setH(i, "cantidad")} />
                <select value={h.tamano} onChange={setH(i, "tamano")}>
                  <option value="20'">20'</option>
                  <option value="40'">40'</option>
                </select>
                <button type="button" className="btn" style={{ padding: 0, justifyContent: "center" }} onClick={() => rm(i)} disabled={hijas.length <= 2}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}><span onClick={add} style={{ color: "var(--blue)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Agregar hija</span></div>
          <div style={{ fontSize: 11.5, color: "#98a6b6", marginTop: 10 }}>Cada hija hereda cliente, buque, destino y fechas de la madre. La plata (facturas) queda en la madre. Si una hija lleva 20' y 40', cargala en dos líneas con el mismo BKG.</div>
          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-foot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={g || !valido}>{g ? "Dividiendo…" : "Confirmar split"}</button></div>
      </form>
    </div>
  );
}
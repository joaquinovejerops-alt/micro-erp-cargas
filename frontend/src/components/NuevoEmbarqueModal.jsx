// src/components/NuevoEmbarqueModal.jsx
import { useState } from "react";
import { api } from "../api";

export default function NuevoEmbarqueModal({ onClose, onCreated }) {
  const [f, setF] = useState({
    bkgNumber: "", cliente: "", naviera: "", buqueViaje: "", producto: "",
    pol: "BUENOS AIRES", pod: "", subcliente: "", eta: "", cutoffDoc: "", cutoffFisico: "",
  });
  const [conts, setConts] = useState([{ tipo: "40'", cantidad: "" }]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setCont = (i, k) => (e) => {
    const copy = conts.slice();
    copy[i] = { ...copy[i], [k]: e.target.value };
    setConts(copy);
  };
  const addCont = () => setConts([...conts, { tipo: "20'", cantidad: "" }]);
  const rmCont = (i) => setConts(conts.filter((_, j) => j !== i));

  async function guardar(e) {
    e.preventDefault();
    setError("");
    if (!f.bkgNumber.trim() || !f.cliente.trim() || !f.naviera.trim()) {
      setError("BKG, cliente y naviera son obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        ...f,
        eta: f.eta || null,
        cutoffDoc: f.cutoffDoc || null,
        cutoffFisico: f.cutoffFisico || null,
        contenedores: conts
          .filter((c) => Number(c.cantidad) > 0)
          .map((c) => ({ tipo: c.tipo, cantidad: Number(c.cantidad) })),
      };
      const nuevo = await api.crearBooking(payload);
      onCreated(nuevo);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <div className="modal-head">
          <h3>Nuevo embarque</h3>
          <button type="button" className="modal-x" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-field"><label>Cliente <span className="req">*</span></label><input value={f.cliente} onChange={set("cliente")} placeholder="Ej: ACA" /></div>
            <div className="form-field"><label>Producto</label><input value={f.producto} onChange={set("producto")} placeholder="Ej: Algodón" /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Naviera / Agencia <span className="req">*</span></label><input value={f.naviera} onChange={set("naviera")} placeholder="Ej: MAERSK" /></div>
            <div className="form-field"><label>BKG / Reserva <span className="req">*</span></label><input value={f.bkgNumber} onChange={set("bkgNumber")} placeholder="Nº de booking" /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Buque / Viaje</label><input value={f.buqueViaje} onChange={set("buqueViaje")} placeholder="Nombre del buque" /></div>
            <div className="form-field"><label>Subcliente</label><input value={f.subcliente} onChange={set("subcliente")} placeholder="(opcional)" /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>POL (Origen)</label><input value={f.pol} onChange={set("pol")} /></div>
            <div className="form-field"><label>Destino</label><input value={f.pod} onChange={set("pod")} placeholder="Puerto de destino" /></div>
          </div>

          <div className="form-field" style={{ marginBottom: 13 }}>
            <label>Contenedores</label>
            {conts.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 34px", gap: 10, marginBottom: 8 }}>
                <input type="number" min="0" value={c.cantidad} onChange={setCont(i, "cantidad")} placeholder="Cantidad" />
                <select value={c.tipo} onChange={setCont(i, "tipo")}>
                  <option value="20'">20'</option>
                  <option value="40'">40'</option>
                </select>
                <button type="button" onClick={() => rmCont(i)} className="btn" style={{ padding: 0, justifyContent: "center" }} disabled={conts.length === 1}>✕</button>
              </div>
            ))}
            <span onClick={addCont} style={{ color: "var(--blue)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Agregar tamaño</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
            <div className="form-field"><label>ETA</label><input type="date" value={f.eta} onChange={set("eta")} /></div>
            <div className="form-field"><label>Cut off doc.</label><input type="date" value={f.cutoffDoc} onChange={set("cutoffDoc")} /></div>
            <div className="form-field"><label>Cut off físico</label><input type="date" value={f.cutoffFisico} onChange={set("cutoffFisico")} /></div>
          </div>
          <div style={{ fontSize: 11.5, color: "#98a6b6", marginTop: 6 }}>Las fechas son opcionales — si todavía no están, dejalas vacías (queda como TBA).</div>

          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Crear embarque"}</button>
        </div>
      </form>
    </div>
  );
}
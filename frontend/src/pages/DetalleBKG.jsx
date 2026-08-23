// src/pages/DetalleBKG.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { api } from "../api";
import { RolearModal, ZarparModal, HistorialLista } from "../components/BookingModals";

function fechaLarga(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
const DECLA = {
  FALTA: { t: "FALTA", c: "falta" }, HECHO: { t: "HECHO", c: "hecho" },
  ENVIADO: { t: "ENVIADO", c: "enviado" }, EN_CORRECCION: { t: "EN CORR.", c: "corr" },
};
const VGM = { FALTA: { t: "FALTA", c: "falta" }, ENVIADO: { t: "ENVIADO", c: "venviado" } };

function Campo({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#98a6b6", textTransform: "uppercase", letterSpacing: ".3px", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{children || "—"}</div>
    </div>
  );
}

export default function DetalleBKG() {
  const { id } = useParams();
  const location = useLocation();
  const [bkg, setBkg] = useState(location.state?.booking || null);
  const [cargando, setCargando] = useState(!location.state?.booking);
  const [error, setError] = useState("");
  const [rolear, setRolear] = useState(false);
  const [zarpar, setZarpar] = useState(false);
  const [histKey, setHistKey] = useState(0);

  useEffect(() => {
    if (bkg) return;
    api.listarBookings()
      .then((list) => {
        const found = list.find((b) => String(b.id) === String(id));
        found ? setBkg(found) : setError("No se encontró el booking.");
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  async function desmarcarZarpado() {
    try { setBkg(await api.cambiarEstado(bkg.id, { zarpadoEn: null })); }
    catch (e) { alert("Error: " + e.message); }
  }

  if (cargando) return <div className="page"><p style={{ color: "#98a6b6" }}>Cargando…</p></div>;
  if (error) return <div className="page"><Link to="/embarques">← Volver</Link><div className="error" style={{ marginTop: 12 }}>{error}</div></div>;
  if (!bkg) return null;

  const d = DECLA[bkg.estadoDeclaracion] || { t: bkg.estadoDeclaracion, c: "falta" };
  const v = VGM[bkg.estadoVgm] || { t: bkg.estadoVgm, c: "falta" };
  const zarp = !!bkg.zarpadoEn;

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <Link to="/embarques" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6c7a8a" }}>← Volver a embarques</Link>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => setRolear(true)}>Rolear buque</button>
          {zarp
            ? <button className="btn" onClick={desmarcarZarpado}>Desmarcar zarpado</button>
            : <button className="btn" onClick={() => setZarpar(true)}>Marcar zarpado</button>}
          <button className="btn" disabled title="Lo construimos en el próximo paso">Split</button>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--blue)" }}>{bkg.bkgNumber}</div>
            <div style={{ fontSize: 13, color: "#6c7a8a", marginTop: 3 }}>{bkg.buqueViaje || "Buque a confirmar"} · {bkg.cliente?.nombre} · {bkg.naviera?.nombre}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {zarp && <span className="chip" style={{ background: "#fdf6c8", color: "#8a6d00" }}>ZARPADO {fechaLarga(bkg.zarpadoEn)}</span>}
            <span style={{ fontSize: 11, color: "#98a6b6", fontWeight: 700 }}>DECLA</span><span className={"chip " + d.c}>{d.t}</span>
            <span style={{ fontSize: 11, color: "#98a6b6", fontWeight: 700 }}>VGM</span><span className={"chip " + v.c}>{v.t}</span>
          </div>
        </div>

        <div style={{ height: 1, background: "#eef2f6", margin: "18px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          <Campo label="Cliente">{bkg.cliente?.nombre}</Campo>
          <Campo label="Naviera / Agencia">{bkg.naviera?.nombre}</Campo>
          <Campo label="Buque / Viaje">{bkg.buqueViaje}</Campo>
          <Campo label="Producto">{bkg.producto}</Campo>
          <Campo label="POL (Origen)">{bkg.pol}</Campo>
          <Campo label="Destino">{bkg.pod}</Campo>
          <Campo label="ETA">{fechaLarga(bkg.eta)}</Campo>
          <Campo label="Subcliente">{bkg.subcliente}</Campo>
          <Campo label="Cut off documental">{fechaLarga(bkg.cutoffDoc)}</Campo>
          <Campo label="Cut off físico">{fechaLarga(bkg.cutoffFisico)}</Campo>
          <Campo label="Documentación">{bkg.documentacionOk ? "OK" : "Pendiente"}</Campo>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#98a6b6", textTransform: "uppercase", letterSpacing: ".3px", marginBottom: 8 }}>Contenedores</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(bkg.contenedores || []).length === 0 && <span style={{ color: "#98a6b6", fontSize: 13 }}>Sin contenedores cargados.</span>}
            {(bkg.contenedores || []).map((c) => (
              <span key={c.id ?? c.tipo} style={{ background: "#eef4fb", color: "#1668a6", fontWeight: 700, fontSize: 13, padding: "6px 12px", borderRadius: 8 }}>{c.cantidad} x {c.tipo}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Financiero</div>
          <p style={{ color: "#98a6b6", fontSize: 13, margin: 0 }}>Acá van los movimientos del BKG (venta, costo, profit). Lo conectamos cuando sumemos los movimientos al detalle en el backend.</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Historial de cambios</div>
          <HistorialLista key={histKey} bookingId={bkg.id} />
        </div>
      </div>

      {rolear && <RolearModal booking={bkg} onClose={() => setRolear(false)} onSaved={(upd) => { setBkg(upd); setHistKey((k) => k + 1); }} />}
      {zarpar && <ZarparModal booking={bkg} onClose={() => setZarpar(false)} onSaved={setBkg} />}
    </div>
  );
}
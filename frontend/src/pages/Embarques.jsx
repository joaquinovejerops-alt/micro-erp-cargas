// src/pages/Embarques.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import NuevoEmbarqueModal from "../components/NuevoEmbarqueModal";
import { RolearModal, ZarparModal, HistorialModal, SplitModal } from "../components/BookingModals";

function fechaCorta(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function cont(row, medida) {
  const c = (row.contenedores || []).find((x) => String(x.tipo).includes(medida));
  return c ? c.cantidad : 0;
}
const DECLA = {
  FALTA: { t: "FALTA", c: "falta" }, HECHO: { t: "HECHO", c: "hecho" },
  ENVIADO: { t: "ENVIADO", c: "enviado" }, EN_CORRECCION: { t: "EN CORR.", c: "corr" },
};
const VGM = { FALTA: { t: "FALTA", c: "falta" }, ENVIADO: { t: "ENVIADO", c: "venviado" } };
const DECLA_OPTS = ["FALTA", "HECHO", "ENVIADO", "EN_CORRECCION"];
const VGM_OPTS = ["FALTA", "ENVIADO"];
function rollup(decls) {
  const declaHecho = decls.length > 0 && decls.every((d) => d.estadoDeclaracion === "HECHO");
  const vgmEnv = decls.length > 0 && decls.every((d) => d.estadoVgm === "ENVIADO");
  return { decla: declaHecho ? "HECHO" : "FALTA", vgm: vgmEnv ? "ENVIADO" : "FALTA" };
}

export default function Embarques() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState(null);
  const [rolear, setRolear] = useState(null);
  const [zarpar, setZarpar] = useState(null);
  const [histRow, setHistRow] = useState(null);
  const [split, setSplit] = useState(null);
  const [exp, setExp] = useState(() => new Set());

  useEffect(() => {
    api.listarBookings().then(setRows).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, []);

  const actualizarFila = (upd) => setRows((prev) => prev.map((r) => (r.id === upd.id ? { ...upd, historial: upd.historial ?? r.historial ?? [], declaraciones: upd.declaraciones ?? r.declaraciones ?? [] } : r)));

  async function cambiar(row, data) {
    try { actualizarFila(await api.cambiarEstado(row.id, data)); } catch (e) { alert("Error: " + e.message); }
  }
  async function cambiarDecl(bookingId, dec, data) {
    try {
      const upd = await api.cambiarEstadoDeclaracion(dec.id, data);
      setRows((prev) => prev.map((r) => (r.id !== bookingId ? r : { ...r, declaraciones: r.declaraciones.map((d) => (d.id === upd.id ? upd : d)) })));
    } catch (e) { alert("Error: " + e.message); }
  }
  function toggle(id) { setExp((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function abrirMenu(e, row) { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMenu({ row, x: r.right, y: r.bottom }); }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Embarques <span style={{ fontWeight: 500, color: "#98a6b6", fontSize: 14 }}>· {rows.length}</span></h1>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo embarque</button>
      </div>

      {cargando && <p style={{ color: "#98a6b6" }}>Cargando embarques…</p>}
      {error && <div className="error">Error: {error}</div>}

      {!cargando && !error && (
        <div className="grid-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>ETA</th><th>BUQUE</th><th>BKG</th><th>CLIENTE</th><th>AGENCIA</th>
                <th className="center">20'</th><th className="center">40'</th>
                <th>PRODUCTO</th><th>POL</th><th>DESTINO</th>
                <th>C.OFF DOC</th><th>C.OFF FÍS</th><th>DECLA</th><th>VGM</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={15} style={{ textAlign: "center", color: "#98a6b6", padding: 26 }}>No hay embarques cargados todavía.</td></tr>
              )}
              {rows.flatMap((r) => {
                const zarp = !!r.zarpadoEn;
                const esSplit = (r.declaraciones || []).length > 0;
                const abierto = exp.has(r.id);
                const rowClass = zarp ? "zarp" : (!r.eta ? "tba" : "");
                const roll = esSplit ? rollup(r.declaraciones) : null;
                const d = esSplit ? DECLA[roll.decla] : (DECLA[r.estadoDeclaracion] || { c: "falta" });
                const v = esSplit ? VGM[roll.vgm] : (VGM[r.estadoVgm] || { c: "falta" });
                const c20 = cont(r, "20"), c40 = cont(r, "40");
                const rolado = (r.historial || []).some((h) => h.cambios && h.cambios.buqueViaje);

                const filas = [
                  <tr key={r.id} className={rowClass} onClick={() => nav(`/embarques/${r.id}`, { state: { booking: r } })}>
                    <td style={{ fontWeight: 700 }}>{zarp ? fechaCorta(r.zarpadoEn) : (fechaCorta(r.eta) || "TBA")}</td>
                    <td className="buque">{r.buqueViaje || "—"}</td>
                    <td className="bkg">
                      {esSplit && <span onClick={(e) => { e.stopPropagation(); toggle(r.id); }} style={{ cursor: "pointer", marginRight: 6 }}>{abierto ? "▾" : "▸"}</span>}
                      {r.bkgNumber}
                      {esSplit && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, background: "#e7f1fa", color: "#1668a6", padding: "2px 6px", borderRadius: 5 }}>SPLIT</span>}
                    </td>
                    <td className="center" style={{ fontWeight: 700 }}>{r.cliente?.nombre}</td>
                    <td>{r.naviera?.nombre}</td>
                    <td className="center">{c20 > 0 ? c20 : <span className="muted-c">0</span>}</td>
                    <td className="center">{c40 > 0 ? c40 : <span className="muted-c">0</span>}</td>
                    <td>{r.producto || "—"}</td>
                    <td>{r.pol || "—"}</td>
                    <td>{r.pod || "—"}</td>
                    <td>{fechaCorta(r.cutoffDoc) || "—"}</td>
                    <td>{fechaCorta(r.cutoffFisico) || "—"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {esSplit
                        ? <span className={"chip " + d.c} title="Rollup de las hijas">{d.t}</span>
                        : <select className={"chip " + d.c} value={r.estadoDeclaracion} onChange={(e) => cambiar(r, { estadoDeclaracion: e.target.value })}>{DECLA_OPTS.map((o) => <option key={o} value={o}>{DECLA[o].t}</option>)}</select>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {esSplit
                        ? <span className={"chip " + v.c} title="Rollup de las hijas">{v.t}</span>
                        : <select className={"chip " + v.c} value={r.estadoVgm} onChange={(e) => cambiar(r, { estadoVgm: e.target.value })}>{VGM_OPTS.map((o) => <option key={o} value={o}>{VGM[o].t}</option>)}</select>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      {rolado && (
                        <button className="dots-btn" title="Rolado — ver historial" style={{ color: "#b26a00" }} onClick={() => setHistRow(r)}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5l3 2" /></svg>
                        </button>
                      )}
                      <button className="dots-btn" onClick={(e) => abrirMenu(e, r)}>⋮</button>
                    </td>
                  </tr>,
                ];

                if (esSplit && abierto) {
                  r.declaraciones.forEach((dec) => {
                    filas.push(
                      <tr key={"d" + dec.id} style={{ background: "#f7fbff" }}>
                        <td style={{ color: "#a7b4c3" }}>{fechaCorta(r.eta) || "—"}</td>
                        <td style={{ color: "#a7b4c3", whiteSpace: "nowrap" }}>{r.buqueViaje || "—"}</td>
                        <td style={{ color: "#1f83c9", fontWeight: 600, whiteSpace: "nowrap" }}><span style={{ color: "#b7c4d3", marginRight: 5 }}>└</span>{dec.bkgNumber}</td>
                        <td className="center" style={{ color: "#a7b4c3" }}>{r.cliente?.nombre}</td>
                        <td style={{ color: "#a7b4c3" }}>{r.naviera?.nombre}</td>
                        <td className="center">{dec.c20 > 0 ? dec.c20 : <span className="muted-c">0</span>}</td>
                        <td className="center">{dec.c40 > 0 ? dec.c40 : <span className="muted-c">0</span>}</td>
                        <td style={{ color: "#a7b4c3" }}>{r.producto || "—"}</td>
                        <td style={{ color: "#a7b4c3" }}>{r.pol || "—"}</td>
                        <td style={{ color: "#a7b4c3" }}>{r.pod || "—"}</td>
                        <td style={{ color: "#a7b4c3" }}>{fechaCorta(r.cutoffDoc) || "—"}</td>
                        <td style={{ color: "#a7b4c3" }}>{fechaCorta(r.cutoffFisico) || "—"}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select className={"chip " + (DECLA[dec.estadoDeclaracion]?.c || "falta")} value={dec.estadoDeclaracion} onChange={(e) => cambiarDecl(r.id, dec, { estadoDeclaracion: e.target.value })}>{DECLA_OPTS.map((o) => <option key={o} value={o}>{DECLA[o].t}</option>)}</select>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select className={"chip " + (VGM[dec.estadoVgm]?.c || "falta")} value={dec.estadoVgm} onChange={(e) => cambiarDecl(r.id, dec, { estadoVgm: e.target.value })}>{VGM_OPTS.map((o) => <option key={o} value={o}>{VGM[o].t}</option>)}</select>
                        </td>
                        <td></td>
                      </tr>
                    );
                  });
                }
                return filas;
              })}
            </tbody>
          </table>
        </div>
      )}

      {menu && (
        <>
          <div className="menu-backdrop" onClick={() => setMenu(null)} />
          <div className="rowmenu" style={{ top: menu.y + 4, left: menu.x - 195 }}>
            <div className="rowmenu-item" onClick={() => { nav(`/embarques/${menu.row.id}`, { state: { booking: menu.row } }); setMenu(null); }}>Ver detalle</div>
            <div className="rowmenu-item" onClick={() => { setRolear(menu.row); setMenu(null); }}>Rolear buque</div>
            {(menu.row.declaraciones || []).length === 0 && (
              <div className="rowmenu-item" onClick={() => { setSplit(menu.row); setMenu(null); }}>Dividir (Split)</div>
            )}
            {menu.row.zarpadoEn
              ? <div className="rowmenu-item danger" onClick={() => { cambiar(menu.row, { zarpadoEn: null }); setMenu(null); }}>Desmarcar zarpado</div>
              : <div className="rowmenu-item" onClick={() => { setZarpar(menu.row); setMenu(null); }}>Marcar zarpado</div>}
          </div>
        </>
      )}

      {modal && <NuevoEmbarqueModal onClose={() => setModal(false)} onCreated={(n) => setRows((prev) => [n, ...prev])} />}
      {rolear && <RolearModal booking={rolear} onClose={() => setRolear(null)} onSaved={(upd) => setRows((prev) => prev.map((r) => (r.id === upd.id ? { ...upd, historial: [...(r.historial || []), { cambios: { buqueViaje: {} } }], declaraciones: r.declaraciones } : r)))} />}
      {zarpar && <ZarparModal booking={zarpar} onClose={() => setZarpar(null)} onSaved={actualizarFila} />}
      {histRow && <HistorialModal booking={histRow} onClose={() => setHistRow(null)} />}
      {split && <SplitModal booking={split} onClose={() => setSplit(null)} onSaved={(upd) => { setRows((prev) => prev.map((r) => (r.id === upd.id ? { ...upd, historial: r.historial } : r))); setExp((prev) => new Set(prev).add(upd.id)); }} />}
    </div>
  );
}
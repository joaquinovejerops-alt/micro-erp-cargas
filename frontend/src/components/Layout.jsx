// src/components/Layout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

const cls = ({ isActive }) => "navitem" + (isActive ? " active" : "");

const Logo = () => (
  <svg width="26" height="30" viewBox="0 0 100 115">
    <path d="M18 12 H82 V60 L50 32 L18 60 Z" fill="#2b8fcf" />
    <path d="M50 68 L63 81 L50 94 L37 81 Z" fill="#ee3d52" />
  </svg>
);

// íconos (heroicons-style, trazo)
const I = {
  dash: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  ship: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M2 13h20l-2 6H4z"/><path d="M6 13V7a2 2 0 012-2h8a2 2 0 012 2v6"/><path d="M12 5V3"/></svg>,
  users: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0111 0"/><path d="M16 5.2a3.2 3.2 0 010 6"/><path d="M17.5 20a5.5 5.5 0 00-2-4.3"/></svg>,
  building: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 21V8l7-4 7 4v13"/><path d="M3 21h18"/><path d="M9 21v-5h4v5"/></svg>,
  bill: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
  scan: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 7V5a1 1 0 011-1h2M20 7V5a1 1 0 00-1-1h-2M4 17v2a1 1 0 001 1h2M20 17v2a1 1 0 01-1 1h-2"/><path d="M7 12h10"/></svg>,
  chart: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>,
  gear: <svg width="18" height="18" fill="none" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2l-.3-2.6H10l-.3 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2l.3 2.6h4l.3-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>,
};

export default function Layout() {
  const nav = useNavigate();
  function salir() {
    clearToken();
    nav("/login");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Logo /><span>Arpaflu</span></div>
        <nav className="nav">
          <div className="nav-group">OPERACIONES</div>
          <NavLink to="/dashboard" className={cls}>{I.dash}Dashboard</NavLink>
          <NavLink to="/embarques" className={cls}>{I.ship}Embarques</NavLink>
          <div className="nav-group">MAESTROS</div>
          <NavLink to="/clientes" className={cls}>{I.users}Clientes</NavLink>
          <NavLink to="/navieras" className={cls}>{I.building}Navieras / Agencias</NavLink>
          <div className="nav-group">FINANZAS</div>
          <NavLink to="/facturacion" className={cls}>{I.bill}Facturación</NavLink>
          <NavLink to="/facturas" className={cls}>{I.scan}Carga de Facturas<span className="nav-badge">IA</span></NavLink>
          <div className="nav-group">REPORTES</div>
          <NavLink to="/tableros" className={cls}>{I.chart}Tableros</NavLink>
        </nav>
        <NavLink to="/configuracion" className={cls} style={{ margin: "8px 12px" }}>{I.gear}Configuración</NavLink>
      </aside>

      <div className="content">
        <header className="topbar">
          <div style={{ flex: 1 }} />
          <div className="userchip">
            <div className="avatar">JV</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Joaquín Ovejero</div>
              <div style={{ fontSize: 11, color: "#98a6b6" }}>Despachante</div>
            </div>
            <button className="btn" onClick={salir} style={{ marginLeft: 14 }}>Salir</button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
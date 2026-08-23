// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

const Logo = (props) => (
  <svg viewBox="0 0 100 115" {...props}>
    <path d="M18 12 H82 V60 L50 32 L18 60 Z" fill="#2b8fcf" />
    <path d="M50 68 L63 81 L50 94 L37 81 Z" fill="#ee3d52" />
  </svg>
);

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError(""); setCargando(true);
    try {
      const data = await api.login(email, password);
      setToken(data.token);
      nav("/embarques");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div style={{ width: 620, background: "radial-gradient(120% 90% at 50% 38%, #12294a 0%, #0b1a30 55%, #071120 100%)", color: "#fff", display: "flex", flexDirection: "column", padding: "44px 52px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 2.5, color: "#6f9dc8" }}>ERP · CRM DE CARGAS</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Logo width="200" height="230" style={{ filter: "drop-shadow(0 12px 30px rgba(0,0,0,.35))" }} />
          <div style={{ marginTop: 22, fontSize: 52, fontWeight: 800, letterSpacing: "-.5px" }}>Arpaflu <span style={{ fontWeight: 500, color: "#9fb4cc" }}>srl</span></div>
          <div style={{ marginTop: 10, fontSize: 15, color: "#8ba3bf" }}>Freight Forwarding · Comercio exterior</div>
        </div>
        <div style={{ fontSize: 12, color: "#647c98" }}>© 2026 Arpaflu srl</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <form onSubmit={entrar} style={{ width: 360 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Ingresá a tu cuenta</h2>
          <p style={{ fontSize: 14, color: "#98a6b6", margin: "0 0 28px" }}>Bienvenido de nuevo. Cargá tus datos para continuar.</p>
          <div style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@arpaflu.com" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={cargando} style={{ width: "100%", padding: 14, fontSize: 15, justifyContent: "center" }}>
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
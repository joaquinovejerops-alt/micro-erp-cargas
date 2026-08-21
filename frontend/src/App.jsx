// frontend/src/App.jsx
import { useState } from "react";
import { api, getToken, setToken, clearToken } from "./api";
import Facturas from "./Facturas";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await api.login(email, password);
      setToken(data.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1 style={{ color: "#1a3352", textAlign: "center", marginBottom: 24 }}>
        ARPAFLU · ERP
      </h1>
      <form className="card" onSubmit={entrar}>
        <div style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>Contraseña</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={cargando} style={{ width: "100%" }}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [logueado, setLogueado] = useState(!!getToken());

  function salir() {
    clearToken();
    setLogueado(false);
  }

  if (!logueado) return <Login onLogin={() => setLogueado(true)} />;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#1a3352", margin: 0 }}>ARPAFLU · ERP</h1>
        <button className="secundario" onClick={salir}>Salir</button>
      </div>
      <Facturas />
    </div>
  );
}

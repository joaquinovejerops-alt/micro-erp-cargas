// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Embarques from "./pages/Embarques";
import DetalleBKG from "./pages/DetalleBKG";
import Placeholder from "./pages/Placeholder";
import Facturas from "./Facturas";

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/embarques" replace />} />
          <Route path="/embarques" element={<Embarques />} />
          <Route path="/embarques/:id" element={<DetalleBKG />} />
          <Route path="/facturas" element={<div className="page"><Facturas /></div>} />
          <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
          <Route path="/clientes" element={<Placeholder title="Clientes" />} />
          <Route path="/navieras" element={<Placeholder title="Navieras / Agencias" />} />
          <Route path="/facturacion" element={<Placeholder title="Facturación" />} />
          <Route path="/tableros" element={<Placeholder title="Tableros" />} />
          <Route path="/configuracion" element={<Placeholder title="Configuración" />} />
        </Route>
        <Route path="*" element={<Navigate to="/embarques" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
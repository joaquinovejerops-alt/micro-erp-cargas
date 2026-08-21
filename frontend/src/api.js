// frontend/src/api.js
// Único punto de contacto con el backend. Adjunta el token JWT en cada request.
const API_URL = "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(t) {
  localStorage.setItem("token", t);
}
export function clearToken() {
  localStorage.removeItem("token");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData (archivos) — el navegador pone el Content-Type solo
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detalle || `Error ${res.status}`);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  leerFactura: (formData) =>
    request("/facturas/leer", { method: "POST", body: formData, isForm: true }),
  confirmarFactura: (payload) =>
    request("/facturas/confirmar", { method: "POST", body: payload }),
  listarBookings: () => request("/bookings"),
  listarReglas: () => request("/reglas"),
};
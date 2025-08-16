// src/services/clientesService.js
import axios from "axios";
import { getIdTokenForUser } from "./authService";

const FORCE_DEV = import.meta.env.VITE_FORCE_DEV === "true";
const USE_EMULATOR = import.meta.env.DEV && FORCE_DEV;

const BASE = USE_EMULATOR
  ? import.meta.env.VITE_FUNCTIONS_EMULATOR_URL
  : `https://us-central1-${
      import.meta.env.VITE_FIREBASE_PROJECT_ID
    }.cloudfunctions.net/api`;

async function authHeaders() {
  const token = await getIdTokenForUser();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ---------- CRUD ----------
export async function registrarCliente(data) {
  const headers = await authHeaders();
  const { data: res } = await axios.post(`${BASE}/clientes`, data, { headers });
  return res; // { id, ...campos }
}

export async function obtenerCliente(id) {
  const headers = await authHeaders();
  const { data: res } = await axios.get(`${BASE}/clientes/${id}`, { headers });
  return res; // { id, ...campos }
}

export async function actualizarCliente(id, data) {
  const headers = await authHeaders();
  const { data: res } = await axios.put(`${BASE}/clientes/${id}`, data, {
    headers,
  });
  return res; // { id, ...campos }
}

export async function eliminarCliente(id) {
  const headers = await authHeaders();
  const res = await axios.delete(`${BASE}/clientes/${id}`, { headers });
  return res; // status 200/404/500 ...
}

// ---------- Nuevos: listado paginado y búsqueda ----------
// GET /clientes?limit=&cursor=
export async function obtenerClientesPaginado({
  limit = 20,
  cursor = null,
} = {}) {
  const headers = await authHeaders();
  const params = { limit };
  if (cursor) params.cursor = cursor;

  const { data } = await axios.get(`${BASE}/clientes`, { headers, params });
  // data: { items: Cliente[], nextCursor: string|null }
  return data;
}

// GET /clientes/search?q=&field=nombre|direccion&limit=&cursor=
export async function buscarClientes({
  q,
  field = "nombre",
  limit = 20,
  cursor = null,
} = {}) {
  if (!q || !q.trim()) {
    // si no hay término, conviene reutilizar el listado normal
    return obtenerClientesPaginado({ limit, cursor });
  }

  const headers = await authHeaders();
  const params = { q: q.trim(), field, limit };
  if (cursor) params.cursor = cursor;

  const { data } = await axios.get(`${BASE}/clientes/search`, {
    headers,
    params,
  });
  // data: { items: Cliente[], nextCursor: string|null }
  return data;
}

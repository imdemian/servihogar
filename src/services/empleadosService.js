// src/services/empleadosService.js
import axios from "axios";
import { getIdTokenForUser } from "./authService";

// Leemos la nueva variable que acabamos de definir en .env.local:
const FORCE_DEV = import.meta.env.VITE_FORCE_DEV === "true";

// Si FORCE_DEV es false, omitimos el emulador aunque estemos en modo DEV de Vite:
const USE_EMULATOR = import.meta.env.DEV && FORCE_DEV;

// Base URL de tus Functions: emulador en DEV, Cloud en prod
// Construimos la URL base:
const BASE = USE_EMULATOR
  ? import.meta.env.VITE_FUNCTIONS_EMULATOR_URL
  : `https://us-central1-${
      import.meta.env.VITE_FIREBASE_PROJECT_ID
    }.cloudfunctions.net/api`;

async function authHeaders() {
  const token = await getIdTokenForUser();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function registrarEmpleado(data) {
  const headers = await authHeaders();
  const res = await axios.post(`${BASE}/empleados`, data, { headers });
  return res.data;
}

export async function obtenerEmpleados() {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/empleados`, { headers });
  return res.data;
}

export async function obtenerEmpleado(id) {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/empleados/${id}`, { headers });
  return res.data;
}

export async function actualizarEmpleado(id, data) {
  const headers = await authHeaders();
  const res = await axios.put(`${BASE}/empleados/${id}`, data, { headers });
  return res.data;
}

export async function actualizarOrdenesAsignadas(id, ordenesAsignadas) {
  const headers = await authHeaders();
  const res = await axios.patch(
    `${BASE}/empleados/${id}/ordenes-asignadas`,
    { ordenesAsignadas },
    { headers }
  );
  return res.data;
}

export async function eliminarEmpleado(id) {
  const headers = await authHeaders();
  const response = await axios.delete(`${BASE}/empleados/${id}`, { headers });
  return response;
}

// src/services/clientesService.js
import axios from "axios";
import { getIdTokenForUser } from "./authService"; // o donde hayas puesto tu auth.js

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

/**
 * Construye los headers con el token de Firebase Auth si hay usuario.
 */
async function authHeaders() {
  const token = await getIdTokenForUser();
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

// Crear cliente
export async function registrarCliente(data) {
  const headers = await authHeaders();
  const res = await axios.post(`${BASE}/clientes`, data, { headers });
  return res.data;
}

// Obtener todos los clientes
export async function obtenerClientes() {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/clientes`, { headers });
  return res.data;
}

// Obtener un cliente por ID
export async function obtenerCliente(id) {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/clientes/${id}`, { headers });
  return res.data;
}

// Actualizar cliente
export async function actualizarCliente(id, data) {
  const headers = await authHeaders();
  const res = await axios.put(`${BASE}/clientes/${id}`, data, { headers });
  return res.data;
}

// Eliminar cliente
export async function eliminarCliente(id) {
  const headers = await authHeaders();
  const res = await axios.delete(`${BASE}/clientes/${id}`, { headers });
  return res;
}

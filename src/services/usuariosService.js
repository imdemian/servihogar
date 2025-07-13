// src/services/usuariosService.js
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

/**
 * Crea el perfil de usuario en Firestore usando tu Function.
 * @param {{ email, password, nombre, rol, empleadoId }} data
 */

export async function crearUsuario(data) {
  const headers = await authHeaders();
  const res = await axios.post(`${BASE}/usuarios`, data, { headers });
  return res.data;
}

export async function obtenerUsuario(uid) {
  const headers = await authHeaders();
  const res = await axios.get(`${BASE}/usuarios/${uid}`, { headers });
  return res.data;
}

// Otros endpoints CRUD de usuario:
export async function obtenerUsuarios() {
  const { data } = await axios.get(`${BASE}/usuarios`);
  return data;
}

export async function registrarUsuario(u) {
  const { data } = await axios.post(`${BASE}/usuarios`, u);
  return data;
}

export async function actualizarUsuario(id, u) {
  const { data } = await axios.put(`${BASE}/usuarios/${id}`, u);
  return data;
}

export async function eliminarUsuario(id) {
  const { data } = await axios.delete(`${BASE}/usuarios/${id}`);
  return data;
}

export async function changePassword(id, payload) {
  const { data } = await axios.put(
    `${BASE}/usuarios/${id}/password-change`,
    payload
  );
  return data;
}

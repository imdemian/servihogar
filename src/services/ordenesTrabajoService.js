import axios from "axios";
import { getIdTokenForUser } from "./authService";

// Base URL de tus Functions: emulador en DEV, Cloud en prod
const BASE = import.meta.env.DEV
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

/**
 * Obtener todas las órdenes de trabajo
 * @returns {Promise<Array>} lista de órdenes
 */
export async function obtenerOrdenesTrabajo() {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE}/ordenesTrabajo`, { headers });
  return data;
}

/**
 * Obtener una orden de trabajo por ID
 * @param {string} id
 * @returns {Promise<Object>} orden de trabajo
 */
export async function obtenerOrdenTrabajo(id) {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE}/ordenesTrabajo/${id}`, { headers });
  return data;
}

/**
 * Registrar una nueva orden de trabajo
 * @param {Object} payload datos de la orden
 * @returns {Promise<Object>} orden creada
 */
export async function registrarOrdenTrabajo(payload) {
  const headers = await authHeaders();
  const { data } = await axios.post(`${BASE}/ordenesTrabajo`, payload, {
    headers,
  });
  return data;
}

/**
 * Actualizar una orden de trabajo existente
 * @param {string} id
 * @param {Object} payload datos actualizados
 * @returns {Promise<Object>} orden actualizada
 */
export async function actualizarOrdenTrabajo(id, payload) {
  const headers = await authHeaders();
  const { data } = await axios.put(`${BASE}/ordenesTrabajo/${id}`, payload, {
    headers,
  });
  return data;
}

/**
 * Eliminar una orden de trabajo
 * @param {string} id
 * @returns {Promise<Object>} resultado de la operación
 */
export async function eliminarOrdenTrabajo(id) {
  const headers = await authHeaders();
  const { data } = await axios.delete(`${BASE}/ordenesTrabajo/${id}`, {
    headers,
  });
  return data;
}

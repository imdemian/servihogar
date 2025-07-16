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
 * Obtener todas las cotizaciones
 * @returns {Promise<Array>} lista de cotizaciones
 */
export async function obtenerCotizaciones() {
  const headers = await authHeaders();
  const response = await axios.get(`${BASE}/cotizaciones`, {
    headers,
  });
  return response;
}

/**
 * Obtener cotizaciones pendientes (estado "pendiente")
 * @returns {Promise<Array>} lista de cotizaciones con estado pendiente
 */
export async function obtenerCotizacionesPendientes() {
  const headers = await authHeaders();
  // Llamamos al mismo endpoint y filtramos en frontend
  const { data } = await axios.get(`${BASE}/cotizaciones`, { headers });
  return data.filter((cotizacion) => cotizacion.status === "PENDIENTE");
}

/**
 * Obtener una cotización por ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function obtenerCotizacion(id) {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE}/cotizaciones/${id}`, {
    headers,
  });
  return data;
}

/**
 * Registrar una nueva cotización
 * @param {Object} payload datos de la cotización
 * @returns {Promise<Object>} cotización creada
 */
export async function registrarCotizacion(payload) {
  const headers = await authHeaders();
  const { data } = await axios.post(`${BASE}/cotizaciones`, payload, {
    headers,
  });
  return data;
}

/**
 * Actualizar una cotización existente
 * @param {string} id
 * @param {Object} payload datos actualizados
 * @returns {Promise<Object>} cotización actualizada
 */
export async function actualizarCotizacion(id, payload) {
  const headers = await authHeaders();
  const response = await axios.put(`${BASE}/cotizaciones/${id}`, payload, {
    headers,
  });
  return response;
}

/**
 * Eliminar una cotización
 * @param {string} id
 * @returns {Promise<Object>} resultado de la operación
 */
export async function eliminarCotizacion(id) {
  const headers = await authHeaders();
  const { data } = await axios.delete(`${BASE}/cotizaciones/${id}`, {
    headers,
  });
  return data;
}

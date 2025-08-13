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
 * Obtener órdenes de trabajo paginadas (por fecha de creación)
 * @param {Object} opts
 * @param {number} [opts.limit=20] - Límite por página
 * @param {string|null} [opts.cursorSort] - Fecha ISO del último elemento
 * @param {string|null} [opts.cursorId]   - ID del último elemento
 * @returns {Promise<{ ordenes: any[], pageSize: number, hasMore: boolean, nextCursor: {cursorSort: string, cursorId: string} | null }>}
 */
export async function obtenerOrdenesTrabajo(opts = {}) {
  const { limit = 5, cursorSort, cursorId } = opts;

  const headers = await authHeaders();
  const params = new URLSearchParams();

  if (limit) params.append("limit", limit);
  if (cursorSort) params.append("cursorSort", cursorSort);
  if (cursorId) params.append("cursorId", cursorId);

  const { data } = await axios.get(
    `${BASE}/ordenesTrabajo?${params.toString()}`,
    { headers }
  );
  return data;
}

/**
 * Obtener órdenes de trabajo pendientes
 * @return {Promise<Array>} lista de órdenes pendientes
 */
export async function obtenerOrdenesTrabajoPendientes() {
  const headers = await authHeaders();
  // Llamamos al mismo endpoint y filtramos en frontend
  const { data } = await axios.get(`${BASE}/ordenesTrabajo`, { headers });
  return data.filter(
    (orden) => orden.status !== "PAGADO" && orden.status !== "REVISADA"
  );
}

/**
 * Obtener órdenes de trabajo en garantía
 * @return {Promise<Array>} lista de órdenes en garantía
 */
export async function obtenerOrdenesTrabajoGarantia() {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE}/ordenesTrabajo/garantia`, {
    headers,
  });
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

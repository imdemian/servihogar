import axios from "axios";
import { getIdTokenForUser } from "./authService";

// Leemos la nueva variable que acabamos de definir en .env.local:
const FORCE_DEV = import.meta.env.VITE_FORCE_DEV === "true";

// Si FORCE_DEV es false, omitimos el emulador aunque estemos en modo DEV de Vite:
const USE_EMULATOR = import.meta.env.DEV && FORCE_DEV;

// Base URL de tus Functions: emulador en DEV, Cloud en prod
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
 * Obtener órdenes de trabajo paginadas (por updatedAt desc)
 * @param {Object} opts
 * @param {number} [opts.limit=20]
 * @param {string|null} [opts.cursorSort] - Fecha ISO del último elemento (updatedAt)
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
 * Obtener órdenes de trabajo pendientes (status != PAGADO), con paginación
 * @param {Object} opts
 * @param {number} [opts.limit=20]
 * @param {string|null} [opts.cursorStatus] - status del último elemento
 * @param {string|null} [opts.cursorSort]   - ISO de updatedAt del último elemento
 * @param {string|null} [opts.cursorId]     - id del último elemento
 * @returns {Promise<{ ordenes: any[], pageSize: number, hasMore: boolean, nextCursor: {cursorStatus: string, cursorSort: string, cursorId: string} | null }>}
 */
export async function obtenerOrdenesTrabajoPendientes(opts = {}) {
  const { limit = 20, cursorStatus, cursorSort, cursorId } = opts;

  const headers = await authHeaders();
  const params = new URLSearchParams();

  if (limit) params.append("limit", limit);
  if (cursorStatus) params.append("cursorStatus", cursorStatus);
  if (cursorSort) params.append("cursorSort", cursorSort);
  if (cursorId) params.append("cursorId", cursorId);

  const { data } = await axios.get(
    `${BASE}/ordenesTrabajo/pendientes?${params.toString()}`,
    { headers }
  );

  // data => { ordenes, pageSize, hasMore, nextCursor }
  return data;
}

/**
 * Obtener órdenes de trabajo en garantía
 * @return {Promise<{ ordenes: any[], total: number }>} respuesta cruda del backend
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
 */
export async function obtenerOrdenTrabajo(id) {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE}/ordenesTrabajo/${id}`, { headers });
  return data;
}

/**
 * Registrar una nueva orden de trabajo
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
 */
export async function eliminarOrdenTrabajo(id) {
  const headers = await authHeaders();
  const { data } = await axios.delete(`${BASE}/ordenesTrabajo/${id}`, {
    headers,
  });
  return data;
}

/** Verifica si un folio ya existe en la colección */
export async function existeFolio(folio) {
  const headers = await authHeaders();
  const { data } = await axios.get(
    `${BASE}/ordenesTrabajo/existsFolio/${folio}`,
    { headers }
  );
  return !!data?.exists;
}

/**
 * Buscar órdenes de trabajo por folio, nombre de cliente, teléfono, dirección o status
 * (paginado con cursor, mismo shape que obtenerOrdenesTrabajo)
 */
export async function buscarOrdenesTrabajo({
  q,
  limit = 20,
  cursorSort,
  cursorId,
}) {
  const headers = await authHeaders();
  const params = new URLSearchParams();

  if (q) params.append("q", q);
  if (limit) params.append("limit", limit);
  if (cursorSort) params.append("cursorSort", cursorSort);
  if (cursorId) params.append("cursorId", cursorId);

  const { data } = await axios.get(
    `${BASE}/ordenesTrabajo/search?${params.toString()}`,
    { headers }
  );
  return data; // -> { ordenes, hasMore, nextCursor }
}

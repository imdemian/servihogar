// utils/folioUtils.js
import { obtenerOrdenesTrabajo } from "../services/ordenesTrabajoService";

/**
 * Genera un folio aleatorio alfanumérico de longitud dada.
 */
export function generateFolio(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let folio = "";
  for (let i = 0; i < length; i++) {
    folio += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return folio;
}

/**
 * Genera un folio que no exista todavía en las órdenes.
 */
export async function generateUniqueFolio(length = 8) {
  // 1) Trae todas las órdenes y extrae sus folios
  const ordenes = await obtenerOrdenesTrabajo();
  const existentes = new Set(ordenes.map((o) => o.folio));
  // 2) Reintenta hasta obtener uno no usado
  let folio;
  do {
    folio = generateFolio(length);
  } while (existentes.has(folio));
  return folio;
}

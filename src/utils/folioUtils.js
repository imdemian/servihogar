// utils/folioUtils.js
import { existeFolio } from "../services/ordenesTrabajoService";

/** Genera un folio aleatorio (ajusta a tu formato actual) */
export function generateFolio(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Genera un folio que no exista todavía.
 * Evita cargar todas las órdenes; pregunta al backend si existe.
 */
export async function generateUniqueFolio(length = 8, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    const folio = generateFolio(length);
    const exists = await existeFolio(folio);
    if (!exists) return folio;
  }
  throw new Error(
    "No se pudo generar un folio único después de varios intentos."
  );
}

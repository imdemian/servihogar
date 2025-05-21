// helpers.js
export function generarEquipoId({ tipo, marca, modelo, numeroSerie }) {
  const clean = (str) => (str || "").trim().substring(0, 3).toUpperCase();
  const prefTipo = clean(tipo); // e.g. "LAV"
  const prefMarca = clean(marca); // e.g. "SAM"
  const modeloClean = (modelo || "").replace(/\s+/g, "_");
  const seriePart = numeroSerie ? `_${numeroSerie}` : "";
  return `${prefTipo}${prefMarca}_${modeloClean}${seriePart}`;
}

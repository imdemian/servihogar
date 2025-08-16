// functions/routes/clientesRouter.js
import express from "express";
import { db } from "../admin.js";

const router = express.Router();
const collection = db.collection("clientes");

/* =============== Utils locales (normalizar / ngrams) =============== */
const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ") // colapsa espacios
    .trim();

const makeNgrams = (s, n = 3) => {
  const out = [];
  const txt = `  ${s}  `; // padding para captar inicios/finales
  for (let i = 0; i <= txt.length - n; i++) out.push(txt.slice(i, i + n));
  return Array.from(new Set(out)); // de-dup
};

const buildNombreCompleto = (n, ap, am) =>
  [n || "", ap || "", am || ""].join(" ").replace(/\s+/g, " ").trim();

/* =========================
  CREAR CLIENTE (POST)
   ========================= */
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      email,
      direccion,
      equipos,
      preferenciasContacto,
      notas,
      estado,
    } = req.body;

    // Validaciones básicas
    if (!nombre || !apellidoPaterno || !telefono) {
      return res.status(400).json({
        success: false,
        message: "El nombre, apellido paterno y teléfono son necesarios",
      });
    }

    // Verificar duplicados de teléfono (en POST NO hay que excluir nada)
    const telSnap = await collection.where("telefono", "==", telefono).get();
    if (!telSnap.empty) {
      return res.status(400).json({
        success: false,
        message: "El teléfono ya está registrado",
      });
    }

    // Verificar duplicados de email si viene
    if (email) {
      const emailSnap = await collection.where("email", "==", email).get();
      if (!emailSnap.empty) {
        return res.status(400).json({
          success: false,
          message: "El correo electrónico ya está registrado",
        });
      }
    }

    // Índices de búsqueda
    const nombreCompleto = buildNombreCompleto(
      nombre,
      apellidoPaterno,
      apellidoMaterno
    );
    const searchIndex = normalize(`${nombreCompleto} ${direccion || ""}`);
    const ngrams3 = makeNgrams(searchIndex, 3);

    const now = new Date();
    const data = {
      nombre,
      apellidoPaterno,
      apellidoMaterno: apellidoMaterno || "",
      telefono,
      email: email || "",
      direccion: direccion || "",
      equipos: equipos || [],
      preferenciasContacto: preferenciasContacto || [],
      notas: notas || "",
      estado: estado || "activo",
      createdAt: now,
      updatedAt: now,

      // Campos duplicados normalizados
      nombreLower: normalize(nombre || ""),
      apellidoPaternoLower: normalize(apellidoPaterno || ""),
      apellidoMaternoLower: normalize(apellidoMaterno || ""),
      direccionLower: normalize(direccion || ""),
      nombreCompletoLower: normalize(nombreCompleto),
      searchIndex,
      ngrams3,
    };

    const docRef = await collection.add(data);
    const docSnap = await docRef.get();

    return res.status(201).json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error("Error registrando cliente:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar el cliente",
      error: error.message,
    });
  }
});

/* =========================
  LISTAR clientes con paginación por cursor
   ========================= */
router.get("/", async (req, res) => {
  try {
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit, 10) || 20, 50)
    );
    const cursorId = req.query.cursor || null;

    let query = collection.orderBy("createdAt", "desc").limit(limit);

    if (cursorId) {
      const cursorSnap = await collection.doc(cursorId).get();
      if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }

    const snap = await query.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor =
      items.length === limit ? snap.docs[snap.docs.length - 1].id : null;

    return res.status(200).json({ items, nextCursor });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los clientes",
      error: error.message,
    });
  }
});

/* =========================
  BUSCAR (contiene en nombre/apellidos/dirección)
  - q: string (obligatorio)
  - limit: int (1-50, default 20)
  - cursor: (opcional) -> aquí devolvemos null (no cursor real en contains)
   ========================= */
router.get("/search", async (req, res) => {
  try {
    const rawQ = (req.query.q || "").trim();
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit, 10) || 20, 50)
    );
    if (!rawQ) {
      return res
        .status(400)
        .json({ success: false, message: "Falta el parámetro q" });
    }

    const qNorm = normalize(rawQ);

    // A) q >= 3 → ngrams (superset) + filtro en servidor
    if (qNorm.length >= 3) {
      const grams = makeNgrams(qNorm, 3).slice(0, 10); // hasta 10 por rendimiento
      const snap = await collection
        .where("ngrams3", "array-contains-any", grams) // hasta 30 valores permitidos
        .limit(200) // superset; luego filtramos
        .get();

      const filtered = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((doc) => (doc.searchIndex || "").includes(qNorm))
        .slice(0, limit);

      return res.status(200).json({ items: filtered, nextCursor: null });
    }

    // B) q < 3 → fallback: prefijo en varios campos + filtro por contiene
    const fields = [
      "nombreLower",
      "apellidoPaternoLower",
      "apellidoMaternoLower",
      "direccionLower",
    ];
    const queries = await Promise.all(
      fields.map((f) =>
        collection
          .orderBy(f)
          .startAt(qNorm)
          .endAt(qNorm + "\uf8ff")
          .limit(50)
          .get()
      )
    );

    const map = new Map();
    for (const s of queries) {
      s.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
    }

    const items = Array.from(map.values())
      .filter((doc) => (doc.searchIndex || "").includes(qNorm))
      .slice(0, limit);

    return res.status(200).json({ items, nextCursor: null });
  } catch (error) {
    console.error("Error en búsqueda (contains):", error);
    return res.status(500).json({
      success: false,
      message: "Error en la búsqueda de clientes",
      error: error.message,
    });
  }
});

/* =========================
  OBTENER POR ID
   ========================= */
router.get("/:id", async (req, res) => {
  try {
    const docSnap = await collection.doc(req.params.id).get();
    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }
    return res.status(200).json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el cliente",
      error: error.message,
    });
  }
});

/* =========================
  ACTUALIZAR cliente (PUT)
   ========================= */
router.put("/:id", async (req, res) => {
  try {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      email,
      direccion,
      equipos,
      preferenciasContacto,
      notas,
      estado,
    } = req.body;

    // Validaciones
    if (!nombre || !apellidoPaterno || !telefono) {
      return res.status(400).json({
        success: false,
        message: "El nombre, apellido paterno y teléfono son necesarios",
      });
    }

    const docRef = collection.doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Duplicados (excluyendo este documento)
    const telSnap = await collection.where("telefono", "==", telefono).get();
    if (!telSnap.empty && telSnap.docs.some((d) => d.id !== req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "El teléfono ya está registrado",
      });
    }
    if (email) {
      const emailSnap = await collection.where("email", "==", email).get();
      if (
        !emailSnap.empty &&
        emailSnap.docs.some((d) => d.id !== req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message: "El correo electrónico ya está registrado",
        });
      }
    }

    // Índices de búsqueda
    const nombreCompleto = buildNombreCompleto(
      nombre,
      apellidoPaterno,
      apellidoMaterno
    );
    const searchIndex = normalize(`${nombreCompleto} ${direccion || ""}`);
    const ngrams3 = makeNgrams(searchIndex, 3);

    // Actualizar datos
    const updatedData = {
      nombre,
      apellidoPaterno,
      apellidoMaterno: apellidoMaterno || "",
      telefono,
      email: email || "",
      direccion: direccion || "",
      equipos: equipos || [],
      preferenciasContacto: preferenciasContacto || [],
      notas: notas || "",
      estado: estado || "activo",
      updatedAt: new Date(),

      // Campos duplicados normalizados
      nombreLower: normalize(nombre || ""),
      apellidoPaternoLower: normalize(apellidoPaterno || ""),
      apellidoMaternoLower: normalize(apellidoMaterno || ""),
      direccionLower: normalize(direccion || ""),
      nombreCompletoLower: normalize(nombreCompleto),
      searchIndex,
      ngrams3,
    };

    await docRef.update(updatedData);
    const updatedSnap = await docRef.get();

    return res.status(200).json({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el cliente",
      error: error.message,
    });
  }
});

/* =========================
  ELIMINAR cliente
   ========================= */
router.delete("/:id", async (req, res) => {
  try {
    const docRef = collection.doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }
    await docRef.delete();
    return res.status(200).json({
      success: true,
      message: "Cliente eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el cliente",
      error: error.message,
    });
  }
});

export default router;

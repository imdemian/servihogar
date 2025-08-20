import express from "express";
import admin from "firebase-admin";
import { db } from "../admin.js";

const router = express.Router();
const ordenesCol = db.collection("ordenesTrabajo");

/**
 * Crear una nueva orden de trabajo
 * POST /ordenesTrabajo
 */
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    // Timestamps automáticos
    data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    data.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const docRef = await ordenesCol.add(data);
    const newDoc = await docRef.get();

    return res.status(201).json({ id: docRef.id, ...newDoc.data() });
  } catch (error) {
    console.error("Error creando orden de trabajo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Listar todas las órdenes de trabajo (paginado por updatedAt desc, id desc)
 * GET /ordenesTrabajo
 * Query: limit, cursorSort (ISO), cursorId
 */
router.get("/", async (req, res) => {
  try {
    const { limit: limitStr, cursorSort, cursorId } = req.query;
    const limit = Math.min(parseInt(limitStr || "20", 10), 100);

    let q = ordenesCol
      .orderBy("updatedAt", "desc")
      .orderBy(admin.firestore.FieldPath.documentId(), "desc");

    if (cursorSort && cursorId) {
      const csTs = admin.firestore.Timestamp.fromDate(new Date(cursorSort));
      q = q.startAfter(csTs, cursorId);
    }

    const snap = await q.limit(limit).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const last = snap.docs[snap.docs.length - 1] || null;
    const nextCursor = last
      ? {
          cursorSort:
            last.get("updatedAt")?.toDate?.().toISOString?.() ||
            new Date().toISOString(),
          cursorId: last.id,
        }
      : null;

    return res.json({
      ordenes: docs,
      pageSize: docs.length,
      hasMore: docs.length === limit,
      nextCursor,
    });
  } catch (error) {
    console.error("Error listando órdenes de trabajo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Listar órdenes que están en garantía (campo garantia === true).
 * GET /ordenesTrabajo/garantia
 */
router.get("/garantia", async (_req, res) => {
  try {
    const snap = await ordenesCol
      .where("garantia", "==", true)
      .orderBy("updatedAt", "desc")
      .get();

    const toDateSafe = (v) => {
      if (!v) return null;
      if (typeof v?.toDate === "function") return v.toDate();
      if (v instanceof Date) return v;
      if (typeof v === "string") {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      if (typeof v === "object" && "seconds" in v) {
        return new Date(v.seconds * 1000);
      }
      return null;
    };

    let skipped = 0;
    const ordenes = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((o) => {
        const d = toDateSafe(o.fechaEntrega);
        if (!d) {
          skipped++;
          return false;
        }
        return true;
      });

    ordenes.sort((a, b) => {
      const da = toDateSafe(a.fechaEntrega) || new Date(0);
      const db = toDateSafe(b.fechaEntrega) || new Date(0);
      return db - da;
    });

    return res.json({
      ordenes,
      total: ordenes.length,
      skipsPorFechaEntregaInvalida: skipped,
      criteria: {
        garantia: true,
        order: "fechaEntrega desc (Firestore)",
      },
    });
  } catch (error) {
    console.error("Error listando órdenes en garantía:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Obtener órdenes de trabajo pendientes (STATUS != "PAGADO"), con paginación
 * GET /ordenesTrabajo/pendientes
 * Query: limit, cursorStatus, cursorSort (ISO updatedAt), cursorId
 *
 * 🔴 Requiere índice compuesto:
 *   status (ASC), updatedAt (DESC), __name__ (DESC)
 */
router.get("/pendientes", async (req, res) => {
  try {
    const { limit: limitStr, cursorStatus, cursorSort, cursorId } = req.query;
    const limit = Math.min(parseInt(limitStr || "20", 10), 100);

    let q = ordenesCol
      .where("status", "!=", "PAGADO")
      .orderBy("status") // obligatorio con "!="
      .orderBy("updatedAt", "desc")
      .orderBy(admin.firestore.FieldPath.documentId(), "desc");

    if (cursorStatus && cursorSort && cursorId) {
      const csTs = admin.firestore.Timestamp.fromDate(new Date(cursorSort));
      q = q.startAfter(cursorStatus, csTs, cursorId);
    }

    const snap = await q.limit(limit).get();

    const ordenes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const last = snap.docs[snap.docs.length - 1] || null;
    const nextCursor = last
      ? {
          cursorStatus: last.get("status"),
          cursorSort:
            last.get("updatedAt")?.toDate?.().toISOString?.() ||
            new Date().toISOString(),
          cursorId: last.id,
        }
      : null;

    return res.json({
      ordenes,
      pageSize: ordenes.length,
      hasMore: ordenes.length === limit,
      nextCursor,
      criteria: { statusNe: "PAGADO", order: "status asc, updatedAt desc" },
    });
  } catch (error) {
    console.error("Error listando órdenes pendientes:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Buscar órdenes de trabajo (folio, cliente, teléfono, dirección, status)
 * GET /ordenesTrabajo/search?q=...&limit=20&cursorSort=...&cursorId=...
 */
router.get("/search", async (req, res) => {
  try {
    const { q, limit: limitStr, cursorSort, cursorId } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Se requiere parámetro q" });
    }

    const limit = Math.min(parseInt(limitStr || "20", 10), 100);

    const term = q
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let query = ordenesCol
      .orderBy("updatedAt", "desc")
      .orderBy(admin.firestore.FieldPath.documentId(), "desc");

    if (cursorSort && cursorId) {
      const csTs = admin.firestore.Timestamp.fromDate(new Date(cursorSort));
      query = query.startAfter(csTs, cursorId);
    }

    const snap = await query.limit(limit * 5).get();

    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const normalize = (s) =>
      (s ?? "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const digitsOnly = (s) => (s ?? "").toString().replace(/\D+/g, "");

    const filtered = docs.filter((o) => {
      const folio = normalize(o.folio);
      const status = normalize(o.status);

      const nombreCompleto = normalize(
        [
          o?.cliente?.nombre,
          o?.cliente?.apellidoPaterno,
          o?.cliente?.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const telefonos = Array.isArray(o?.cliente?.telefonos)
        ? o.cliente.telefonos.map(digitsOnly).join(" ")
        : digitsOnly(o?.cliente?.telefono);

      const dirObj = o?.cliente?.direccion;
      const direccion = Array.isArray(dirObj)
        ? normalize(dirObj.join(" "))
        : typeof dirObj === "object" && dirObj !== null
        ? normalize(Object.values(dirObj).filter(Boolean).join(" "))
        : normalize(dirObj);

      const termDigits = digitsOnly(term);

      const haystack = [
        folio,
        status,
        nombreCompleto,
        direccion,
        telefonos,
      ].join(" ");
      return (
        haystack.includes(term) ||
        (termDigits && telefonos.includes(termDigits))
      );
    });

    const slice = filtered.slice(0, limit);

    const last = slice[slice.length - 1] || null;
    const nextCursor = last
      ? {
          cursorSort:
            last.updatedAt?.toDate?.().toISOString?.() ||
            new Date().toISOString(),
          cursorId: last.id,
        }
      : null;

    return res.json({
      ordenes: slice,
      pageSize: slice.length,
      hasMore: filtered.length > slice.length,
      nextCursor,
    });
  } catch (error) {
    console.error("Error buscando órdenes de trabajo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Verificar si existe una orden con un folio dado
 * GET /ordenesTrabajo/existsFolio/:folio
 * Respuesta: { exists: boolean }
 */
router.get("/existsFolio/:folio", async (req, res) => {
  try {
    const { folio } = req.params;
    if (!folio) {
      return res
        .status(400)
        .json({ success: false, message: "Folio requerido" });
    }
    const snap = await ordenesCol.where("folio", "==", folio).limit(1).get();
    return res.json({ exists: !snap.empty });
  } catch (error) {
    console.error("Error verificando folio:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Obtener una orden de trabajo por ID
 * GET /ordenesTrabajo/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const docRef = ordenesCol.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Orden de trabajo no encontrada" });
    }

    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error obteniendo orden de trabajo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Actualizar una orden de trabajo
 * PUT /ordenesTrabajo/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const docRef = ordenesCol.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Orden de trabajo no encontrada" });
    }

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error("Error actualizando orden de trabajo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Eliminar una orden de trabajo
 * DELETE /ordenesTrabajo/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const docRef = ordenesCol.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Orden de trabajo no encontrada" });
    }

    await docRef.delete();
    return res.json({ success: true, message: "Orden de trabajo eliminada" });
  } catch (error) {
    console.error("Error eliminando orden de trabajo:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

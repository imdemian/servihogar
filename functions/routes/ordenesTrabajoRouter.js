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
 * Listar todas las órdenes de trabajo
 * GET /ordenesTrabajo
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
    // Consulta simple: solo trae las que tienen garantia === true
    const snap = await ordenesCol
      .where("garantia", "==", true)
      .orderBy("updatedAt", "desc") // opcional, para consistencia
      .get();

    // Helper robusto para convertir fechas
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

    // Reforzar orden si quieres
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

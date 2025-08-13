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
 * Listar las ordenes de trabajo que aún tienen garantía
 * GET /ordenesTrabajo/garantia
 */
router.get("/garantia", async (req, res) => {
  try {
    const snapshot = await ordenesCol
      .where("status", "==", "GARANTIA")
      .orderBy("fechaEntrega", "desc")
      .get();
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(list);
  } catch (error) {
    console.error("Error listando órdenes de trabajo en garantía:", error);
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

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
router.get("/", async (_req, res) => {
  try {
    const snapshot = await ordenesCol.orderBy("createdAt", "desc").get();
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(list);
  } catch (error) {
    console.error("Error listando órdenes de trabajo:", error);
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

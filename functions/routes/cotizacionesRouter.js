import express from "express";
import admin from "firebase-admin";
import { db } from "../admin.js";

const router = express.Router();
const cotizacionesCol = db.collection("cotizaciones");

/**
 * Crear una nueva cotización
 * POST /cotizaciones
 */
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    // Agregar timestamps
    data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    data.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const docRef = await cotizacionesCol.add(data);
    const newDoc = await docRef.get();

    return res.status(201).json({ id: docRef.id, ...newDoc.data() });
  } catch (error) {
    console.error("Error creando cotización:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Listar todas las cotizaciones
 * GET /cotizaciones
 */
router.get("/", async (_req, res) => {
  try {
    const snapshot = await cotizacionesCol.orderBy("createdAt", "desc").get();
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(list);
  } catch (error) {
    console.error("Error listando cotizaciones:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Obtener una cotización por ID
 * GET /cotizaciones/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const docRef = cotizacionesCol.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Cotización no encontrada" });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error obteniendo cotización:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Actualizar una cotización
 * PUT /cotizaciones/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const docRef = cotizacionesCol.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Cotización no encontrada" });
    }

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error("Error actualizando cotización:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Eliminar una cotización
 * DELETE /cotizaciones/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const docRef = cotizacionesCol.doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Cotización no encontrada" });
    }

    await docRef.delete();
    return res.json({ success: true, message: "Cotización eliminada" });
  } catch (error) {
    console.error("Error eliminando cotización:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

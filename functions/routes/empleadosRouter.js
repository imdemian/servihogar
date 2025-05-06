// functions/routes/empleadosRouter.js
import express from "express";
import { db } from "../admin.js";

const router = express.Router();
const collection = db.collection("empleados");

// Crear un nuevo empleado
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno = "",
      telefono,
      direccion = "",
      fechaContratacion = new Date(),
      ordenesAsignadas = [],
      estado = "activo",
    } = req.body;

    if (!nombre || !apellidoPaterno || !telefono) {
      return res.status(400).json({
        success: false,
        message: "El nombre, apellido paterno y teléfono son obligatorios",
      });
    }

    // Verificar duplicado por teléfono
    const dup = await collection.where("telefono", "==", telefono).get();
    if (!dup.empty) {
      return res.status(400).json({
        success: false,
        message: "El teléfono ya está registrado",
      });
    }

    const now = new Date();
    const data = {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      direccion,
      fechaContratacion: new Date(fechaContratacion),
      ordenesAsignadas,
      estado,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await collection.add(data);
    const snap = await docRef.get();
    return res.status(201).json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error("Error registrando empleado:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar el empleado",
      error: error.message,
    });
  }
});

// Listar todos los empleados
router.get("/", async (_req, res) => {
  try {
    const snap = await collection.get();
    const empleados = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(empleados);
  } catch (error) {
    console.error("Error obteniendo empleados:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener la lista de empleados",
      error: error.message,
    });
  }
});

// Obtener un empleado por ID
router.get("/:id", async (req, res) => {
  try {
    const snap = await collection.doc(req.params.id).get();
    if (!snap.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Empleado no encontrado" });
    }
    return res.status(200).json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error("Error obteniendo empleado:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el empleado",
      error: error.message,
    });
  }
});

// Actualizar un empleado por ID
router.put("/:id", async (req, res) => {
  try {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno = "",
      telefono,
      direccion = "",
      ordenesAsignadas = [],
      estado = true,
    } = req.body;

    if (!nombre || !apellidoPaterno || !telefono) {
      return res.status(400).json({
        success: false,
        message: "El nombre, apellido paterno y teléfono son obligatorios",
      });
    }

    const docRef = collection.doc(req.params.id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Empleado no encontrado" });
    }

    // Verificar duplicado de teléfono excluyendo este documento
    const dup = await collection.where("telefono", "==", telefono).get();
    if (!dup.empty && dup.docs.some((d) => d.id !== req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "El teléfono ya está registrado",
      });
    }

    const updatedData = {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      direccion,
      ordenesAsignadas,
      estado,
      updatedAt: new Date(),
    };

    await docRef.update(updatedData);
    const updatedSnap = await docRef.get();
    return res.status(200).json({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error) {
    console.error("Error actualizando empleado:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el empleado",
      error: error.message,
    });
  }
});

// Actualizar solo las órdenes asignadas
router.patch("/:id/ordenes-asignadas", async (req, res) => {
  try {
    const { ordenesAsignadas } = req.body;
    if (!Array.isArray(ordenesAsignadas)) {
      return res.status(400).json({
        success: false,
        message: "El campo 'ordenesAsignadas' debe ser un array",
      });
    }

    const docRef = collection.doc(req.params.id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Empleado no encontrado" });
    }

    await docRef.update({ ordenesAsignadas, updatedAt: new Date() });
    const updatedSnap = await docRef.get();
    return res.status(200).json({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error) {
    console.error("Error actualizando órdenes asignadas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar las órdenes asignadas",
      error: error.message,
    });
  }
});

// Eliminar un empleado por ID
router.delete("/:id", async (req, res) => {
  try {
    const docRef = collection.doc(req.params.id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Empleado no encontrado" });
    }
    await docRef.delete();
    return res
      .status(200)
      .json({ success: true, message: "Empleado eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando empleado:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el empleado",
      error: error.message,
    });
  }
});

export default router;

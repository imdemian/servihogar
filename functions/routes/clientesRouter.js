// functions/routes/clientesRouter.js
import express from "express";
import { db } from "../admin.js";

const router = express.Router();
const collection = db.collection("clientes");

// Crear nuevo cliente
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

    // Verificar duplicados de teléfono
    const telSnap = await collection.where("telefono", "==", telefono).get();
    if (!telSnap.empty && telSnap.docs.some((d) => d.id !== req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "El teléfono ya está registrado",
      });
    }

    // Verificar duplicados de email si viene
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

    // Crear documento
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

// Listar todos los clientes
router.get("/", async (_req, res) => {
  try {
    const snap = await collection.get();
    const clientes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json(clientes);
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los clientes",
      error: error.message,
    });
  }
});

// Obtener un cliente por ID
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

// Actualizar cliente por ID
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

    // Verificar duplicados (teléfono y email) excluyendo este documento
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

// Eliminar cliente por ID
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

// functions/routes/usuariosRouter.js
import express from "express";
import admin, { db } from "../admin.js";

const router = express.Router();
const usuariosCol = db.collection("usuarios");

/**
 * Registrar un usuario (ya lo tenías)
 * POST /usuarios
 */
router.post("/", async (req, res) => {
  try {
    const { uid, email, nombre, empleadoId, rol } = req.body;

    // Crear el perfil en Firestore
    await usuariosCol.doc(uid).set({
      email,
      nombre,
      empleadoId: empleadoId || null,
      estado: "activo",
      rol,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return res
      .status(201)
      .json({ success: true, message: "Usuario creado", uid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Listar todos los usuarios
 * GET /usuarios
 */
router.get("/", async (_req, res) => {
  try {
    const snap = await usuariosCol.get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(list);
  } catch (error) {
    console.error("Error listando usuarios:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Obtener un usuario por ID
 * GET /usuarios/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const doc = await usuariosCol.doc(req.params.id).get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Actualizar los datos de un usuario
 * PUT /usuarios/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    // No permitimos password ni claims aquí
    delete updates.password;
    delete updates.rol; // si quieres impedir cambio de rol por aquí

    const ref = usuariosCol.doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    await ref.update(updates);
    const updated = await ref.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Eliminar un usuario
 * DELETE /usuarios/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    // 1) Borra del Auth
    await admin.auth().deleteUser(req.params.id);
    // 2) Borra del Firestore
    await usuariosCol.doc(req.params.id).delete();
    return res.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Cambiar contraseña de un usuario
 * PUT /usuarios/:id/password-change
 */
router.put("/:id/password-change", async (req, res) => {
  try {
    const { nuevaPassword } = req.body;
    if (!nuevaPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Falta nuevaPassword" });
    }
    await admin.auth().updateUser(req.params.id, { password: nuevaPassword });
    // Opcional: actualizar updatedAt en Firestore
    await usuariosCol.doc(req.params.id).update({ updatedAt: new Date() });
    return res.json({ success: true, message: "Contraseña actualizada" });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

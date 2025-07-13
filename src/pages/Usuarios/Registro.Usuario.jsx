// src/pages/RegisterTest/RegisterTest.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { register } from "../../services/authService";
import {
  crearUsuario,
  actualizarUsuario,
  changePassword,
} from "../../services/usuariosService";

export default function RegistroUsuarios({ usuario, setShow }) {
  const isEdit = !!usuario;

  const [form, setForm] = useState({
    email: usuario?.email || "",
    password: "",
    nombre: usuario?.nombre || "",
    rol: usuario?.rol || "USER",
    empleadoId: usuario?.empleadoId || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        //  EDITAR USUARIO

        // 1. Actualizar documento en Firestore
        await actualizarUsuario(usuario.id, {
          email: form.email,
          nombre: form.nombre,
          rol: form.rol,
          empleadoId: form.empleadoId || undefined,
        });

        // 2. Si se ingresó nueva contraseña, actualizarla
        if (form.password) {
          await changePassword(usuario.id, { nuevaPassword: form.password });
        }

        toast.success("Usuario actualizado correctamente");
      } else {
        // CREAR USUARIO

        // 1.  Crear en Auth
        const cred = await register({
          email: form.email,
          password: form.password,
        });

        // 2. Crear documento en Firestore
        await crearUsuario({
          uid: cred.user.uid,
          email: form.email,
          nombre: form.nombre,
          rol: form.rol,
          empleadoId: form.empleadoId || undefined,
        });

        toast.success("Usuario registrado correctamente");
      }

      setShow(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="mb-3 text-center">
        {isEdit ? "Editar" : "Registrar"} Usuario
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="form-control"
            disabled={isEdit} // Generalmente no se cambia email por frontend
          />
        </div>
        <div className="mb-2">
          <input
            type="password"
            name="password"
            placeholder={isEdit ? "Nueva contraseña (opcional)" : "Password"}
            value={form.password}
            onChange={handleChange}
            className="form-control"
            required={!isEdit}
          />
        </div>
        <div className="mb-2">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>
        <div className="mb-2">
          <input
            type="text"
            name="empleadoId"
            placeholder="ID Empleado (opcional)"
            value={form.empleadoId}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <select
            name="rol"
            value={form.rol}
            onChange={handleChange}
            className="form-select"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="TECNICO">Técnico</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              {isEdit ? "Actualizando…" : "Registrando…"}
            </>
          ) : isEdit ? (
            "Actualizar"
          ) : (
            "Registrar"
          )}
        </button>
      </form>
    </div>
  );
}

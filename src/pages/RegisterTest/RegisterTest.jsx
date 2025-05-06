// src/pages/RegisterTest/RegisterTest.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { register } from "../../services/authService";
import { crearUsuario } from "../../services/usuariosService";

const BASE = import.meta.env.DEV
  ? import.meta.env.VITE_FUNCTIONS_EMULATOR_URL
  : `https://us-central1-${
      import.meta.env.VITE_FIREBASE_PROJECT_ID
    }.cloudfunctions.net/api`;

export default function RegisterTest() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    rol: "USER",
    empleadoId: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1) Registro en Auth
      const cred = await register({
        email: form.email,
        password: form.password,
      });

      // 2) Conseguir el UID del usuario registrado
      const uid = cred.user.uid;

      // 3) Creo el perfil en Firestore con el mismo UID
      await crearUsuario({
        uid,
        email: form.email,
        password: form.password, // tu endpoint lo necesita
        nombre: form.nombre,
        rol: form.rol,
        empleadoId: form.empleadoId || undefined,
      });

      toast.success("Usuario registrado correctamente");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ width: 360 }}>
        <h3 className="mb-3 text-center">Registro de Prueba</h3>
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
            />
          </div>
          <div className="mb-2">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="form-control"
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
                Registrando…
              </>
            ) : (
              "Registrar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

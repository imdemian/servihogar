// src/pages/LogIn/LogIn.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logoServiHogar.png";
import "./LogIn.scss";
import { toast } from "react-toastify";

import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { obtenerUsuario } from "../../services/usuariosService";

const LogIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.warning("Por favor, completa todos los campos.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1) Autentica con Firebase Auth
      const cred = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2) Con el uid, obtén el perfil de Firestore (contiene el rol)
      const perfil = await obtenerUsuario(cred.user.uid);
      const role = perfil?.rol || "";
      console.log("Rol obtenido del perfil:", role);

      // 3) Opcional: guardar role en algún contexto o global store
      //    Ejemplo: setUserRole(role) si usas un hook o contexto aquí

      toast.success("Inicio de sesión exitoso");
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg =
        err.code === "auth/wrong-password"
          ? "Contraseña incorrecta."
          : err.code === "auth/user-not-found"
          ? "Usuario no encontrado."
          : err.response?.data?.message || "Error al iniciar sesión.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="card p-4" style={{ maxWidth: 400, width: "100%" }}>
        <div className="card-body">
          <div className="logo mb-3">
            <img src={logo} alt="Logo ServiHogar e Industrial" />
          </div>
          <h2 className="card-title text-center mb-4">Iniciar Sesión</h2>
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-control"
              />
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
                  Cargando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogIn;

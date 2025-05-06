// src/components/EliminarUsuario.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
// Asegúrate de que la función eliminarUsuario esté definida en tu servicio
import { eliminarUsuario } from "../../services/functions/usuarios/usuarios.functions";

const EliminarUsuario = ({ usuario, onCancel, onDeleteSuccess }) => {
  // Inicializamos los datos del usuario que se mostrarán (campos deshabilitados)
  const [formData, setFormData] = useState({
    usuario: usuario?.usuario || "",
    nombre: usuario?.nombre || "",
    email: usuario?.email || "",
    rol: usuario?.rol || "",
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Actualizamos formData si la prop 'usuario' cambia (modo edición)
  useEffect(() => {
    if (usuario) {
      setFormData({
        usuario: usuario.usuario || "",
        nombre: usuario.nombre || "",
        email: usuario.email || "",
        rol: usuario.rol || "",
      });
    }
  }, [usuario]);

  // Manejar el envío (confirmación de eliminación)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const response = await eliminarUsuario(usuario._id);
      if (response.data && response.data.success) {
        toast.success("Usuario eliminado con éxito");
        if (onDeleteSuccess) onDeleteSuccess();
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Error al eliminar el usuario. Inténtalo de nuevo.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eliminar-usuario-container">
      <h2 className="text-center mb-4">Eliminar Usuario</h2>
      <p className="text-center">
        ¿Estás seguro que deseas eliminar al usuario{" "}
        <strong>{formData.nombre}</strong>?
      </p>
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="usuario" className="form-label">
            Usuario
          </label>
          <input
            type="text"
            name="usuario"
            id="usuario"
            value={formData.usuario}
            disabled
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="nombre" className="form-label">
            Nombre
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            value={formData.nombre}
            disabled
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            disabled
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="rol" className="form-label">
            Rol
          </label>
          <input
            type="text"
            name="rol"
            id="rol"
            value={formData.rol}
            disabled
            className="form-control"
          />
        </div>
        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EliminarUsuario;

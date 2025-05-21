import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
// Asegúrate de tener implementada la función eliminarCliente en tu servicio
import { eliminarCliente } from "../../services/clientesService";

const EliminarCliente = ({ cliente, onCancel }) => {
  // Inicializa los datos del cliente; estos se usarán para mostrar la información (campos deshabilitados)
  const [formData, setFormData] = useState({
    nombre: cliente?.nombre || "",
    apellidoPaterno: cliente?.apellidoPaterno || "",
    apellidoMaterno: cliente?.apellidoMaterno || "",
    telefono: cliente?.telefono || "",
    email: cliente?.email || "",
    direccion: cliente?.direccion || "",
    equipos: cliente?.equipos || [],
    preferenciasContacto: cliente?.preferenciasContacto || [],
    notas: cliente?.notas || "",
    estado: cliente?.estado || "activo",
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  console.log(cliente);
  // Si el prop 'cliente' cambia, actualizamos formData.
  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || "",
        apellidoPaterno: cliente.apellidoPaterno || "",
        apellidoMaterno: cliente.apellidoMaterno || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        direccion: cliente.direccion || "",
        equipos: cliente.equipos || [],
        preferenciasContacto: cliente.preferenciasContacto || [],
        notas: cliente.notas || "",
        estado: cliente.estado || "activo",
      });
    }
  }, [cliente]);

  // Maneja el envío del formulario (confirmación de eliminación)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const response = await eliminarCliente(cliente.id);
      console.log(response);
      if (response.data) {
        toast.success("Cliente eliminado con éxito");
        // Ejecutamos la función
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Error al eliminar el cliente. Inténtalo de nuevo.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      onCancel();
    }
  };

  return (
    <div className="eliminar-cliente-container">
      {/* Mensaje de confirmación */}
      <h2 className="text-center mb-4">Eliminar Cliente</h2>
      <p className="text-center">
        ¿Estás seguro que deseas eliminar al cliente{" "}
        <strong>{formData.nombre}</strong>?
      </p>
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      <form onSubmit={handleSubmit}>
        {/* Campos de información, todos deshabilitados */}
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
        <div className="row">
          <div className="col-md-4 mb-3">
            <label htmlFor="apellidoPaterno" className="form-label">
              Apellido Paterno
            </label>
            <input
              type="text"
              name="apellidoPaterno"
              id="apellidoPaterno"
              value={formData.apellidoPaterno}
              disabled
              className="form-control"
            />
          </div>
          <div className="col-md-4 mb-3">
            <label htmlFor="apellidoMaterno" className="form-label">
              Apellido Materno
            </label>
            <input
              type="text"
              name="apellidoMaterno"
              id="apellidoMaterno"
              value={formData.apellidoMaterno}
              disabled
              className="form-control"
            />
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="telefono" className="form-label">
            Teléfono
          </label>
          <input
            type="text"
            name="telefono"
            id="telefono"
            value={formData.telefono}
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
          <label htmlFor="direccion" className="form-label">
            Dirección
          </label>
          <textarea
            name="direccion"
            id="direccion"
            value={formData.direccion}
            disabled
            className="form-control"
            rows="2"
          ></textarea>
        </div>
        {/* (Opcional) Podrías mostrar información de equipos y otras propiedades si lo consideras relevante */}
        {/* Botones para cancelar o confirmar eliminación */}
        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EliminarCliente;

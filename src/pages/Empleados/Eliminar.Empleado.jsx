// src/components/EliminarEmpleado.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { eliminarEmpleado } from "../../services/empleadosService";
// Asegúrate de que la función eliminarEmpleado esté definida en tu servicio

const EliminarEmpleado = ({ empleado, setShow }) => {
  // Inicializamos los datos del empleado que se mostrarán (campos deshabilitados)
  const [formData, setFormData] = useState({
    nombre: empleado?.nombre || "",
    apellidoPaterno: empleado?.apellidoPaterno || "",
    apellidoMaterno: empleado?.apellidoMaterno || "",
    telefono: empleado?.telefono || "",
    direccion: empleado?.direccion || "",
    fechaContratacion: empleado?.fechaContratacion || "",
    ordenesAsignadas: empleado?.ordenesAsignadas || [],
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Actualiza formData si la prop 'empleado' cambia (modo edición)
  useEffect(() => {
    if (empleado) {
      setFormData({
        nombre: empleado.nombre || "",
        apellidoPaterno: empleado.apellidoPaterno || "",
        apellidoMaterno: empleado.apellidoMaterno || "",
        telefono: empleado.telefono || "",
        direccion: empleado.direccion || "",
        fechaContratacion: empleado.fechaContratacion || "",
        ordenesAsignadas: empleado.ordenesAsignadas || [],
      });
    }
  }, [empleado]);

  // Manejar el envío del formulario (confirmar eliminación)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const response = await eliminarEmpleado(empleado.id);
      console.log(response);
      if (response.data.success) {
        toast.success("Empleado eliminado con éxito");
        setShow(false); // Cierra el modal o componente
      }
    } catch (error) {
      console.log(error);
      const msg =
        error.response?.data?.message ||
        "Error al eliminar el empleado. Inténtalo de nuevo.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eliminar-empleado-container">
      <h2 className="text-center mb-4">Eliminar Empleado</h2>
      <p className="text-center">
        ¿Estás seguro que deseas eliminar al empleado{" "}
        <strong>
          {formData.nombre} {formData.apellidoPaterno}
        </strong>
        ?
      </p>
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      <form onSubmit={handleSubmit}>
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
          <div className="col-md-6 mb-3">
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
          <div className="col-md-6 mb-3">
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
          <label htmlFor="direccion" className="form-label">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            id="direccion"
            value={formData.direccion}
            disabled
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="fechaContratacion" className="form-label">
            Fecha de Contratación
          </label>
          <input
            type="date"
            name="fechaContratacion"
            id="fechaContratacion"
            value={formData.fechaContratacion}
            disabled
            className="form-control"
          />
        </div>
        <div className="d-flex justify-content-center">
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar Empleado"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EliminarEmpleado;

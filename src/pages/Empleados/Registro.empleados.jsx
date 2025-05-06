import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
// Estas funciones deben estar definidas en tu servicio de empleados
import {
  registrarEmpleado,
  actualizarEmpleado,
} from "../../services/empleadosService";

const RegistroEmpleados = ({
  empleado,
  setRefreshCheckLogin,
  setShowModal,
}) => {
  // Inicializa formData usando los datos del empleado en modo edición (si existe), o valores vacíos para registro.
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

  // Actualiza el formData si llega un empleado (modo edición)
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

  // Manejo de cambios en cada input del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Maneja el envío del formulario (registro o edición)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      let response;
      if (empleado) {
        // Modo edición: Actualizar el empleado. Se asume que el empleado tiene una propiedad _id.
        response = await actualizarEmpleado(empleado._id, formData);
      } else {
        // Modo registro: Crear un nuevo empleado.
        response = await registrarEmpleado(formData);
      }

      if (response.data && response.data.success) {
        // Mostrar mensaje de éxito según el modo
        toast.success(
          empleado
            ? "Empleado actualizado con éxito"
            : "Empleado registrado con éxito"
        );
        if (setRefreshCheckLogin) setRefreshCheckLogin(true);
        // Reiniciar el formulario solo en modo registro; en edición podrías querer mantener los datos.
        if (!empleado) {
          setFormData({
            nombre: "",
            apellidoPaterno: "",
            apellidoMaterno: "",
            telefono: "",
            direccion: "",
            fechaContratacion: "",
            ordenesAsignadas: [],
          });
        }
      }
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Error al registrar/actualizar el empleado.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setShowModal(false); // Cerrar el modal después de registrar/editar
    }
  };

  return (
    <div className="registro-empleados-container">
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label htmlFor="nombre" className="form-label">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              placeholder="Ingresa el nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="col-md-4 mb-3">
            <label htmlFor="apellidoPaterno" className="form-label">
              Apellido Paterno
            </label>
            <input
              type="text"
              name="apellidoPaterno"
              id="apellidoPaterno"
              placeholder="Ingresa el apellido paterno"
              value={formData.apellidoPaterno}
              onChange={handleChange}
              required
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
              placeholder="Ingresa el apellido materno"
              value={formData.apellidoMaterno}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="telefono" className="form-label">
              Teléfono
            </label>
            <input
              type="text"
              name="telefono"
              id="telefono"
              placeholder="Ingresa el teléfono"
              value={formData.telefono}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="direccion" className="form-label">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              id="direccion"
              placeholder="Ingresa la dirección"
              value={formData.direccion}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="fechaContratacion" className="form-label">
            Fecha de Contratación
          </label>
          <input
            type="date"
            name="fechaContratacion"
            id="fechaContratacion"
            placeholder="Ingresa la fecha de contratación"
            value={formData.fechaContratacion}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        {/* Ejemplo: si ordenesAsignadas es un array, podrías manejarlo con un input o un selector múltiple */}
        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {empleado ? "Actualizando..." : "Registrando..."}
            </>
          ) : empleado ? (
            "Actualizar Empleado"
          ) : (
            "Registrar Empleado"
          )}
        </button>
      </form>
    </div>
  );
};

export default RegistroEmpleados;

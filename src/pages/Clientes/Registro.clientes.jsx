import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  actualizarCliente,
  registrarCliente,
} from "../../services/clientesService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { generarEquipoId } from "./helpers";

const RegistroClientes = ({ cliente, setShowModal }) => {
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

  // Si recibimos un cliente para editar, precargamos el formData
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEquipoChange = (index, e) => {
    const updated = [...formData.equipos];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    setFormData({ ...formData, equipos: updated });
  };

  const addEquipo = () => {
    setFormData({
      ...formData,
      equipos: [
        ...formData.equipos,
        { tipo: "", marca: "", modelo: "", numeroSerie: "" },
      ],
    });
  };

  const removeEquipo = (index) => {
    setFormData({
      ...formData,
      equipos: formData.equipos.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      let clientId = cliente?.id;
      // 1) Creamos cliente si es nuevo
      if (!cliente) {
        const res = await registrarCliente({
          nombre: formData.nombre,
          apellidoPaterno: formData.apellidoPaterno,
          apellidoMaterno: formData.apellidoMaterno,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          preferenciasContacto: formData.preferenciasContacto,
          notas: formData.notas,
          estado: formData.estado,
          equipos: [], // sin equipos inicialmente
        });
        clientId = res.id || res._id;
      }

      const equiposConId = formData.equipos.map((eq) => ({
        ...eq,
        id: generarEquipoId(eq),
      }));

      // 2) Registramos/actualizamos equipos en perfil
      const payload = {
        ...formData,
        equipos: equiposConId,
      };
      await actualizarCliente(clientId, payload);

      toast.success(
        cliente
          ? "Cliente actualizado correctamente"
          : "Cliente registrado correctamente"
      );
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Error al procesar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-clientes-container">
      <h2 className="text-center mb-4">
        {cliente ? "Editar Cliente" : "Registrar Cliente"}
      </h2>
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      <form onSubmit={handleSubmit}>
        {/* Datos básicos */}
        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">Nombre</label>
            <input
              name="nombre"
              className="form-control"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Apellido Paterno</label>
            <input
              name="apellidoPaterno"
              className="form-control"
              value={formData.apellidoPaterno}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Apellido Materno</label>
            <input
              name="apellidoMaterno"
              className="form-control"
              value={formData.apellidoMaterno}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Teléfono</label>
            <input
              name="telefono"
              className="form-control"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Dirección</label>
          <textarea
            name="direccion"
            className="form-control"
            rows={2}
            value={formData.direccion}
            onChange={handleChange}
          />
        </div>

        {/* Equipos */}
        <div className="mb-3">
          <h5>Equipos</h5>
          {formData.equipos.map((eq, idx) => (
            <div
              key={idx}
              className="border p-3 mb-2 d-flex align-items-end gap-2"
            >
              <div className="flex-fill">
                <label className="form-label">Tipo</label>
                <input
                  name="tipo"
                  className="form-control"
                  value={eq.tipo}
                  onChange={(e) => handleEquipoChange(idx, e)}
                />
              </div>
              <div className="flex-fill">
                <label className="form-label">Marca</label>
                <input
                  name="marca"
                  className="form-control"
                  value={eq.marca}
                  onChange={(e) => handleEquipoChange(idx, e)}
                />
              </div>
              <div className="flex-fill">
                <label className="form-label">Modelo</label>
                <input
                  name="modelo"
                  className="form-control"
                  value={eq.modelo}
                  onChange={(e) => handleEquipoChange(idx, e)}
                />
              </div>
              <div className="flex-fill">
                <label className="form-label">No. Serie</label>
                <input
                  name="numeroSerie"
                  className="form-control"
                  value={eq.numeroSerie}
                  onChange={(e) => handleEquipoChange(idx, e)}
                />
              </div>
              <button
                type="button"
                className="btn btn-outline-danger align-self-start"
                onClick={() => removeEquipo(idx)}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={addEquipo}
          >
            <FontAwesomeIcon icon={faCirclePlus} /> Agregar Equipo
          </button>
        </div>

        {/* Notas y preferencias */}
        <div className="mb-3">
          <label className="form-label">Notas</label>
          <textarea
            name="notas"
            className="form-control"
            rows={3}
            value={formData.notas}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={loading}
        >
          {loading
            ? cliente
              ? "Guardando…"
              : "Registrando…"
            : cliente
            ? "Actualizar Cliente"
            : "Registrar Cliente"}
        </button>
      </form>
    </div>
  );
};

export default RegistroClientes;

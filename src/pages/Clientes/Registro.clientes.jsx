import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  actualizarCliente,
  registrarCliente,
} from "../../services/clientesService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { uploadFiles } from "../../services/storageService";
// import { subirMultiples } from "../../services/apis/cloudinary/cloudinary";

const RegistroClientes = ({ cliente, setShowModal }) => {
  // Inicializar datos, incluyendo 'equipos' como arreglo
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

  // Si se pasa un 'cliente' para edición, actualiza formData
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

  // Manejar cambios de texto en los campos generales del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para actualizar un campo dentro de un equipo
  const handleEquipoChange = (index, e) => {
    const updated = [...formData.equipos];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    setFormData({ ...formData, equipos: updated });
  };

  // Función para agregar un nuevo equipo (con campos vacíos)
  const addEquipo = () => {
    setFormData({
      ...formData,
      equipos: [
        ...formData.equipos,
        { tipo: "", marca: "", modelo: "", numeroSerie: "" },
      ],
    });
  };

  // Función para eliminar un equipo por índice
  const removeEquipo = (index) => {
    setFormData({
      ...formData,
      equipos: formData.equipos.filter((_, i) => i !== index),
    });
  };
  // Manejar envío del formulario (registro o edición)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1) Si es nuevo cliente, crearlo primero sin equipos
      let clientId = cliente?.id;
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
          equipos: [],
        });
        console.log(res);
        clientId = res.id;
      }

      // 2) Subir fotos de equipos si existen
      const equiposConFotos = await Promise.all(
        formData.equipos.map(async (eq, idx) => {
          if (eq.files && eq.files.length > 0) {
            const urls = await uploadFiles(
              eq.files,
              (file, i) => `clientes/${clientId}/equipos/${idx}/${file.name}`
            );
            return { ...eq, fotos: urls };
          }
          return { ...eq, fotos: eq.fotos || [] };
        })
      );

      // 3) Armar payload final, sin propiedad "files"
      const payload = {
        ...formData,
        equipos: equiposConFotos.map(({ files, ...keep }) => keep),
      };

      // 4) Actualizar cliente (nuevo o existente)
      await actualizarCliente(clientId, payload);
      toast.success(
        cliente
          ? "Cliente actualizado correctamente"
          : "Cliente registrado correctamente"
      );
      setShowModal(false);
    } catch (error) {
      console.error("Error en registro/actualización de cliente:", error);
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
        {/* Campos generales del cliente */}
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
          <div className="col-md-6">
            <div className="mb-3">
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
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Ingresa el email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="preferenciasContacto" className="form-label">
                Preferencias de Contacto
              </label>
              <input
                type="text"
                name="preferenciasContacto"
                id="preferenciasContacto"
                placeholder="Llamadas, WhatsApp, Email"
                value={formData.preferenciasContacto}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="prefernciasContacto" className="form-label">
                Direccion
              </label>
              <textarea
                name="direccion"
                id="direccion"
                placeholder="Agregar direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="form-control"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Sección de Equipos */}
        <div className="mb-3">
          <h5>Equipos</h5>
          {formData.equipos.map((equipo, index) => (
            <div key={index} className="equipo-item border p-2 d-flex flex-row">
              <div className="d-flex flex-column">
                <div className="d-flex flex-row mb-2">
                  <div className="me-2">
                    <label htmlFor={`tipo-${index}`} className="form-label">
                      Tipo
                    </label>
                    <input
                      type="text"
                      id={`tipo-${index}`}
                      name="tipo"
                      placeholder="Tipo de equipo"
                      value={equipo.tipo || ""}
                      onChange={(e) => handleEquipoChange(index, e)}
                      className="form-control"
                    />
                  </div>
                  <div className="me-2">
                    <label htmlFor={`marca-${index}`} className="form-label">
                      Marca
                    </label>
                    <input
                      type="text"
                      id={`marca-${index}`}
                      name="marca"
                      placeholder="Marca"
                      value={equipo.marca || ""}
                      onChange={(e) => handleEquipoChange(index, e)}
                      className="form-control"
                    />
                  </div>
                  <div className="me-2">
                    <label htmlFor={`modelo-${index}`} className="form-label">
                      Modelo
                    </label>
                    <input
                      type="text"
                      id={`modelo-${index}`}
                      name="modelo"
                      placeholder="Modelo"
                      value={equipo.modelo || ""}
                      onChange={(e) => handleEquipoChange(index, e)}
                      className="form-control"
                    />
                  </div>
                  <div className="me-2">
                    <label
                      htmlFor={`numeroSerie-${index}`}
                      className="form-label"
                    >
                      No. Serie
                    </label>
                    <input
                      type="text"
                      id={`numeroSerie-${index}`}
                      name="numeroSerie"
                      placeholder="Número de serie"
                      value={equipo.numeroSerie || ""}
                      onChange={(e) => handleEquipoChange(index, e)}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="me-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control mt-2"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const updatedEquipos = [...formData.equipos];
                        updatedEquipos[index].files = files;
                        setFormData({ ...formData, equipos: updatedEquipos });
                      }
                    }}
                    placeholder="Subir foto del equipo"
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => removeEquipo(index)}
              >
                <FontAwesomeIcon icon={faTrashCan} size="lg" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={addEquipo}
          >
            <FontAwesomeIcon icon={faCirclePlus} /> Agregar Equipo
          </button>
        </div>

        {/* Fin de la sección de Equipos */}

        <div className="mb-3">
          <label htmlFor="notas" className="form-label">
            Notas
          </label>
          <textarea
            name="notas"
            id="notas"
            placeholder="Agregar notas"
            value={formData.notas}
            onChange={handleChange}
            className="form-control"
            rows="3"
          ></textarea>
        </div>
        <button type="submit" className="btn btn-success w-100">
          {cliente ? "Actualizar Cliente" : "Registrar Cliente"}
        </button>
      </form>
    </div>
  );
};

export default RegistroClientes;

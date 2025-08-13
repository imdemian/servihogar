import React, { useEffect, useState, useRef } from "react";
import { obtenerClientes } from "../../services/clientesService";
import { obtenerEmpleados } from "../../services/empleadosService";
import { registrarOrdenTrabajo } from "../../services/ordenesTrabajoService";
import { toast } from "react-toastify";
import { faPlusCircle, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { generateUniqueFolio } from "../../utils/folioUtils";

const RegistroOrdenServicio = ({ setShowModal }) => {
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const [datosOrden, setDatosOrden] = useState({
    folio: "",
    cliente: {
      id: "",
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      direccion: "",
    },
    descripcionFalla: "",
    equipos: [{ descripcion: "", marca: "", modelo: "" }],
    empleados: [],
    servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1, total: 0 }],
    fechaRecepcion: "",
    fechaEntrega: "",
    anticipo: 0,
    total: 0,
    status: "CREADA",
  });

  useEffect(() => {
    (async () => {
      try {
        const [cli, emp] = await Promise.all([
          obtenerClientes(),
          obtenerEmpleados(),
        ]);
        setClientes(cli);
        setEmpleados(emp);
      } catch (err) {
        console.error(err);
      }
    })();

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredClientes(
      clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(term) ||
          (c.telefono || "").includes(term)
      )
    );
  }, [searchTerm, clientes]);

  const selectCliente = (c) => {
    setDatosOrden((prev) => ({
      ...prev,
      cliente: {
        id: c.id,
        nombre: c.nombre,
        apellidoPaterno: c.apellidoPaterno,
        apellidoMaterno: c.apellidoMaterno,
        telefono: c.telefono,
        direccion: c.direccion,
      },
    }));
    setSearchTerm(`${c.nombre} — ${c.telefono}`);
    setShowSuggestions(false);
  };

  const handleEquipoChange = (idx, field, value) => {
    const nuevos = [...datosOrden.equipos];
    nuevos[idx][field] = value;
    setDatosOrden((prev) => ({ ...prev, equipos: nuevos }));
  };

  const handleAddEquipo = () => {
    setDatosOrden((prev) => ({
      ...prev,
      equipos: [...prev.equipos, { descripcion: "", marca: "", modelo: "" }],
    }));
  };

  const handleRemoveEquipo = (idx) => {
    setDatosOrden((prev) => ({
      ...prev,
      equipos: prev.equipos.filter((_, i) => i !== idx),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // 1) Validar equipos
    const equiposValidos = datosOrden.equipos.filter(
      (eq) => eq.descripcion.trim() !== ""
    );
    if (equiposValidos.length === 0) {
      toast.warn("Debes agregar al menos un equipo con descripción válida.");
      return;
    }

    // 2) validar fecha de recepción (obligatoria)
    if (!datosOrden.fechaRecepcion) {
      toast.warn("La fecha de recepción es obligatoria.");
      return;
    }

    // 3) si hay fechaEntrega, que no sea antes que recepción
    if (datosOrden.fechaEntrega) {
      const fr = new Date(datosOrden.fechaRecepcion);
      const fe = new Date(datosOrden.fechaEntrega);
      if (fe < fr) {
        toast.warn(
          "La fecha de entrega no puede ser anterior a la de recepción."
        );
        return;
      }
    }

    try {
      const folio = await generateUniqueFolio(10);
      const payload = {
        ...datosOrden,
        folio,
      };
      await registrarOrdenTrabajo(payload);
      toast.success("Orden registrada correctamente (folio: " + folio + ")");
      setDatosOrden({
        folio: "",
        cliente: {
          id: "",
          nombre: "",
          apellidoPaterno: "",
          apellidoMaterno: "",
          telefono: "",
          direccion: "",
        },
        descripcionFalla: "",
        equipos: [{ descripcion: "", marca: "", modelo: "" }],
        empleados: [],
        servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1, total: 0 }],
        fechaRecepcion: "",
        fechaEntrega: "",
        anticipo: 0,
        total: 0,
        status: "CREADA",
      });
      setSearchTerm("");
      setShowSuggestions(false);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo registrar la orden");
    } finally {
      setShowModal(false);
    }
  };

  return (
    <form
      className="p-4 position-relative"
      onSubmit={onSubmit}
      ref={wrapperRef}
    >
      {/* Cliente */}
      <div className="mb-4 position-relative">
        <label className="form-label">Cliente</label>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && filteredClientes.length > 0 && (
          <ul
            className="list-group position-absolute w-100 mt-1 shadow"
            style={{ maxHeight: "200px", overflowY: "auto", zIndex: 1000 }}
          >
            {filteredClientes.map((c) => (
              <li
                key={c.id}
                className="list-group-item list-group-item-action"
                onClick={() => selectCliente(c)}
              >
                {c.nombre} — {c.telefono}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tabla de equipos */}
      <div className="mb-4">
        <label className="form-label">Equipos</label>
        <table className="table table-bordered">
          <thead className="bg-light">
            <tr>
              <th>Descripción</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosOrden.equipos.map((eq, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={eq.descripcion}
                    onChange={(e) =>
                      handleEquipoChange(idx, "descripcion", e.target.value)
                    }
                    required
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={eq.marca}
                    onChange={(e) =>
                      handleEquipoChange(idx, "marca", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={eq.modelo}
                    onChange={(e) =>
                      handleEquipoChange(idx, "modelo", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveEquipo(idx)}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleAddEquipo}
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Añadir Equipo
        </button>
      </div>

      {/* Falla y fechas */}
      <div className="mb-4">
        <label className="form-label">Descripción de la falla</label>
        <textarea
          className="form-control"
          rows="3"
          value={datosOrden.descripcionFalla}
          onChange={(e) =>
            setDatosOrden((prev) => ({
              ...prev,
              descripcionFalla: e.target.value,
            }))
          }
        ></textarea>
      </div>
      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Fecha Recepción</label>
          <input
            type="date"
            className="form-control"
            value={datosOrden.fechaRecepcion}
            onChange={(e) =>
              setDatosOrden((prev) => ({
                ...prev,
                fechaRecepcion: e.target.value,
              }))
            }
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Fecha Entrega</label>
          <input
            type="date"
            className="form-control"
            value={datosOrden.fechaEntrega}
            onChange={(e) =>
              setDatosOrden((prev) => ({
                ...prev,
                fechaEntrega: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="text-end">
        <button type="submit" className="btn btn-primary">
          Guardar Orden
        </button>
      </div>
    </form>
  );
};

export default RegistroOrdenServicio;

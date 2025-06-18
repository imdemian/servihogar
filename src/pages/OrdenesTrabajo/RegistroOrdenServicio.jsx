import React, { useEffect, useState, useRef } from "react";
import { obtenerClientes } from "../../services/clientesService";
import { obtenerEmpleados } from "../../services/empleadosService";
import { registrarOrdenTrabajo } from "../../services/ordenesTrabajoService";
import { toast } from "react-toastify";
import { faPlusCircle, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { generateUniqueFolio } from "../../utils/folioUtils";

const RegistroOrdenServicio = ({ setShowModal, setActualizado }) => {
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Inputs para equipos
  const [equipoDescripcion, setEquipoDescripcion] = useState("");
  const [equipoMarca, setEquipoMarca] = useState("");
  const [equipoModelo, setEquipoModelo] = useState("");

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
    equipos: [],
    empleados: [],
    servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1, total: 0 }],
    fechaRecepcion: "",
    fechaEntrega: "",
    anticipo: 0,
    total: 0,
    status: "CREADA",
  });

  // Carga inicial
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

  // Filtrar clientes
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

  // Seleccionar cliente
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

  // Equipos
  const addEquipo = () => {
    const desc = equipoDescripcion.trim();
    if (!desc) return;
    setDatosOrden((prev) => ({
      ...prev,
      equipos: [
        ...prev.equipos,
        {
          descripcion: desc,
          marca: equipoMarca.trim(),
          modelo: equipoModelo.trim(),
        },
      ],
    }));
    setEquipoDescripcion("");
    setEquipoMarca("");
    setEquipoModelo("");
  };
  const removeEquipo = (idx) => {
    setDatosOrden((prev) => ({
      ...prev,
      equipos: prev.equipos.filter((_, i) => i !== idx),
    }));
  };

  // Submit envía fechas formateadas DD-MM-YYYY
  const onSubmit = async (e) => {
    e.preventDefault();
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
        equipos: [],
        empleados: [],
        servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1, total: 0 }],
        fechaRecepcion: "",
        fechaEntrega: "",
        anticipo: 0,
        status: "CREADA",
      });
      setSearchTerm("");
      setShowSuggestions(false);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo registrar la orden");
    } finally {
      setActualizado((prev) => !prev);
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

      {/* Datos cliente */}
      {datosOrden.cliente.id && (
        <div className="row mb-4">
          <div className="col-md-6">
            <label className="form-label">Teléfono</label>
            <input
              readOnly
              className="form-control"
              value={datosOrden.cliente.telefono}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Dirección</label>
            <input
              readOnly
              className="form-control"
              value={datosOrden.cliente.direccion}
            />
          </div>
        </div>
      )}

      {/* Equipos */}
      <div className="mb-4">
        <label className="form-label">Equipos</label>
        <div className="input-group mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Descripción..."
            value={equipoDescripcion}
            onChange={(e) => setEquipoDescripcion(e.target.value)}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Marca..."
            value={equipoMarca}
            onChange={(e) => setEquipoMarca(e.target.value)}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Modelo..."
            value={equipoModelo}
            onChange={(e) => setEquipoModelo(e.target.value)}
          />
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={addEquipo}
          >
            <FontAwesomeIcon icon={faPlusCircle} />
          </button>
        </div>
        {datosOrden.equipos.length > 0 && (
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
                  <td className="px-2 py-1">{eq.descripcion}</td>
                  <td className="px-2 py-1">{eq.marca || "sin datos"}</td>
                  <td className="px-2 py-1">{eq.modelo || "sin datos"}</td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeEquipo(idx)}
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

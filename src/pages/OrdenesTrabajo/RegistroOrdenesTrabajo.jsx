import React, { useEffect, useState } from "react";
import { obtenerClientes } from "../../services/clientesService";
import { obtenerEmpleados } from "../../services/empleadosService";
import logo from "../../assets/logoServiHogar.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

const RegistroOrdenesTrabajo = () => {
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClientes, setFilteredClientes] = useState([]);

  // Guarda solo el ID elegido antes de pulsar "Añadir"
  const [selectedEquipoId, setSelectedEquipoId] = useState("");
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState("");

  const [datosOrden, setDatosOrden] = useState({
    cliente: { id: "", nombre: "", telefono: "", direccion: "" },
    equipos: [],
    empleados: [],
    servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1, total: 0 }],
  });

  // 1) Carga inicial de clientes y empleados
  useEffect(() => {
    (async () => {
      try {
        const [cData, eData] = await Promise.all([
          obtenerClientes(),
          obtenerEmpleados(),
        ]);
        setClientes(cData || []);
        setEmpleados(eData || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // 2) Filtrado de clientes por término de búsqueda
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredClientes(
      clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(term) ||
          (c.telefono || "").includes(term) ||
          (c.direccion || "").toLowerCase().includes(term)
      )
    );
  }, [searchTerm, clientes]);

  // 3) Cuando seleccionas un cliente, rellenas sus datos y equipos disponibles
  const handleClienteSelect = (e) => {
    const cli = clientes.find((c) => c.id === e.target.value);
    if (cli) {
      setDatosOrden((prev) => ({
        ...prev,
        cliente: {
          id: cli.id,
          nombre: cli.nombre,
          telefono: cli.telefono,
          direccion: cli.direccion,
        },
        equipos: [], // limpia selección previa
        empleados: [], // limpia empleados previos
      }));
      setEquiposDisponibles(cli.equipos || []);
    } else {
      setDatosOrden((prev) => ({
        ...prev,
        cliente: { id: "", nombre: "", telefono: "", direccion: "" },
        equipos: [],
        empleados: [],
      }));
      setEquiposDisponibles([]);
    }
    setSelectedEquipoId("");
    setSelectedEmpleadoId("");
  };

  // 4) Sólo actualiza el ID seleccionado (equipo)
  const handleEquipoSelect = (e) => {
    setSelectedEquipoId(e.target.value);
  };

  // 5) Añade el equipo al array al pulsar el botón
  const addEquipo = () => {
    if (!selectedEquipoId) return;
    const sel = equiposDisponibles.find((eq) => eq.id === selectedEquipoId);
    if (!sel) return;
    setDatosOrden((prev) => ({
      ...prev,
      equipos: [
        ...prev.equipos,
        {
          id: sel.id,
          tipo: sel.tipo,
          marca: sel.marca,
          modelo: sel.modelo,
          numeroSerie: sel.numeroSerie,
          observacion: "",
        },
      ],
    }));
    setSelectedEquipoId("");
  };
  const removeEquipo = (idx) =>
    setDatosOrden((prev) => ({
      ...prev,
      equipos: prev.equipos.filter((_, i) => i !== idx),
    }));

  // --- Empleados ---
  // Sólo actualiza el ID seleccionado (empleado)
  const handleEmpleadoSelect = (e) => {
    setSelectedEmpleadoId(e.target.value);
  };

  // Añade el empleado al array al pulsar el botón
  const addEmpleado = () => {
    if (!selectedEmpleadoId) return;
    const sel = empleados.find((emp) => emp.id === selectedEmpleadoId);
    if (!sel) return;
    setDatosOrden((prev) => ({
      ...prev,
      empleados: [
        ...prev.empleados,
        {
          id: sel.id,
          nombre: sel.nombre,
          apellidoPaterno: sel.apellidoPaterno,
          apellidoMaterno: sel.apellidoMaterno,
        },
      ],
    }));
    setSelectedEmpleadoId("");
  };
  const removeEmpleado = (idx) =>
    setDatosOrden((prev) => ({
      ...prev,
      empleados: prev.empleados.filter((_, i) => i !== idx),
    }));

  // --- Servicios ---
  const handleServiceChange = (idx, e) => {
    const { name, value } = e.target;
    setDatosOrden((prev) => {
      const servicios = prev.servicios.map((s, i) => {
        if (i !== idx) return s;
        const updated = {
          ...s,
          [name]:
            name === "cantidad" || name === "precioUnitario"
              ? Number(value)
              : value,
        };
        updated.total = updated.cantidad * updated.precioUnitario;
        return updated;
      });
      return { ...prev, servicios };
    });
  };
  const addService = () =>
    setDatosOrden((prev) => ({
      ...prev,
      servicios: [
        ...prev.servicios,
        { servicio: "", precioUnitario: 0, cantidad: 1, total: 0 },
      ],
    }));
  const removeService = (idx) =>
    setDatosOrden((prev) => ({
      ...prev,
      servicios: prev.servicios.filter((_, i) => i !== idx),
    }));

  const costoTotalOrden = datosOrden.servicios.reduce(
    (sum, s) => sum + s.total,
    0
  );

  return (
    <form
      className="p-4 w-75 mx-auto bg-white shadow-lg rounded"
      onSubmit={(e) => {
        e.preventDefault();
        console.log("Enviar datos:", datosOrden);
      }}
    >
      {/* Encabezado */}
      <div className="d-flex align-items-center mb-4">
        <img src={logo} alt="Logo" width={40} height={40} className="me-3" />
        <h1 className="h3 mb-0">ORDEN DE SERVICIO</h1>
      </div>

      {/* Buscar y seleccionar cliente */}
      <div className="mb-3">
        <label className="form-label">Buscar cliente</label>
        <input
          type="text"
          className="form-control"
          placeholder="Nombre, teléfono o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Seleccione cliente</label>
          <select
            className="form-select"
            value={datosOrden.cliente.id}
            onChange={handleClienteSelect}
          >
            <option value="">-- Seleccione un cliente --</option>
            {filteredClientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.telefono}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Teléfono</label>
          <input
            readOnly
            className="form-control"
            value={datosOrden.cliente.telefono}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Dirección</label>
          <input
            readOnly
            className="form-control"
            value={datosOrden.cliente.direccion}
          />
        </div>
      </div>

      {/* Equipos */}
      <div className="mb-4">
        <label className="form-label">Seleccione equipo</label>
        <select
          className="form-select"
          value={selectedEquipoId}
          onChange={handleEquipoSelect}
        >
          <option value="">-- Elija equipo --</option>
          {equiposDisponibles.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.tipo} — {eq.marca} — {eq.modelo} — S/N: {eq.numeroSerie}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary mt-2"
          onClick={addEquipo}
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Añadir equipo
        </button>
        <ul className="mt-2">
          {datosOrden.equipos.map((eq, i) => (
            <li key={`${eq.id}-${i}`}>
              {eq.tipo} | {eq.marca} | {eq.modelo} | S/N: {eq.numeroSerie}
              <button
                type="button"
                className="btn btn-sm btn-danger ms-2"
                onClick={() => removeEquipo(i)}
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Empleados */}
      <div className="mb-4">
        <label className="form-label">Seleccione empleado</label>
        <select
          className="form-select"
          value={selectedEmpleadoId}
          onChange={handleEmpleadoSelect}
        >
          <option value="">-- Elija empleado --</option>
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary mt-2"
          onClick={addEmpleado}
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Añadir empleado
        </button>
        <ul className="mt-2">
          {datosOrden.empleados.map((em, i) => (
            <li key={`${em.id}-${i}`}>
              {em.nombre} {em.apellidoPaterno} {em.apellidoMaterno}
              <button
                type="button"
                className="btn btn-sm btn-danger ms-2"
                onClick={() => removeEmpleado(i)}
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Servicios */}
      <h5 className="mb-2">Servicios</h5>
      <table className="table table-bordered mb-3">
        <thead className="bg-light">
          <tr>
            <th>Servicio</th>
            <th style={{ width: 120 }}>Precio Unit.</th>
            <th style={{ width: 100 }}>Cantidad</th>
            <th style={{ width: 120 }}>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datosOrden.servicios.map((s, idx) => (
            <tr key={idx}>
              <td>
                <input
                  name="servicio"
                  className="form-control"
                  value={s.servicio}
                  onChange={(e) => handleServiceChange(idx, e)}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="precioUnitario"
                  className="form-control form-control-sm"
                  value={s.precioUnitario}
                  onChange={(e) => handleServiceChange(idx, e)}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="cantidad"
                  className="form-control form-control-sm"
                  value={s.cantidad}
                  onChange={(e) => handleServiceChange(idx, e)}
                />
              </td>
              <td>
                <input
                  readOnly
                  className="form-control form-control-sm"
                  value={s.total.toFixed(2)}
                />
              </td>
              <td className="text-center">
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeService(idx)}
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
        className="btn btn-sm btn-outline-primary mb-4"
        onClick={addService}
      >
        <FontAwesomeIcon icon={faPlusCircle} /> Añadir Servicio
      </button>

      {/* Total */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <strong>Total Orden:</strong>
        <span className="h5">${costoTotalOrden.toFixed(2)}</span>
      </div>

      <div className="text-end">
        <button type="submit" className="btn btn-primary">
          Guardar Orden
        </button>
      </div>
    </form>
  );
};

export default RegistroOrdenesTrabajo;

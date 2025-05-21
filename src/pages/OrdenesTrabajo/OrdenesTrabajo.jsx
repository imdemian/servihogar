import React, { useState, useEffect } from "react";
import { obtenerClientes } from "../../services/clientesService";
import { obtenerEmpleados } from "../../services/empleadosService";
import logo from "../../assets/logoServiHogar.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faTrashCan } from "@fortawesome/free-solid-svg-icons";

const OrdenesTrabajo = () => {
  const [datosOrden, setDatosOrden] = useState({
    numeroOrden: "",
    cliente: "",
    telefono: "",
    direccion: "",
    requiereFactura: false,
    rfc: "",
    formaPago: "",
    metodoPago: "",
    usoCfdi: "",
    fechaCreacion: new Date().toISOString().slice(0, 10),
    fechaIngreso: "",
    fechaFinalizacion: "",
    fechaEntrega: "",
    equipos: [
      {
        equipoId: "",
        marca: "",
        modelo: "",
        numeroSerie: "",
        observacion: "",
      },
    ],
    servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1 }],
    tecnicosAsignados: [],
    firma: "",
  });

  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);

  // 1) Cargo inicial de clientes y técnicos
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
        console.error("Error al cargar listas:", err);
      }
    })();
  }, []);

  // 2) Cuando cambie el cliente, relleno teléfono/dirección y equipos disponibles
  useEffect(() => {
    if (!datosOrden.cliente) return;
    const cli = clientes.find((c) => c.id === datosOrden.cliente) || {};
    setDatosOrden((prev) => ({
      ...prev,
      telefono: cli.telefono || "",
      direccion: cli.direccion || "",
      equipos: [
        {
          equipoId: "",
          marca: "",
          modelo: "",
          numeroSerie: "",
          observacion: "",
        },
      ],
    }));
    setEquiposDisponibles(cli.equipos || []);
  }, [datosOrden.cliente, clientes]);

  // Manejador genérico de inputs simples
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatosOrden((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Manejador para selección múltiple de técnicos
  const handleTecnicosChange = (e) => {
    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
    setDatosOrden((prev) => ({ ...prev, tecnicosAsignados: opts }));
  };

  // Manejador para los equipos: al cambiar equipoId rellena marca/modelo/serie
  const handleEquipmentChange = (index, e) => {
    const { name, value } = e.target;
    setDatosOrden((prev) => {
      const lista = [...prev.equipos];
      if (name === "equipoId") {
        const sel = equiposDisponibles.find((eq) => eq.id === value) || {};
        lista[index] = {
          equipoId: value,
          marca: sel.marca || "",
          modelo: sel.modelo || "",
          numeroSerie: sel.serie || "", // asumimos que tu API usa `serie`
          observacion: lista[index].observacion || "",
        };
      } else {
        lista[index] = { ...lista[index], [name]: value };
      }
      return { ...prev, equipos: lista };
    });
  };

  const agregarEquipo = () =>
    setDatosOrden((prev) => ({
      ...prev,
      equipos: [
        ...prev.equipos,
        {
          equipoId: "",
          marca: "",
          modelo: "",
          numeroSerie: "",
          observacion: "",
        },
      ],
    }));

  const eliminarEquipo = (i) =>
    setDatosOrden((prev) => ({
      ...prev,
      equipos: prev.equipos.filter((_, idx) => idx !== i),
    }));

  // Servicios (igual que antes)
  const handleServiceChange = (i, e) => {
    const { name, value } = e.target;
    setDatosOrden((prev) => {
      const servs = [...prev.servicios];
      servs[i] = {
        ...servs[i],
        [name]: ["precioUnitario", "cantidad"].includes(name)
          ? parseFloat(value)
          : value,
      };
      return { ...prev, servicios: servs };
    });
  };
  const agregarServicio = () =>
    setDatosOrden((prev) => ({
      ...prev,
      servicios: [
        ...prev.servicios,
        { servicio: "", precioUnitario: 0, cantidad: 1 },
      ],
    }));
  const eliminarServicio = (i) =>
    setDatosOrden((prev) => ({
      ...prev,
      servicios: prev.servicios.filter((_, idx) => idx !== i),
    }));

  const costoTotal = datosOrden.servicios.reduce(
    (sum, s) => sum + s.precioUnitario * s.cantidad,
    0
  );

  return (
    <form
      className="p-4 w-75 mx-auto bg-white shadow-lg rounded"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="d-flex align-items-center mb-4">
        <img src={logo} alt="Logo" width={40} height={40} className="me-3" />
        <h1 className="h3 mb-0">ORDEN DE SERVICIO</h1>
      </div>

      {/* === Cliente === */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Cliente</label>
          <select
            name="cliente"
            className="form-select"
            value={datosOrden.cliente || ""}
            onChange={handleChange}
          >
            <option value="">Seleccione cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Teléfono</label>
          <input
            readOnly
            className="form-control"
            value={datosOrden.telefono || ""}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Dirección</label>
          <input
            readOnly
            className="form-control"
            value={datosOrden.direccion || ""}
          />
        </div>
      </div>

      {/* === Equipos === */}
      <h5>Equipos</h5>
      <table className="table table-bordered mb-3">
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>No. Serie</th>
            <th>Observación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datosOrden.equipos.map((eq, idx) => (
            <tr key={`${eq.equipoId}-${idx}`}>
              <td>
                <select
                  name="equipoId"
                  className="form-select"
                  value={eq.equipoId || ""}
                  onChange={(e) => handleEquipmentChange(idx, e)}
                >
                  <option value="">Seleccione equipo</option>
                  {equiposDisponibles.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.tipo}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  readOnly
                  className="form-control"
                  value={eq.marca || ""}
                />
              </td>
              <td>
                <input
                  readOnly
                  className="form-control"
                  value={eq.modelo || ""}
                />
              </td>
              <td>
                <input
                  readOnly
                  className="form-control"
                  value={eq.numeroSerie || ""}
                />
              </td>
              <td>
                <input
                  name="observacion"
                  className="form-control"
                  value={eq.observacion || ""}
                  onChange={(e) => handleEquipmentChange(idx, e)}
                />
              </td>
              <td className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-danger"
                  onClick={() => eliminarEquipo(idx)}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className="btn btn-primary mb-4"
        onClick={agregarEquipo}
      >
        <FontAwesomeIcon icon={faPlusCircle} /> Agregar equipo
      </button>

      {/* === Servicios === */}
      <h5>Servicios</h5>
      <table className="table table-bordered mb-3">
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Precio Unitario</th>
            <th>Cantidad</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datosOrden.servicios.map((s, i) => (
            <tr key={`serv-${i}`}>
              <td>
                <input
                  name="servicio"
                  className="form-control"
                  value={s.servicio || ""}
                  onChange={(e) => handleServiceChange(i, e)}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="precioUnitario"
                  className="form-control"
                  value={s.precioUnitario}
                  onChange={(e) => handleServiceChange(i, e)}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="cantidad"
                  className="form-control"
                  value={s.cantidad}
                  onChange={(e) => handleServiceChange(i, e)}
                />
              </td>
              <td>{(s.precioUnitario * s.cantidad).toFixed(2)}</td>
              <td className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-danger"
                  onClick={() => eliminarServicio(i)}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className="btn btn-primary mb-4"
        onClick={agregarServicio}
      >
        <FontAwesomeIcon icon={faPlusCircle} /> Agregar servicio
      </button>

      {/* === Técnicos asignados === */}
      <div className="mb-4">
        <label className="form-label">Técnicos asignados</label>
        <select
          multiple
          className="form-select"
          value={datosOrden.tecnicosAsignados}
          onChange={handleTecnicosChange}
        >
          {empleados.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.nombre} {emp.apellidoPaterno}
            </option>
          ))}
        </select>
        <small className="text-muted">
          Ctrl/Cmd + click para seleccionar varios
        </small>
      </div>

      {/* === Total y Firma === */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <span className="fw-semibold">Costo Total:</span>
        <span className="h5">{costoTotal.toFixed(2)}</span>
      </div>
      <div className="mb-4">
        <label className="form-label">Firma del Cliente</label>
        <input
          name="firma"
          className="form-control"
          value={datosOrden.firma || ""}
          onChange={handleChange}
        />
      </div>

      <div className="text-end">
        <button type="submit" className="btn btn-primary">
          Guardar Orden
        </button>
      </div>
    </form>
  );
};

export default OrdenesTrabajo;

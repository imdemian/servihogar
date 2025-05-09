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
      { equipoId: "", marca: "", modelo: "", serie: "", observacion: "" },
    ],
    servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1 }],
    tecnico: "",
    estado: "",
    firma: "",
  });

  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);

  // Cargar clientes y empleados
  useEffect(() => {
    const cargarListas = async () => {
      try {
        const listaClientes = await obtenerClientes();
        setClientes(listaClientes || []);
        const listaEmpleados = await obtenerEmpleados();
        setEmpleados(listaEmpleados || []);
      } catch (error) {
        console.error("Error al cargar listas:", error);
      }
    };
    cargarListas();
  }, []);

  // Al cambiar cliente: autocompletar datos y asignar equipos locales
  useEffect(() => {
    if (!datosOrden.cliente) return;
    const seleccionado =
      clientes.find((c) => c.id === datosOrden.cliente) || {};
    setDatosOrden((prev) => ({
      ...prev,
      telefono: seleccionado.telefono || "",
      direccion: seleccionado.direccion || "",
      equipos: [
        { equipoId: "", marca: "", modelo: "", serie: "", observacion: "" },
      ],
    }));
    console.log(seleccionado.equipos);
    setEquiposDisponibles(seleccionado.equipos || []);
  }, [datosOrden.cliente, clientes]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatosOrden((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  console.log(equiposDisponibles);

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
          serie: sel.serie || "",
          observacion: "",
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
        { equipoId: "", marca: "", modelo: "", serie: "", observacion: "" },
      ],
    }));

  const eliminarEquipo = (i) =>
    setDatosOrden((prev) => ({
      ...prev,
      equipos: prev.equipos.filter((_, idx) => idx !== i),
    }));

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    setDatosOrden((prev) => {
      const lista = [...prev.servicios];
      lista[index] = {
        ...lista[index],
        [name]: ["precioUnitario", "cantidad"].includes(name)
          ? parseFloat(value)
          : value,
      };
      return { ...prev, servicios: lista };
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
    (suma, s) => suma + s.precioUnitario * s.cantidad,
    0
  );

  return (
    <form
      className="p-4 w-75 mx-auto bg-white shadow-lg rounded"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="d-flex align-items-center mb-4">
        <img
          src={logo}
          alt="Logo CRM"
          width={40}
          height={40}
          className="me-3"
        />
        <h1 className="h3 mb-0">ORDEN DE SERVICIO</h1>
      </div>

      {/* Facturación y Fechas */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="form-check mb-2">
            <input
              id="requiereFactura"
              name="requiereFactura"
              type="checkbox"
              className="form-check-input border border-2 rounded me-2 check-titulo"
              checked={datosOrden.requiereFactura}
              onChange={handleChange}
            />
            <label
              htmlFor="requiereFactura"
              className="form-check-label h5 mb-0"
            >
              Facturación
            </label>
          </div>
          {datosOrden.requiereFactura && (
            <div className="row g-2 mt-2">
              <div className="col-6">
                <label htmlFor="rfc" className="form-label">
                  RFC
                </label>
                <input
                  id="rfc"
                  name="rfc"
                  value={datosOrden.rfc}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="col-6">
                <label htmlFor="formaPago" className="form-label">
                  Forma de Pago
                </label>
                <input
                  id="formaPago"
                  name="formaPago"
                  value={datosOrden.formaPago}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="col-6">
                <label htmlFor="metodoPago" className="form-label">
                  Método de Pago
                </label>
                <input
                  id="metodoPago"
                  name="metodoPago"
                  value={datosOrden.metodoPago}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="col-6">
                <label htmlFor="usoCfdi" className="form-label">
                  Uso de CFDI
                </label>
                <input
                  id="usoCfdi"
                  name="usoCfdi"
                  value={datosOrden.usoCfdi}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
          )}
        </div>
        <div className="col-md-6">
          <h5>Fechas</h5>
          <div className="row g-2">
            <div className="col-6">
              <label htmlFor="fechaCreacion" className="form-label">
                Creación
              </label>
              <input
                id="fechaCreacion"
                name="fechaCreacion"
                type="date"
                value={datosOrden.fechaCreacion}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-6">
              <label htmlFor="fechaIngreso" className="form-label">
                Ingreso/Inicio
              </label>
              <input
                id="fechaIngreso"
                name="fechaIngreso"
                type="date"
                value={datosOrden.fechaIngreso}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-6">
              <label htmlFor="fechaFinalizacion" className="form-label">
                Finalización
              </label>
              <input
                id="fechaFinalizacion"
                name="fechaFinalizacion"
                type="date"
                value={datosOrden.fechaFinalizacion}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-6">
              <label htmlFor="fechaEntrega" className="form-label">
                Entrega
              </label>
              <input
                id="fechaEntrega"
                name="fechaEntrega"
                type="date"
                value={datosOrden.fechaEntrega}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Datos del Cliente */}
      <h5 className="mb-3">Datos del Cliente</h5>
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label htmlFor="cliente" className="form-label">
            Cliente
          </label>
          <select
            id="cliente"
            name="cliente"
            value={datosOrden.cliente}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label htmlFor="telefono" className="form-label">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            value={datosOrden.telefono}
            readOnly
            className="form-control"
          />
        </div>
        <div className="col-12">
          <label htmlFor="direccion" className="form-label">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            value={datosOrden.direccion}
            readOnly
            className="form-control"
          />
        </div>
      </div>

      {/* Equipos */}
      <h5 className="mb-3">Equipos</h5>
      <div className="mb-4">
        <table className="table table-bordered">
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
              <tr key={idx}>
                <td>
                  <select
                    name="equipoId"
                    value={eq.equipoId}
                    onChange={(e) => handleEquipmentChange(idx, e)}
                    className="form-select"
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
                    name="marca"
                    value={eq.marca}
                    readOnly
                    className="form-control"
                  />
                </td>
                <td>
                  <input
                    name="modelo"
                    value={eq.modelo}
                    readOnly
                    className="form-control"
                  />
                </td>
                <td>
                  <input
                    name="serie"
                    value={eq.serie}
                    readOnly
                    className="form-control"
                  />
                </td>
                <td>
                  <input
                    name="observacion"
                    value={eq.observacion}
                    onChange={(e) => handleEquipmentChange(idx, e)}
                    className="form-control"
                  />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    onClick={() => eliminarEquipo(idx)}
                    className="btn btn-link text-danger"
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
          onClick={agregarEquipo}
          className="btn btn-primary"
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Agregar equipo
        </button>
      </div>

      {/* Servicios */}
      <h5 className="mb-3">Servicios</h5>
      <div className="mb-4">
        <table className="table table-bordered">
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
            {datosOrden.servicios.map((s, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    name="servicio"
                    value={s.servicio}
                    onChange={(e) => handleServiceChange(idx, e)}
                    className="form-control"
                  />
                </td>
                <td>
                  <input
                    name="precioUnitario"
                    type="number"
                    value={s.precioUnitario}
                    onChange={(e) => handleServiceChange(idx, e)}
                    className="form-control"
                  />
                </td>
                <td>
                  <input
                    name="cantidad"
                    type="number"
                    value={s.cantidad}
                    onChange={(e) => handleServiceChange(idx, e)}
                    className="form-control"
                  />
                </td>
                <td>{(s.precioUnitario * s.cantidad).toFixed(2)}</td>
                <td className="text-center">
                  <button
                    type="button"
                    onClick={() => eliminarServicio(idx)}
                    className="btn btn-link text-danger"
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
          onClick={agregarServicio}
          className="btn btn-primary"
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Agregar servicio
        </button>
      </div>

      {/* Total y Firma */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <span className="fw-semibold">Costo Total:</span>
        <span className="h5">{costoTotal.toFixed(2)}</span>
      </div>
      <div className="mb-4">
        <label htmlFor="firma" className="form-label">
          Firma del Cliente
        </label>
        <input
          id="firma"
          name="firma"
          value={datosOrden.firma}
          onChange={handleChange}
          className="form-control"
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

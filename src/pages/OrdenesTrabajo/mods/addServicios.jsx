import React, { useEffect, useState } from "react";
import { actualizarOrdenTrabajo } from "../../../services/ordenesTrabajoService";
import { uploadFiles } from "../../../services/storageService";
import { toast } from "react-toastify";
import { faPlusCircle, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BasicModal from "../../../components/BasicModal/BasicModal";
import { obtenerEmpleados } from "../../../services/empleadosService";

const AddServicios = ({ orden, onClose, onUpdated }) => {
  console.log(orden);

  const [datosOrden, setDatosOrden] = useState({
    cliente: orden.cliente,
    servicios: orden.servicios || [
      { servicio: "", precioUnitario: 0, cantidad: 1, total: 0 },
    ],
    equipos: orden.equipos,
    empleados: orden.empleados,
    fechaRecepcion: orden.fechaRecepcion,
    fechaEntrega: orden.fechaEntrega || "",
    anticipo: orden.anticipo || 0,
    status: orden.status,
    fotos: orden.fotos || [],
  });
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState("");
  const [nuevasFotos, setNuevasFotos] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [entregadoPor, setEntregadoPor] = useState(
    orden.empleados[0]?.id || ""
  );

  useEffect(() => {
    // Cargar empleados si no se pasaron como props
    if (orden.empleados && orden.empleados.length > 0) {
      setEmpleados(orden.empleados);
    } else {
      const fetchEmpleados = async () => {
        try {
          const response = await obtenerEmpleados();
          setEmpleados(response);
        } catch (err) {
          console.error("Error al cargar empleados:", err);
          toast.error("Error al cargar empleados");
        }
      };
      fetchEmpleados();
    }
  }, [orden]);

  console.log(empleados);

  // Manejo de servicios
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

  // Empledos
  const addEmpleado = () => {
    if (!selectedEmpleadoId) return;
    const emp = empleados.find((e) => e.id === selectedEmpleadoId);
    if (!emp) return;
    setDatosOrden((prev) => ({
      ...prev,
      empleados: [...prev.empleados, emp],
    }));
    setSelectedEmpleadoId("");
  };

  // 4. Función para eliminar un empleado por índice
  const removeEmpleado = (idx) => {
    setDatosOrden((prev) => ({
      ...prev,
      empleados: prev.empleados.filter((_, i) => i !== idx),
    }));
  };

  // Fotos
  const handleFileChange = (e) =>
    setNuevasFotos((prev) => [...prev, ...Array.from(e.target.files)]);
  const removeNewFoto = (idx) =>
    setNuevasFotos((prev) => prev.filter((_, i) => i !== idx));

  // Llena campos para revisión
  const handleRevision = () => {
    const hoy = new Date().toISOString().slice(0, 10);
    setDatosOrden((prev) => ({
      ...prev,
      servicios: [
        {
          servicio: "REVISION",
          precioUnitario: 1000,
          cantidad: 1,
          total: 1000,
        },
      ],
      fechaEntrega: hoy,
      status: "REVISADA",
    }));
  };

  // Click en Actualizar Orden
  const handleUpdateClick = async () => {
    if (datosOrden.status === "REVISADA") {
      setShowPayModal(true);
      return;
    }
    // Estado distinto, actualizar a SERVICIO directamente
    try {
      let urls = datosOrden.fotos;
      if (nuevasFotos.length) {
        const uploaded = await uploadFiles(
          nuevasFotos,
          (file, i) => `ordenes/${orden.id}/${Date.now()}_${i}_${file.name}`
        );
        urls = [...urls, ...uploaded];
      }
      const payload = {
        ...datosOrden,
        fotos: urls,
        status: "SERVICIO",
        total: costoTotalOrden,
      };
      await actualizarOrdenTrabajo(orden.id, payload);
      toast.success("Orden actualizada a EN SERVICIO");
      onUpdated && onUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar orden");
    } finally {
      onClose();
    }
  };

  // Confirmar pago en modal
  const handleConfirmPayment = async (method) => {
    try {
      let urls = datosOrden.fotos;
      if (nuevasFotos.length) {
        const uploaded = await uploadFiles(
          nuevasFotos,
          (file, i) => `ordenes/${orden.id}/${Date.now()}_${i}_${file.name}`
        );
        urls = [...urls, ...uploaded];
      }
      const payload = {
        ...datosOrden,
        fotos: urls,
        pago: method,
        status: datosOrden.status === "REVISADA" ? "REVISADA" : "PAGADO",
        total: costoTotalOrden,
      };
      await actualizarOrdenTrabajo(orden.id, payload);
      toast.success(`Orden actualizada y pagada con ${method}`);
      onUpdated && onUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar orden");
    } finally {
      setShowPayModal(false);
      onClose();
    }
  };

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="p-3">
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <h5>Servicios, Fotos y Estado</h5>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRevision}
          >
            Revisión
          </button>
        </div>

        {/* Tabla de servicios */}
        <table className="table table-bordered mb-3">
          <thead className="bg-light">
            <tr>
              <th>Servicio</th>
              <th>Precio</th>
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
                <td>
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
          className="btn btn-outline-primary mb-3"
          onClick={addService}
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Añadir Servicio
        </button>

        {/* Fotos existentes */}
        {datosOrden.fotos.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Fotos guardadas</label>
            <div className="d-flex flex-wrap gap-2">
              {datosOrden.fotos.map((u, i) => (
                <img
                  key={i}
                  src={u}
                  width={80}
                  height={80}
                  className="border"
                />
              ))}
            </div>
          </div>
        )}

        {/* Nuevas fotos */}
        <div className="mb-3">
          <label className="form-label">Agregar Fotos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="form-control mb-2"
            onChange={handleFileChange}
          />
          <div className="d-flex flex-wrap gap-2">
            {nuevasFotos.map((f, i) => (
              <div key={i} className="position-relative">
                <img
                  src={URL.createObjectURL(f)}
                  width={80}
                  height={80}
                  className="border"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0"
                  onClick={() => removeNewFoto(i)}
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Empleados */}
        <div className="mb-3">
          <label className="form-label">Asignar Empleado</label>
          <div className="input-group mb-2">
            <select
              className="form-select"
              value={selectedEmpleadoId}
              onChange={(e) => setSelectedEmpleadoId(e.target.value)}
            >
              <option value="">-- Seleccione empleado --</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={addEmpleado}
            >
              <FontAwesomeIcon icon={faPlusCircle} />
            </button>
          </div>
          {datosOrden.empleados.length > 0 && (
            <ul className="list-group">
              {datosOrden.empleados.map((em, idx) => (
                <li
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {em.nombre} {em.apellidoPaterno} {em.apellidoMaterno}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeEmpleado(idx)}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fechas y anticipo */}
        <div className="row mb-4">
          <div className="col-md-4">
            <label className="form-label">Fecha Recepción</label>
            <input
              readOnly
              type="date"
              className="form-control"
              value={datosOrden.fechaRecepcion}
            />
          </div>
          <div className="col-md-4">
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
          <div className="col-md-4">
            <label className="form-label">Anticipo</label>
            <input
              type="number"
              className="form-control"
              value={datosOrden.anticipo}
              onChange={(e) =>
                setDatosOrden((prev) => ({
                  ...prev,
                  anticipo: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        {/* Botón de Proceder a Pago, sólo si no está en CREADA */}
        {datosOrden.status !== "CREADA" && (
          <div className="mb-3 text-end">
            <button
              type="button"
              className="btn btn-warning me-2"
              onClick={() => setShowPayModal(true)}
            >
              Proceder a Pago
            </button>
          </div>
        )}

        {/* Total y Actualizar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <strong>Total:</strong>
          <span className="h5">${costoTotalOrden.toFixed(2)}</span>
        </div>
        <div className="text-end">
          <button
            type="button"
            className="btn btn-danger me-2"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpdateClick}
          >
            Actualizar Orden
          </button>
        </div>
      </form>

      {/* Modal de pago */}
      <BasicModal
        show={showPayModal}
        setShow={setShowPayModal}
        title="Forma de Pago"
      >
        <div className="mb-3">
          <label className="form-label">Entregado por:</label>
          <select
            className="form-select mb-3"
            value={entregadoPor}
            onChange={(e) => setEntregadoPor(e.target.value)}
          >
            {datosOrden.empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} {emp.apellidoPaterno}
              </option>
            ))}
          </select>
        </div>
        <div className="d-flex justify-content-around">
          <button
            className="btn btn-outline-primary"
            onClick={() => handleConfirmPayment("Transferencia")}
          >
            Transferencia
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => handleConfirmPayment("Efectivo")}
          >
            Efectivo
          </button>
        </div>
      </BasicModal>
    </>
  );
};

export default AddServicios;

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { actualizarOrdenTrabajo } from "../../../services/ordenesTrabajoService";
import { obtenerEmpleados } from "../../../services/empleadosService";

export default function FinalizarOrden({ orden, setShowModal }) {
  const [empleadosEmpresa, setEmpleadosEmpresa] = useState([]);
  const [responsableId, setResponsableId] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(orden.fechaEntrega || "");

  useEffect(() => {
    (async () => {
      try {
        const list = await obtenerEmpleados();
        setEmpleadosEmpresa(list);
      } catch (err) {
        console.error("Error cargando empleados:", err);
        toast.error("No se pudo cargar la lista de empleados");
      }
    })();
  }, []);

  const handleConfirmPayment = async (method) => {
    if (!responsableId) {
      toast.error("Selecciona quién entrega el equipo");
      return;
    }

    if (fechaEntrega) {
      // fecha entrega que sea más reciente que la de recepción
      const fechaRecepcion = new Date(orden.fechaRecepcion);
      const fechaEntregaDate = new Date(fechaEntrega);
      if (fechaEntregaDate < fechaRecepcion) {
        toast.error(
          "La fecha de entrega no puede ser anterior a la de recepción"
        );
        return;
      }
    } else {
      toast.error("Debes seleccionar la fecha de entrega");
      return;
    }

    const responsable = empleadosEmpresa.find((e) => e.id === responsableId);
    if (!responsable) {
      toast.error("Empleado no válido");
      return;
    }

    try {
      const payload = {
        ...orden,
        responsable,
        pago: method,
        fechaEntrega,
        garantia: true,
        status: orden.status === "REVISADA" ? "REVISADA" : "PAGADO",
      };
      await actualizarOrdenTrabajo(orden.id, payload);
      toast.success(`Orden ${payload.status} y pagada con ${method}`);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar la orden");
    }
  };

  return (
    <div>
      {/* Mostrar input fecha solo si no la tiene */}
      {!orden.fechaEntrega && (
        <div className="mb-3">
          <label className="form-label">Fecha de entrega:</label>
          <input
            type="date"
            className="form-control"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
          />
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Entregado por:</label>
        <select
          className="form-select mb-3"
          value={responsableId}
          onChange={(e) => setResponsableId(e.target.value)}
        >
          <option value="">-- Selecciona empleado --</option>
          {empleadosEmpresa.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno || ""}
            </option>
          ))}
        </select>
      </div>

      <div className="d-flex justify-content-around">
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={!responsableId || !fechaEntrega}
          onClick={() => handleConfirmPayment("Transferencia")}
        >
          Transferencia
        </button>
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={!responsableId || !fechaEntrega}
          onClick={() => handleConfirmPayment("Efectivo")}
        >
          Efectivo
        </button>
      </div>
    </div>
  );
}

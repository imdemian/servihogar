import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { actualizarOrdenTrabajo } from "../../../services/ordenesTrabajoService";
import { obtenerEmpleados } from "../../../services/empleadosService";

/**
 * Modal de forma de pago y responsable de entrega.
 *
 * @param {Object} props
 * @param {Object} props.orden            — la orden que vamos a actualizar.
 * @param {() => void} props.onUpdated    — callback tras guardar cambios.
 * @param {(show: boolean) => void} props.setShowModal — para cerrar el modal.
 */
export default function FinalizarOrden({
  orden,
  setShowModal,
  setActualizado,
}) {
  const [empleadosEmpresa, setEmpleadosEmpresa] = useState([]);
  const [responsableId, setResponsableId] = useState("");

  // Cargar todos los empleados al montar
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
        status: orden.status === "REVISADA" ? "REVISADA" : "PAGADO",
      };
      await actualizarOrdenTrabajo(orden.id, payload);
      toast.success(`Orden ${payload.status} y pagada con ${method}`);
      setActualizado(true);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar la orden");
    }
  };

  return (
    <div>
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
          disabled={!responsableId}
          onClick={() => handleConfirmPayment("Transferencia")}
        >
          Transferencia
        </button>
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={!responsableId}
          onClick={() => handleConfirmPayment("Efectivo")}
        >
          Efectivo
        </button>
      </div>
    </div>
  );
}

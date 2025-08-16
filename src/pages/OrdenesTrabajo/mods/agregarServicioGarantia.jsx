// src/pages/OrdenesTrabajo/mods/AgregarServicioGarantia.jsx
import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { actualizarOrdenTrabajo } from "../../../services/ordenesTrabajoService";

export default function AgregarServicioGarantia({ orden, onDone }) {
  const [servicio, setServicio] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const totalLinea = useMemo(
    () => Number(precioUnitario) * Number(cantidad),
    [precioUnitario, cantidad]
  );

  const handleAdd = async () => {
    if (!servicio.trim()) {
      toast.error("Escribe la descripción del servicio.");
      return;
    }
    if (Number(cantidad) <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }
    if (Number(precioUnitario) < 0) {
      toast.error("El precio no puede ser negativo.");
      return;
    }

    try {
      // Armamos el nuevo arreglo de servicios
      const nuevosServicios = [
        ...(orden.servicios || []),
        {
          servicio: servicio.trim(),
          precioUnitario: Number(precioUnitario),
          cantidad: Number(cantidad),
          total: totalLinea,
          origen: "GARANTIA",
          agregadoEn: new Date().toISOString(),
        },
      ];

      // Recalculamos total
      const nuevoTotal = nuevosServicios.reduce(
        (acc, s) => acc + (Number(s.total) || 0),
        0
      );

      // Importante: NO tocamos status ni fechaEntrega
      await actualizarOrdenTrabajo(orden.id, {
        servicios: nuevosServicios,
        total: nuevoTotal,
        garantia: true, // nos aseguramos que sigue marcada
      });

      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo agregar el servicio.");
    }
  };

  return (
    <div className="p-2">
      <div className="mb-3">
        <label className="form-label">Servicio</label>
        <input
          className="form-control"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          placeholder="Descripción del servicio"
        />
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label className="form-label">Precio unitario</label>
          <input
            type="number"
            className="form-control"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(e.target.value)}
            min="0"
          />
        </div>
        <div className="col-6">
          <label className="form-label">Cantidad</label>
          <input
            type="number"
            className="form-control"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            min="1"
          />
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <strong>Total línea:</strong>
        <span className="h6 mb-0">${totalLinea.toFixed(2)}</span>
      </div>

      <div className="text-end">
        <button className="btn btn-primary" onClick={handleAdd}>
          Agregar a la orden
        </button>
      </div>
    </div>
  );
}

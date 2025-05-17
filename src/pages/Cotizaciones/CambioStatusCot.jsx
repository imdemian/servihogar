import React, { useState } from "react";
import PropTypes from "prop-types";
import { actualizarCotizacion } from "../../services/cotizacionService";

export default function CambioStatusCot({ cotizacion, onSaved }) {
  const { nombreCliente, items = [], total, status: inicial } = cotizacion;
  const [status, setStatus] = useState(inicial);

  const handleClick = async (nuevo) => {
    if (nuevo === status) return;
    setStatus(nuevo);

    try {
      const response = await actualizarCotizacion(cotizacion.id, {
        ...cotizacion,
        status: nuevo,
      });
      console.log(response);
      if (response.status === 200) {
        console.log("Estado de la cotización actualizado:", response.data);
      } else {
        console.error(
          "Error al actualizar el estado de la cotización:",
          response
        );
      }
    } catch (error) {
      console.error("Error al cambiar el estado de la cotización:", error);
    } finally {
      onSaved();
    }
  };

  return (
    <div className="p-3">
      <h5>Para: {nombreCliente}</h5>

      <table className="table table-sm mb-3">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>#</th>
            <th style={{ width: "55%" }}>Servicio</th>
            <th style={{ width: "15%" }}>Cant.</th>
            <th style={{ width: "12%" }}>Unit.</th>
            <th style={{ width: "13%" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{it.descripcion}</td>
              <td>{it.cantidad}</td>
              <td>${it.costoUnitario.toFixed(2)}</td>
              <td>${it.costoTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" className="text-end fw-bold">
              Total general:
            </td>
            <td className="fw-bold">${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="d-flex gap-2 justify-content-center">
        <button
          className={`btn btn-outline-danger${
            status === "RECHAZADA" ? " active" : ""
          }`}
          onClick={() => handleClick("RECHAZADA")}
        >
          Rechazada
        </button>
        <button
          className={`btn btn-outline-success${
            status === "APROBADA" ? " active" : ""
          }`}
          onClick={() => handleClick("APROBADA")}
        >
          Aprobada
        </button>
        <button
          className={`btn btn-outline-secondary${
            status === "PENDIENTE" ? " active" : ""
          }`}
          onClick={() => handleClick("PENDIENTE")}
        >
          Pendiente
        </button>
      </div>
    </div>
  );
}

CambioStatusCot.propTypes = {
  cotizacion: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombreCliente: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        descripcion: PropTypes.string,
        cantidad: PropTypes.number,
        costoUnitario: PropTypes.number,
        costoTotal: PropTypes.number,
      })
    ),
    total: PropTypes.number,
    status: PropTypes.oneOf(["RECHAZADA", "APROBADA", "PENDIENTE"]),
  }).isRequired,
  setShowModal: PropTypes.func.isRequired,
};

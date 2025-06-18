import React from "react";
import "../OrdenesTrabajo.scss";

const VerEquiposServicios = ({ folio, servicios = [], equipos = [] }) => {
  return (
    <div className="servicios-equipos-content">
      <h4 className="content-title">Orden: {folio}</h4>

      {/* --- Tabla de Equipos --- */}
      <section className="content-section">
        <h5 className="section-title">Equipos</h5>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Descrip</th>
              <th>Marca</th>
              <th>Modelo</th>
            </tr>
          </thead>
          <tbody>
            {equipos.length > 0 ? (
              equipos.map((eq, idx) => (
                <tr key={`eq-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{eq.descripcion}</td>
                  <td>{eq.marca}</td>
                  <td>{eq.modelo || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="no-items">
                  No hay equipos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {!servicios.length || !servicios[0].servicio ? (
        <div className="no-items">No hay servicios para mostrar.</div>
      ) : (
        <section className="content-section">
          <h5 className="section-title">Servicios</h5>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Serv</th>
                <th>Cant</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((srv, idx) => (
                <tr key={`srv-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{srv.servicio}</td>
                  <td>{srv.cantidad}</td>
                  <td>{srv.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default VerEquiposServicios;

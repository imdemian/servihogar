import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

const DetalleOrdenTrabajo = ({ orden }) => {
  return (
    <div className="p-4">
      <h4 className="mb-3">
        <FontAwesomeIcon icon={faCircleInfo} /> Orden: {orden.folio}
      </h4>

      {/* Cliente */}
      <section className="mb-4">
        <h5>Cliente</h5>
        <p>
          <strong>Nombre:</strong>{" "}
          {`${orden.cliente.nombre} ${orden.cliente.apellidoPaterno} ${orden.cliente.apellidoMaterno}`}
        </p>
        <p>
          <strong>Teléfono:</strong> {orden.cliente.telefono}
        </p>
        <p>
          <strong>Dirección:</strong> {orden.cliente.direccion}
        </p>
      </section>

      {/* Equipos */}
      <section className="mb-4">
        <h5>Equipos</h5>
        {orden.equipos.length > 0 ? (
          <table className="table table-sm table-bordered">
            <thead className="bg-light">
              <tr>
                <th> Descripcion</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Serie</th>
              </tr>
            </thead>
            <tbody>
              {orden.equipos.map((eq, i) => (
                <tr key={i}>
                  <td>{eq.descripcion}</td>
                  <td>{eq.marca}</td>
                  <td>{eq.modelo}</td>
                  <td>{eq.numeroSerie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">No hay equipos asignados.</p>
        )}
      </section>

      {/* Empleados */}
      <section className="mb-4">
        <h5>Empleados</h5>
        {orden.empleados.length > 0 ? (
          <ul className="list-group list-group-flush">
            {orden.empleados.map((em, i) => (
              <li key={i} className="list-group-item px-0">
                {`${em.nombre} ${em.apellidoPaterno} ${em.apellidoMaterno}`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No hay empleados asignados.</p>
        )}
      </section>

      {/* Servicios */}
      <section className="mb-4">
        <h5>Servicios</h5>
        {orden.servicios.length > 0 ? (
          <table className="table table-sm table-bordered">
            <thead className="bg-light">
              <tr>
                <th>Servicio</th>
                <th>Precio Unit.</th>
                <th>Cantidad</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orden.servicios.map((s, i) => (
                <tr key={i}>
                  <td>{s.servicio}</td>
                  <td>${s.precioUnitario.toFixed(2)}</td>
                  <td>{s.cantidad}</td>
                  <td>${s.total.toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="text-end">
                  <strong>Subtotal:</strong>
                </td>
                <td>
                  <strong>
                    $
                    {orden.servicios
                      .reduce((sum, s) => sum + s.total, 0)
                      .toFixed(2)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="text-muted">No hay servicios registrados.</p>
        )}
      </section>

      {/* Fechas / Anticipo / Status */}
      <section className="mb-4">
        <div className="row">
          <div className="col-md-4 mb-2">
            <strong>Recepción:</strong>{" "}
            {new Date(orden.fechaRecepcion).toLocaleDateString()}
          </div>
          <div className="col-md-4 mb-2">
            <strong>Entrega:</strong>{" "}
            {orden.fechaEntrega
              ? new Date(orden.fechaEntrega).toLocaleDateString()
              : "-"}
          </div>
          <div className="col-md-4 mb-2">
            <strong>Anticipo:</strong> ${orden.anticipo.toFixed(2)}
          </div>
        </div>
        <div>
          <strong>Status:</strong> {orden.status}
        </div>
      </section>

      {/* Fotos */}
      {orden.fotos?.length > 0 && (
        <section className="mb-4">
          <h5>Fotos</h5>
          <div className="d-flex flex-wrap gap-2">
            {orden.fotos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`foto-${i}`}
                width={100}
                height={100}
                className="border"
              />
            ))}
          </div>
        </section>
      )}

      <section>Entrego: {orden.responsable?.id || "No asignado"}</section>
    </div>
  );
};

export default DetalleOrdenTrabajo;

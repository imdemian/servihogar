import React, { useState } from "react";
import logo from "../../assets/logoServiHogar.png";

const Cotizaciones = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      descripcion: "",
      capacidad: "",
      cantidad: 0,
      costoUnitario: 0,
      costoTotal: 0,
    },
  ]);

  const handleItemChange = (idx, field, value) => {
    setItems(
      items.map((item, i) => {
        if (i !== idx) return item;
        const updated = {
          ...item,
          [field]:
            field === "cantidad" || field === "costoUnitario"
              ? Number(value)
              : value,
        };
        updated.costoTotal = updated.cantidad * updated.costoUnitario;
        return updated;
      })
    );
  };

  const addItem = () => {
    const nextId =
      items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    setItems([
      ...items,
      {
        id: nextId,
        descripcion: "",
        capacidad: "",
        cantidad: 0,
        costoUnitario: 0,
        costoTotal: 0,
      },
    ]);
  };

  return (
    <form className="p-4 w-75 mx-auto bg-white shadow-lg rounded">
      <div className="d-flex align-items-center mb-4">
        <img
          src={logo}
          alt="Logo CRM"
          width={40}
          height={40}
          className="me-3"
        />
        <h1 className="h3 mb-0">COTIZACIONES SECTOR INDUSTRIAL</h1>
      </div>

      {/* INFORMACIÓN DEL CLIENTE */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="row g-2">
            {/* Titulo del Cliente */}
            <div className="col-4">
              <label htmlFor="tituloCliente" className="form-label">
                Titulo del Cliente
              </label>
              <input
                type="text"
                className="form-control"
                id="tituloCliente"
                placeholder="Ing, Lic, Sr, Sra, etc."
              />
            </div>

            {/* Nombre del Cliente */}
            <div className="col-7">
              <label htmlFor="nombreCliente" className="form-label">
                Nombre del Cliente
              </label>
              <input
                type="text"
                className="form-control"
                id="nombreCliente"
                placeholder="Nombre del Cliente"
              />
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="row g-2">
            {/* Fecha */}

            <div className="col-6">
              <label htmlFor="fechaCotizacion" className="form-label">
                Fecha Cotización
              </label>
              <input
                type="date"
                className="form-control"
                id="fechaCotizacion"
              />
            </div>

            {/* No. Cotización */}
            <div className="col-6">
              <label htmlFor="noCotizacion" className="form-label">
                No. Cotización
              </label>
              <input
                type="text"
                className="form-control"
                id="noCotizacion"
                placeholder="No. Cotización"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LEYENDA O DESCRIPCIÓN DE LA COTIZACIÓN */}
      <h5 className="mb-3">Leyenda de la cotización</h5>
      <div>
        <textarea
          className="form-control mb-3"
          rows="3"
          placeholder="Descripción de la cotización"
          id="leyendaCotizacion"
        />
      </div>

      {/* PRODUCTOS O SERVICIOS */}
      <h5 className="mb-3">Productos o Servicios</h5>
      <table className="table table-bordered mb-3">
        <thead className="bg-primary text-white">
          <tr>
            <th style={{ width: "5%" }}>#</th>
            <th style={{ width: "40%" }}>DESCRIPCIÓN</th>
            <th style={{ width: "15%" }}>CAPACIDAD</th>
            <th style={{ width: "10%" }}>CANTIDAD</th>
            <th style={{ width: "15%" }}>COSTO UNITARIO</th>
            <th style={{ width: "15%" }}>COSTO TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td className="align-middle text-center">{item.id}</td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  value={item.descripcion}
                  onChange={(e) =>
                    handleItemChange(idx, "descripcion", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  value={item.capacidad}
                  onChange={(e) =>
                    handleItemChange(idx, "capacidad", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  value={item.cantidad}
                  onChange={(e) =>
                    handleItemChange(idx, "cantidad", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  value={item.costoUnitario}
                  onChange={(e) =>
                    handleItemChange(idx, "costoUnitario", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  value={item.costoTotal}
                  readOnly
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={addItem}
        >
          + Añadir producto/servicio
        </button>
      </div>
    </form>
  );
};

export default Cotizaciones;

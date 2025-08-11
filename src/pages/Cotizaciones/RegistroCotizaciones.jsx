import React, { useEffect, useState } from "react";
import logo from "../../assets/logoServiHogar.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  actualizarCotizacion,
  registrarCotizacion,
} from "../../services/cotizacionService";
import { toast } from "react-toastify";
import BasicModal from "../../components/BasicModal/BasicModal";
import { useNavigate } from "react-router-dom";

const RegistroCotizaciones = ({ initialData, setShow }) => {
  const navigate = useNavigate();

  // Valores por defecto
  const defaults = {
    tituloCliente: "",
    nombreCliente: "",
    fechaCotizacion: new Date().toISOString().slice(0, 10),
    status: "PENDIENTE",
    noCotizacion: "",
    leyendaCotizacion: "",
    instPieChecked: false,
    matInstChecked: false,
    leyendaFinal: "",
  };

  const [formData, setFormData] = useState(defaults);
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
  const [saving, setSaving] = useState(false);

  // Cuando initialData cambie, lo cargamos en formData y items
  useEffect(() => {
    if (initialData) {
      setFormData({
        tituloCliente: initialData.tituloCliente,
        nombreCliente: initialData.nombreCliente,
        fechaCotizacion: initialData.fechaCotizacion.slice(0, 10),
        status: initialData.status,
        noCotizacion: initialData.noCotizacion,
        leyendaCotizacion: initialData.leyendaCotizacion,
        instPieChecked: !!initialData.instPieChecked,
        matInstChecked: !!initialData.matInstChecked,
        leyendaFinal: initialData.leyendaFinal,
      });
      setItems(
        Array.isArray(initialData.items) && initialData.items.length > 0
          ? initialData.items.map((it, i) => ({
              id: i + 1,
              descripcion: it.descripcion,
              capacidad: it.capacidad,
              cantidad: it.cantidad,
              costoUnitario: it.costoUnitario,
              costoTotal: it.costoTotal,
            }))
          : [
              {
                id: 1,
                descripcion: "",
                capacidad: "",
                cantidad: 0,
                costoUnitario: 0,
                costoTotal: 0,
              },
            ]
      );
    }
  }, [initialData]);

  const totalGeneral = items.reduce((sum, item) => sum + item.costoTotal, 0);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleItemChange = (idx, field, value) => {
    setItems(
      items.map((item, i) => {
        if (i !== idx) return item;
        const updated = {
          ...item,
          [field]: ["cantidad", "costoUnitario"].includes(field)
            ? Number(value)
            : value,
        };
        updated.costoTotal = updated.cantidad * updated.costoUnitario;
        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        descripcion: "",
        capacidad: "",
        cantidad: 0,
        costoUnitario: 0,
        costoTotal: 0,
      },
    ]);
  };

  const removeItem = (idx) => {
    const filtered = items.filter((_, i) => i !== idx);
    setItems(filtered.map((it, i) => ({ ...it, id: i + 1 })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, items, total: totalGeneral };
      if (initialData && initialData.id) {
        await actualizarCotizacion(initialData.id, payload);
        toast.success("Cotización actualizada");
        setShow(false);
      } else {
        await registrarCotizacion(payload);
        if (setShow) setShow(false);
        else navigate("/cotizaciones");
        toast.success("Cotización guardada");
        setShow(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al guardar cotización");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <form
        className="p-4 w-100 mx-auto bg-white shadow-lg rounded"
        style={{ maxWidth: "900px" }}
        onSubmit={handleSubmit}
      >
        <div className="d-flex align-items-center mb-4">
          {!initialData && !setShow && (
            <button
              className="btn btn-primary me-3"
              type="button"
              onClick={() => navigate("/cotizaciones")}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          )}

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
              <div className="col-4">
                <label className="form-label">Título</label>
                <input
                  type="text"
                  className="form-control"
                  name="tituloCliente"
                  value={formData.tituloCliente}
                  onChange={handleFormChange}
                  placeholder="Ing, Lic, Sr, etc."
                />
              </div>
              <div className="col-8">
                <label className="form-label">Nombre Cliente</label>
                <input
                  type="text"
                  className="form-control"
                  name="nombreCliente"
                  value={formData.nombreCliente}
                  onChange={handleFormChange}
                  placeholder="Nombre del Cliente"
                />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  name="fechaCotizacion"
                  value={formData.fechaCotizacion}
                  onChange={handleFormChange}
                />
              </div>
              <div className="col-6">
                <label className="form-label">No. Cotización</label>
                <input
                  type="text"
                  className="form-control"
                  name="noCotizacion"
                  value={formData.noCotizacion}
                  onChange={handleFormChange}
                  placeholder="Número"
                />
              </div>
            </div>
          </div>
        </div>

        {/* LEYENDA */}
        <div className="mb-3">
          <label className="form-label">Leyenda</label>
          <textarea
            className="form-control"
            rows={6}
            name="leyendaCotizacion"
            value={formData.leyendaCotizacion}
            onChange={handleFormChange}
            placeholder="Descripción detallada..."
          />
        </div>

        {/* ITEMS */}
        <h5 className="mb-2">Productos/Servicios</h5>
        <table className="table table-bordered mb-3">
          <thead className="bg-primary text-white">
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th style={{ width: "300px" }}>Desc.</th>
              <th style={{ width: "120px" }}>Capacidad</th>
              <th style={{ width: "80px" }}>Cant.</th>
              <th style={{ width: "100px" }}>Unit.</th>
              <th style={{ width: "100px" }}>Total</th>
              <th>Acc</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={item.descripcion}
                    onChange={(e) =>
                      handleItemChange(idx, "descripcion", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    style={{ maxWidth: "120px" }}
                    value={item.capacidad}
                    onChange={(e) =>
                      handleItemChange(idx, "capacidad", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ maxWidth: "80px" }}
                    value={item.cantidad}
                    onChange={(e) =>
                      handleItemChange(idx, "cantidad", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ maxWidth: "100px" }}
                    value={item.costoUnitario}
                    onChange={(e) =>
                      handleItemChange(idx, "costoUnitario", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    style={{ maxWidth: "100px" }}
                    readOnly
                    value={item.costoTotal}
                  />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeItem(idx)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="text-end fw-bold">
                Total general:
              </td>
              <td className="fw-bold">{totalGeneral.toFixed(2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
        <button
          type="button"
          className="btn btn-outline-primary mb-4"
          onClick={addItem}
        >
          + Añadir producto/servicio
        </button>

        {/* LEYENDA FINAL */}
        <div className="mb-4">
          <label className="form-label">Leyenda Final</label>
          <textarea
            className="form-control"
            rows={6}
            name="leyendaFinal"
            value={formData.leyendaFinal}
            onChange={handleFormChange}
          />
        </div>

        <div className="text-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? "Guardando…"
              : `Guardar Cotización (Total: $${totalGeneral.toFixed(2)})`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroCotizaciones;

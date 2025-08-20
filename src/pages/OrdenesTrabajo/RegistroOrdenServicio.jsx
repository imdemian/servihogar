// src/pages/OrdenesTrabajo/RegistroOrdenServicio.jsx
import React, { useEffect, useState, useRef } from "react";
import { buscarClientes } from "../../services/clientesService";
import { obtenerEmpleados } from "../../services/empleadosService";
import {
  registrarOrdenTrabajo,
  existeFolio,
} from "../../services/ordenesTrabajoService";
import { toast } from "react-toastify";
import { faPlusCircle, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { generateUniqueFolio } from "../../utils/folioUtils";

const RegistroOrdenServicio = ({ setShowModal }) => {
  // Empleados (suele ser lista corta)
  const [empleados, setEmpleados] = useState([]);

  // Autocompletado de Clientes
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("nombre"); // "nombre" | "direccion"
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggCursor, setSuggCursor] = useState(null);
  const [suggLoading, setSuggLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Folio manual (opcional)
  const [debouncedFolio, setDebouncedFolio] = useState("");
  const [folioChecking, setFolioChecking] = useState(false);
  const [folioAvailable, setFolioAvailable] = useState(null); // true | false | null

  // Click-outside para cerrar dropdown
  const wrapperRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Datos de la orden
  const [datosOrden, setDatosOrden] = useState({
    folio: "", // ← ahora editable manualmente (opcional)
    cliente: {
      id: "",
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      direccion: "",
    },
    descripcionFalla: "",
    equipos: [{ descripcion: "", marca: "", modelo: "" }],
    empleados: [], // ids de empleados que participan (opcional)
    servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1, total: 0 }],
    fechaRecepcion: "",
    fechaEntrega: "",
    anticipo: 0,
    total: 0,
    status: "CREADA",
  });

  // Cargar empleados
  useEffect(() => {
    (async () => {
      try {
        const emp = await obtenerEmpleados();
        setEmpleados(emp || []);
      } catch (err) {
        console.error(err);
        toast.error("No se pudieron cargar los empleados");
      }
    })();
  }, []);

  // Debounce del término de búsqueda de clientes
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Buscar sugerencias de clientes
  useEffect(() => {
    const fetch = async () => {
      if (debouncedTerm.length < 2) {
        setSuggestions([]);
        setSuggCursor(null);
        return;
      }
      setSuggLoading(true);
      try {
        const { items, nextCursor } = await buscarClientes({
          q: debouncedTerm,
          field: searchField,
          limit: 10,
        });
        setSuggestions(items || []);
        setSuggCursor(nextCursor || null);
      } catch (e) {
        console.error(e);
        toast.error("Error buscando clientes");
      } finally {
        setSuggLoading(false);
      }
    };
    fetch();
  }, [debouncedTerm, searchField]);

  // Debounce del folio manual para verificar disponibilidad
  useEffect(() => {
    const t = setTimeout(() => {
      const f = (datosOrden.folio || "").trim();
      setDebouncedFolio(f);
    }, 350);
    return () => clearTimeout(t);
  }, [datosOrden.folio]);

  // Verificar disponibilidad del folio cuando cambie el debouncedFolio
  useEffect(() => {
    const check = async () => {
      const folio = debouncedFolio;
      if (!folio) {
        setFolioAvailable(null);
        return;
      }
      setFolioChecking(true);
      try {
        const exists = await existeFolio(folio);
        setFolioAvailable(!exists); // disponible si NO existe
      } catch (e) {
        console.error(e);
        setFolioAvailable(null);
      } finally {
        setFolioChecking(false);
      }
    };
    check();
  }, [debouncedFolio]);

  // Cargar más sugerencias
  async function loadMoreSuggestions() {
    if (!suggCursor || suggLoading || debouncedTerm.length < 2) return;
    setSuggLoading(true);
    try {
      const { items, nextCursor } = await buscarClientes({
        q: debouncedTerm,
        field: searchField,
        limit: 10,
        cursor: suggCursor,
      });
      setSuggestions((prev) => [...prev, ...(items || [])]);
      setSuggCursor(nextCursor || null);
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar más resultados");
    } finally {
      setSuggLoading(false);
    }
  }

  // Seleccionar cliente
  const selectCliente = (c) => {
    setDatosOrden((prev) => ({
      ...prev,
      cliente: {
        id: c.id,
        nombre: c.nombre,
        apellidoPaterno: c.apellidoPaterno,
        apellidoMaterno: c.apellidoMaterno,
        telefono: c.telefono,
        direccion: c.direccion,
      },
    }));
    const nombreCompleto = [c.nombre, c.apellidoPaterno, c.apellidoMaterno]
      .filter(Boolean)
      .join(" ");
    setSearchTerm(`${nombreCompleto} — ${c.telefono || "s/ teléfono"}`);
    setShowSuggestions(false);
  };

  // Equipos
  const handleEquipoChange = (idx, field, value) => {
    const nuevos = [...datosOrden.equipos];
    nuevos[idx][field] = value;
    setDatosOrden((prev) => ({ ...prev, equipos: nuevos }));
  };
  const handleAddEquipo = () => {
    setDatosOrden((prev) => ({
      ...prev,
      equipos: [...prev.equipos, { descripcion: "", marca: "", modelo: "" }],
    }));
  };
  const handleRemoveEquipo = (idx) => {
    setDatosOrden((prev) => ({
      ...prev,
      equipos: prev.equipos.filter((_, i) => i !== idx),
    }));
  };

  // Submit
  const onSubmit = async (e) => {
    e.preventDefault();

    // Validar cliente
    if (!datosOrden.cliente?.id) {
      toast.warn("Selecciona un cliente de la lista de sugerencias.");
      return;
    }
    // Validar equipos
    const equiposValidos = datosOrden.equipos.filter(
      (eq) => (eq.descripcion || "").trim() !== ""
    );
    if (equiposValidos.length === 0) {
      toast.warn("Debes agregar al menos un equipo con descripción válida.");
      return;
    }
    // Validar fecha recepción
    if (!datosOrden.fechaRecepcion) {
      toast.warn("La fecha de recepción es obligatoria.");
      return;
    }
    // Validar fecha entrega >= recepción
    if (datosOrden.fechaEntrega) {
      const fr = new Date(datosOrden.fechaRecepcion);
      const fe = new Date(datosOrden.fechaEntrega);
      if (fe < fr) {
        toast.warn(
          "La fecha de entrega no puede ser anterior a la de recepción."
        );
        return;
      }
    }

    try {
      // Folio: usar manual si viene; si no, generar
      let folio = (datosOrden.folio || "").trim();
      if (folio) {
        // Si el usuario lo proporcionó, verificar disponibilidad por si cambió desde el debounce
        const exists = await existeFolio(folio);
        if (exists) {
          toast.error(
            "El folio ya existe. Ingresa uno diferente o deja vacío para generar uno."
          );
          return;
        }
      } else {
        folio = await generateUniqueFolio(10);
      }

      const payload = {
        ...datosOrden,
        equipos: equiposValidos,
        folio,
      };

      await registrarOrdenTrabajo(payload);
      toast.success(`Orden registrada correctamente (folio: ${folio})`);

      // Reset
      setDatosOrden({
        folio: "",
        cliente: {
          id: "",
          nombre: "",
          apellidoPaterno: "",
          apellidoMaterno: "",
          telefono: "",
          direccion: "",
        },
        descripcionFalla: "",
        equipos: [{ descripcion: "", marca: "", modelo: "" }],
        empleados: [],
        servicios: [{ servicio: "", precioUnitario: 0, cantidad: 1, total: 0 }],
        fechaRecepcion: "",
        fechaEntrega: "",
        anticipo: 0,
        total: 0,
        status: "CREADA",
      });
      setSearchTerm("");
      setSuggestions([]);
      setSuggCursor(null);
      setShowSuggestions(false);
      setFolioAvailable(null);
      setDebouncedFolio("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo registrar la orden");
    }
  };

  return (
    <form
      className="p-4 position-relative"
      onSubmit={onSubmit}
      ref={wrapperRef}
    >
      {/* Folio manual (opcional) */}
      <div className="mb-3">
        <label className="form-label">Folio (opcional)</label>
        <div className="d-flex gap-2 align-items-center">
          <input
            type="text"
            className="form-control"
            placeholder="Ingresa un folio manual o deja vacío para generar uno"
            value={datosOrden.folio}
            onChange={(e) =>
              setDatosOrden((prev) => ({ ...prev, folio: e.target.value }))
            }
          />
          {folioChecking && (
            <small className="text-muted ms-2">Verificando…</small>
          )}
          {!folioChecking &&
            datosOrden.folio.trim() !== "" &&
            folioAvailable === true && (
              <small className="text-success ms-2">Disponible</small>
            )}
          {!folioChecking &&
            datosOrden.folio.trim() !== "" &&
            folioAvailable === false && (
              <small className="text-danger ms-2">No disponible</small>
            )}
        </div>
        <small className="text-muted">
          Si lo dejas vacío, se generará uno automáticamente.
        </small>
      </div>

      {/* Cliente */}
      <div className="mb-4 position-relative">
        <label className="form-label">Cliente</label>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder={`Buscar por ${
              searchField === "nombre" ? "nombre" : "dirección"
            }... (min 2 letras)`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          <select
            className="form-select"
            style={{ maxWidth: 160 }}
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="nombre">Nombre</option>
            <option value="direccion">Dirección</option>
          </select>
        </div>

        {showSuggestions && (suggLoading || suggestions.length > 0) && (
          <div
            className="card position-absolute w-100 mt-1 shadow"
            style={{ maxHeight: 280, overflowY: "auto", zIndex: 1000 }}
          >
            <ul className="list-group list-group-flush">
              {suggLoading && suggestions.length === 0 && (
                <li className="list-group-item text-muted">Buscando…</li>
              )}

              {suggestions.map((c) => {
                const nombreCompleto = [
                  c.nombre,
                  c.apellidoPaterno,
                  c.apellidoMaterno,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li
                    key={c.id}
                    className="list-group-item list-group-item-action"
                    onClick={() => selectCliente(c)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="fw-semibold">
                      {nombreCompleto || "Sin nombre"}
                    </div>
                    <small className="text-muted">
                      {c.telefono || "s/ teléfono"} —{" "}
                      {c.direccion || "s/ dirección"}
                    </small>
                  </li>
                );
              })}

              {suggCursor && (
                <li className="list-group-item text-center">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={loadMoreSuggestions}
                    disabled={suggLoading}
                  >
                    {suggLoading ? "Cargando…" : "Cargar más"}
                  </button>
                </li>
              )}

              {!suggLoading &&
                suggestions.length === 0 &&
                debouncedTerm.length >= 2 && (
                  <li className="list-group-item text-muted">
                    Sin coincidencias.
                  </li>
                )}
            </ul>
          </div>
        )}
      </div>

      {/* Tabla de equipos */}
      <div className="mb-4">
        <label className="form-label">Equipos</label>
        <table className="table table-bordered">
          <thead className="bg-light">
            <tr>
              <th>Descripción</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosOrden.equipos.map((eq, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={eq.descripcion}
                    onChange={(e) =>
                      handleEquipoChange(idx, "descripcion", e.target.value)
                    }
                    required
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={eq.marca}
                    onChange={(e) =>
                      handleEquipoChange(idx, "marca", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={eq.modelo}
                    onChange={(e) =>
                      handleEquipoChange(idx, "modelo", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveEquipo(idx)}
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
          className="btn btn-outline-primary"
          onClick={handleAddEquipo}
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Añadir Equipo
        </button>
      </div>

      {/* Falla y fechas */}
      <div className="mb-4">
        <label className="form-label">Descripción de la falla</label>
        <textarea
          className="form-control"
          rows="3"
          value={datosOrden.descripcionFalla}
          onChange={(e) =>
            setDatosOrden((prev) => ({
              ...prev,
              descripcionFalla: e.target.value,
            }))
          }
        />
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Fecha Recepción</label>
          <input
            type="date"
            className="form-control"
            value={datosOrden.fechaRecepcion}
            onChange={(e) =>
              setDatosOrden((prev) => ({
                ...prev,
                fechaRecepcion: e.target.value,
              }))
            }
          />
        </div>
        <div className="col-md-6">
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
      </div>

      {/* (Opcional) Selección de empleados participantes */}
      {/* 
      <div className="mb-4">
        <label className="form-label">Empleados que participan</label>
        <select
          multiple
          className="form-select"
          value={datosOrden.empleados}
          onChange={(e) =>
            setDatosOrden((prev) => ({
              ...prev,
              empleados: Array.from(e.target.selectedOptions, (o) => o.value),
            }))
          }
        >
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre} {emp.apellidoPaterno || ""} {emp.apellidoMaterno || ""}
            </option>
          ))}
        </select>
        <small className="text-muted">Ctrl/Cmd + clic para seleccionar múltiples.</small>
      </div>
      */}

      <div className="text-end">
        <button type="submit" className="btn btn-primary">
          Guardar Orden
        </button>
      </div>
    </form>
  );
};

export default RegistroOrdenServicio;

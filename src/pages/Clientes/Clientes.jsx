import React, { useEffect, useState } from "react";
import { obtenerClientes } from "../../services/clientesService";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faPenSquare,
  faSearch,
  faTrashCan,
  faListUl,
} from "@fortawesome/free-solid-svg-icons";
import RegistroClientes from "./Registro.clientes";
import EliminarCliente from "./Eliminacion.clientes";
import BasicModal from "../../components/BasicModal/BasicModal";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState(null);
  const [titleModal, setTitleModal] = useState("");

  // Estado y handlers para el modal de equipos
  const [showEquiposModal, setShowEquiposModal] = useState(false);
  const [equiposList, setEquiposList] = useState([]);

  const abrirModalRegistro = (content, editar) => {
    setShowModal(true);
    setContent(content);
    setTitleModal(!editar ? "Registro de Cliente" : "Editar Cliente");
  };

  const abrirModalEliminar = (content) => {
    setShowModal(true);
    setContent(content);
    setTitleModal("Eliminar Cliente");
  };

  const abrirModalEquipos = (equipos) => {
    setEquiposList(equipos);
    setShowEquiposModal(true);
  };

  const cargarClientes = async () => {
    try {
      const response = await obtenerClientes();
      setClientes(response);
    } catch (error) {
      console.error("Error al obtener los clientes: ", error);
      toast.error("Error al obtener los clientes");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [showModal]);

  const clientesFiltrados = clientes.filter((c) => {
    const term = filtroBusqueda.trim().toLowerCase();
    if (!term) return true;
    const fullName =
      `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (c.direccion || "").toLowerCase().includes(term) ||
      (c.telefono || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Clientes</h5>
          <button
            className="btn btn-success btn-sm"
            onClick={() =>
              abrirModalRegistro(
                <RegistroClientes setShowModal={setShowModal} />
              )
            }
          >
            <FontAwesomeIcon icon={faCirclePlus} /> Registrar Cliente
          </button>
        </div>

        <div className="input-group mb-3">
          <span className="input-group-text">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, dirección o teléfono..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
          />
        </div>

        <div className="card-body">
          {cargando ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : clientesFiltrados.length > 0 ? (
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nombre completo</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Equipos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente._id}>
                    <td>
                      {[
                        cliente.nombre,
                        cliente.apellidoPaterno,
                        cliente.apellidoMaterno,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td>{cliente.telefono || "-"}</td>
                    <td>{cliente.direccion || "-"}</td>
                    <td className="text-center">
                      {cliente.equipos.length > 0 ? (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => abrirModalEquipos(cliente.equipos)}
                        >
                          <FontAwesomeIcon icon={faListUl} />{" "}
                          {cliente.equipos.length}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{cliente.estado}</td>
                    <td>
                      <button
                        className="btn btn-outline-primary btn-sm me-1"
                        onClick={() =>
                          abrirModalRegistro(
                            <RegistroClientes
                              cliente={cliente}
                              setShowModal={setShowModal}
                            />,
                            true
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faPenSquare} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() =>
                          abrirModalEliminar(
                            <EliminarCliente
                              cliente={cliente}
                              onDeleteSuccess={() => {
                                setShowModal(false);
                                cargarClientes();
                              }}
                              onCancel={() => setShowModal(false)}
                            />
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-warning">
              No hay clientes registrados.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Registro/Edición/Eliminación */}
      <BasicModal
        show={showModal}
        setShow={setShowModal}
        title={titleModal}
        size="lg"
      >
        {content}
      </BasicModal>

      {/* Modal de Equipos */}
      <BasicModal
        show={showEquiposModal}
        setShow={setShowEquiposModal}
        title="Equipos del cliente"
        size="md"
      >
        <div className="list-group">
          {equiposList.map((eq, idx) => (
            <div key={idx} className="list-group-item">
              <h6 className="mb-1">
                {eq.tipo} — {eq.marca} {eq.modelo} (S/N:{" "}
                {eq.numeroSerie || "N/A"})
              </h6>
              {eq.fotos && eq.fotos.length > 0 ? (
                <div className="d-flex flex-wrap">
                  {eq.fotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Equipo ${idx} Foto ${i + 1}`}
                      className="me-2 mb-2"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  ))}
                </div>
              ) : (
                <small className="text-muted">Sin fotos</small>
              )}
            </div>
          ))}
        </div>
      </BasicModal>
    </div>
  );
};

export default Clientes;

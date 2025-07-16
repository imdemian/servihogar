import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerCotizaciones,
  eliminarCotizacion,
} from "../../services/cotizacionService";
import { toast } from "react-toastify";
import BasicModal from "../../components/BasicModal/BasicModal";
import RegistroCotizaciones from "./RegistroCotizaciones";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileArrowDown,
  faListCheck,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import CambioStatusCot from "./CambioStatusCot";
import { generateCotizacionPdf } from "../../services/pdfs/cotPDFgen";
import { AuthContext } from "../../utils/context";

export default function ListadoCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendientes");
  const navigate = useNavigate();

  // ✅ Traer rol del usuario desde contexto
  const { userRole } = useContext(AuthContext);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  const loadCotizaciones = async () => {
    setLoading(true);
    try {
      const response = await obtenerCotizaciones();
      setCotizaciones(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar cotizaciones");
      setCotizaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const byStatus = (status) =>
    Array.isArray(cotizaciones)
      ? cotizaciones.filter((c) => c.status === status.toUpperCase())
      : [];

  useEffect(() => {
    if (!showModal) {
      loadCotizaciones();
    }
  }, [showModal]);

  const abrirModalEdicion = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setShowModal(true);
  };

  const modalChangeStatus = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setShowModal(true);
  };

  const handleDownloadPdf = async (cot) => {
    try {
      await generateCotizacionPdf(cot);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      toast.error("No se pudo descargar la cotización.");
    }
  };

  const handleDelete = async (cot) => {
    try {
      await eliminarCotizacion(cot.id);
      toast.success("Cotización eliminada");
      loadCotizaciones();
      setShowModal(false);
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error("No se pudo eliminar la cotización");
    }
  };

  const renderCardTable = (status, title, bgClass) => {
    const list = byStatus(status);
    return (
      <div className="col-md-6 mb-3" key={status}>
        <div className={`card ${bgClass}`}>
          <div className="card-header">
            {title} ({list.length})
          </div>
          <div className="card-body p-0">
            <table className="table mb-0">
              <tbody>
                {list.length > 0 ? (
                  list.map((cot) => (
                    <tr key={cot.id}>
                      <td className="px-2 py-1">{cot.noCotizacion}</td>
                      <td className="px-2 py-1">
                        {new Date(cot.fechaCotizacion).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-1">{cot.nombreCliente}</td>
                      <td className="px-2 py-1 text-end">
                        ${cot.total.toFixed(2)}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            abrirModalEdicion(
                              "Editar Cotización",
                              <RegistroCotizaciones
                                initialData={cot}
                                setShowModal={setShowModal}
                                onSaved={() => {
                                  setShowModal(false);
                                  loadCotizaciones();
                                }}
                              />
                            );
                          }}
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>

                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            modalChangeStatus(
                              "Cambiar status",
                              <CambioStatusCot
                                cotizacion={cot}
                                setShow={setShowModal}
                              />
                            );
                          }}
                        >
                          <FontAwesomeIcon icon={faListCheck} />
                        </button>

                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDownloadPdf(cot)}
                        >
                          <FontAwesomeIcon icon={faFileArrowDown} />
                        </button>

                        {userRole === "ADMIN" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              abrirModalEdicion(
                                "Confirmar eliminación",
                                <>
                                  <p>
                                    ¿Estás seguro de eliminar la cotización{" "}
                                    <strong>{cot.noCotizacion}</strong>?
                                  </p>
                                  <div className="d-flex justify-content-end">
                                    <button
                                      className="btn btn-secondary me-2"
                                      onClick={() => setShowModal(false)}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      onClick={() => handleDelete(cot)}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </>
                              );
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-3 text-muted">
                      No hay cotizaciones
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Cotizaciones</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/registro-cotizaciones")}
        >
          Registrar Cotización
        </button>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "pendientes" ? "active" : ""}`}
            onClick={() => setActiveTab("pendientes")}
          >
            Pendientes/Aprobadas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "pagadas" ? "active" : ""}`}
            onClick={() => setActiveTab("pagadas")}
          >
            Pagadas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "rechazadas" ? "active" : ""}`}
            onClick={() => setActiveTab("rechazadas")}
          >
            Rechazadas
          </button>
        </li>
      </ul>

      {activeTab === "pendientes" && (
        <div className="row">
          {renderCardTable("PENDIENTE", "Pendientes", "bg-light")}
          {renderCardTable("APROBADA", "Aprobadas", "bg-success text-white")}
        </div>
      )}
      {activeTab === "pagadas" && (
        <div className="row">
          {renderCardTable("PAGADA", "Pagadas", "bg-primary text-white")}
        </div>
      )}
      {activeTab === "rechazadas" && (
        <div className="row">
          {renderCardTable("RECHAZADA", "Rechazadas", "bg-danger text-white")}
        </div>
      )}

      <BasicModal show={showModal} setShow={setShowModal} title={modalTitle}>
        {modalContent}
      </BasicModal>
    </div>
  );
}

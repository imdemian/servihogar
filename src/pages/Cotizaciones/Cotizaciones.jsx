import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCotizaciones } from "../../services/cotizacionService";
import { toast } from "react-toastify";
import BasicModal from "../../components/BasicModal/BasicModal";
import RegistroCotizaciones from "./RegistroCotizaciones";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileArrowDown,
  faListCheck,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import CambioStatusCot from "./CambioStatusCot";
import { generateCotizacionPdf } from "../../services/pdfs/cotPDFgen";

export default function ListadoCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendientes");
  const navigate = useNavigate();

  // Propiedades del modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  // 1) Extraemos la carga en una función reutilizable
  const loadCotizaciones = async () => {
    setLoading(true);
    try {
      const data = await obtenerCotizaciones();
      setCotizaciones(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCotizaciones();
  }, []);

  const byStatus = (status) =>
    cotizaciones.filter((c) => c.status === status.toUpperCase());

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
                                  // aquí podrías recargar lista, limpiar selectedCot, etc.
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
                                setShowModal={setShowModal}
                                onSaved={() => {
                                  setShowModal(false);
                                  loadCotizaciones();
                                }}
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

      {/* 2) Modal de edición */}
      <BasicModal show={showModal} setShow={setShowModal} title={modalTitle}>
        {modalContent}
      </BasicModal>
    </div>
  );
}

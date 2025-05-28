import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerOrdenesTrabajo } from "../../services/ordenesTrabajoService";
import { toast } from "react-toastify";
import BasicModal from "../../components/BasicModal/BasicModal";

import AddServicios from "./mods/addServicios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import RegistroOrdenServicio from "./RegistroOrdenServicio";

export default function ListadoOrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("CREADA");
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);
  const navigate = useNavigate();

  const loadOrdenes = async () => {
    setLoading(true);
    try {
      const data = await obtenerOrdenesTrabajo();
      setOrdenes(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdenes();
  }, []);

  const byStatus = (status) => ordenes.filter((o) => o.status === status);

  const abrirCambioStatus = (orden) => {
    setModalTitle(`Actualizar Orden ${orden.folio}`);
    setModalContent(
      <AddServicios
        orden={orden}
        onClose={() => setShowModal(false)}
        onUpdated={() => {
          setShowModal(false);
          loadOrdenes();
        }}
      />
    );
    setShowModal(true);
  };

  const renderCardTable = (status, title, bgClass) => {
    const list = byStatus(status);
    return (
      <div className="col-12 mb-3" key={status}>
        <div className={`card ${bgClass}`}>
          <div className="card-header">
            {title} ({list.length})
          </div>
          <div className="card-body p-0">
            <table className="table mb-0">
              <tbody>
                {list.length > 0 ? (
                  list.map((orden) => (
                    <tr key={orden.id}>
                      <td className="px-2 py-1">{orden.folio}</td>
                      <td className="px-2 py-1">
                        {`${orden.cliente.nombre} ${orden.cliente.apellidoPaterno} ${orden.cliente.apellidoMaterno}`}
                      </td>
                      <td className="px-2 py-1">
                        {new Date(orden.fechaRecepcion).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-1">
                        {new Date(orden.fechaEntrega).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-1 text-end">
                        ${orden.anticipo.toFixed(2)}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => abrirCambioStatus(orden)}
                        >
                          <FontAwesomeIcon icon={faListCheck} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-3 text-muted">
                      No hay órdenes
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

  if (loading) {
    return <div className="text-center">Cargando...</div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Órdenes de Trabajo</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/registro-ordenes-servicio")}
        >
          Registrar Orden
        </button>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "CREADA" ? "active" : ""}`}
            onClick={() => setActiveTab("CREADA")}
          >
            CREADAS
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "SERVICIO" ? "active" : ""}`}
            onClick={() => setActiveTab("SERVICIO")}
          >
            EN SERVICIO
          </button>
        </li>
      </ul>

      <div className="row">
        {activeTab === "CREADA" &&
          renderCardTable("CREADA", "Órdenes CREADAS", "bg-light")}
        {activeTab === "SERVICIO" &&
          renderCardTable(
            "SERVICIO",
            "Órdenes EN SERVICIO",
            "bg-info text-white"
          )}
      </div>

      <BasicModal show={showModal} setShow={setShowModal} title={modalTitle}>
        {modalContent}
      </BasicModal>
    </div>
  );
}

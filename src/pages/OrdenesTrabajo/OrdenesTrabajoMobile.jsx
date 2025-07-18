import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import BasicModal from "../../components/BasicModal/BasicModal";
import DetalleOrdenTrabajo from "./DetalleOrdenTrabajo";
import AddServicios from "./mods/addServicios";
import "./OrdenesTrabajoMobile.scss"; // Assuming you have a CSS file for mobile styles

export default function OrdenesTrabajoMobile() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "ordenesTrabajo"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrdenes(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener órdenes:", error);
        toast.error("Error al cargar órdenes");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filtered = ordenes.filter((o) => {
    const term = filterText.toLowerCase();
    return (
      o.folio?.toLowerCase().includes(term) ||
      o.cliente?.nombre?.toLowerCase().includes(term) ||
      o.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="ordenes-mobile-container">
      <h4 className="titulo">Órdenes de Servicio</h4>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar folio, cliente o status..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
      />

      {loading ? (
        <p>Cargando...</p>
      ) : filtered.length === 0 ? (
        <p>No hay órdenes disponibles.</p>
      ) : (
        filtered.map((orden) => (
          <div
            key={orden.id}
            className="orden-card mb-3 shadow-sm rounded p-3 bg-white"
          >
            <p>
              <strong>Folio:</strong> {orden.folio}
            </p>
            <p>
              <strong>Cliente:</strong>{" "}
              {[orden.cliente?.nombre, orden.cliente?.apellidoPaterno]
                .filter(Boolean)
                .join(" ")}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              <span
                className={`badge bg-${
                  orden.status === "PAGADO"
                    ? "success"
                    : orden.status === "SERVICIO"
                    ? "primary"
                    : "secondary"
                }`}
              >
                {orden.status}
              </span>
            </p>
            <p>
              <strong>Recepción:</strong>{" "}
              {orden.fechaRecepcion
                ? new Date(orden.fechaRecepcion).toLocaleDateString()
                : "—"}
            </p>
            <p>
              <strong>Total:</strong>{" "}
              {orden.total != null
                ? `$${orden.total.toFixed(2)}`
                : "PEND SERVICIO"}
            </p>

            <button
              className="btn btn-outline-primary btn-sm w-100 mt-2"
              onClick={() => {
                setModalTitle(`Orden: ${orden.folio}`);
                setModalContent(<DetalleOrdenTrabajo orden={orden} />);
                setShowModal(true);
              }}
            >
              Ver Detalles
            </button>

            {orden.status === "CREADA" && (
              <button
                className="btn btn-outline-secondary btn-sm w-100 mt-2"
                onClick={() => {
                  setModalTitle("Servicios / Cambiar Status");
                  setModalContent(
                    <AddServicios
                      orden={orden}
                      onClose={() => setShowModal(false)}
                      onUpdated={() => setShowModal(false)}
                    />
                  );
                  setShowModal(true);
                }}
              >
                Servicios / Status
              </button>
            )}
          </div>
        ))
      )}

      <BasicModal
        show={showModal}
        setShow={setShowModal}
        title={modalTitle}
        size="lg"
      >
        {modalContent}
      </BasicModal>
    </div>
  );
}

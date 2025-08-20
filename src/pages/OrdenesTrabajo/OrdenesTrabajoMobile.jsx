import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import BasicModal from "../../components/BasicModal/BasicModal";
import DetalleOrdenTrabajo from "./DetalleOrdenTrabajo";
import AddServicios from "./mods/addServicios";
import "./OrdenesTrabajoMobile.scss";

import { obtenerOrdenesTrabajoPendientes } from "../../services/ordenesTrabajoService";

export default function OrdenesTrabajoMobile() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  // Paginación (desde backend)
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  // Helper seguro para fechas
  const toDateSafe = (v) => {
    if (!v) return null;
    if (typeof v?.toDate === "function") return v.toDate();
    if (v instanceof Date) return v;
    if (typeof v === "string") {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof v === "object" && "seconds" in v) {
      return new Date(v.seconds * 1000);
    }
    return null;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { ordenes, nextCursor } = await obtenerOrdenesTrabajoPendientes({
          limit: 50,
        });
        setOrdenes(ordenes || []);
        setNextCursor(nextCursor || null);
      } catch (e) {
        console.error(e);
        toast.error("Error al cargar órdenes pendientes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { ordenes: more, nextCursor: nc } =
        await obtenerOrdenesTrabajoPendientes({
          limit: 50,
          cursorStatus: nextCursor.cursorStatus,
          cursorSort: nextCursor.cursorSort,
          cursorId: nextCursor.cursorId,
        });
      setOrdenes((prev) => [...prev, ...(more || [])]);
      setNextCursor(nc || null);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar más órdenes");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filtro local SOLO para el buscador de la UI
  const filtered = ordenes.filter((o) => {
    const term = filterText.toLowerCase();
    return (
      o.folio?.toLowerCase?.().includes(term) ||
      o.cliente?.nombre?.toLowerCase?.().includes(term) ||
      o.status?.toLowerCase?.().includes(term)
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
        <>
          {filtered.map((orden) => {
            const fRecep = toDateSafe(orden.fechaRecepcion);
            return (
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
                  {fRecep ? fRecep.toLocaleDateString() : "—"}
                </p>
                <p>
                  <strong>Total:</strong>{" "}
                  {orden.total != null
                    ? `$${Number(orden.total).toFixed(2)}`
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
            );
          })}

          {nextCursor && (
            <button
              className="btn btn-outline-secondary w-100 mt-2"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </>
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

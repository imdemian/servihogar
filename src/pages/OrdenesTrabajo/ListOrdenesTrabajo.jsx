// src/pages/OrdenesTrabajo.jsx
import React, { useEffect, useState, useMemo, useContext } from "react";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faListCheck,
  faEye,
  faMoneyBill,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

import AddServicios from "./mods/addServicios";
import DetalleOrdenTrabajo from "./DetalleOrdenTrabajo";
import RegistroOrdenServicio from "./RegistroOrdenServicio";
import FinalizarOrden from "./mods/finalizarOrden";
import BasicModal from "../../components/BasicModal/BasicModal";
import { AuthContext } from "../../utils/context";
import ConfirmarEliminacion from "./mods/confirmarEliminacion";

// 👉 usa el service paginado del backend
import { obtenerOrdenesTrabajo } from "../../services/ordenesTrabajoService";

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterText, setFilterText] = useState("");

  // Estado de paginación del backend
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null); // { cursorSort, cursorId } | null

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  const { userRole } = useContext(AuthContext);

  // Helpers de fecha (defensivos: string o Timestamp)
  const fmtDate = (v) => {
    const d = v?.toDate?.() ?? (v ? new Date(v) : null);
    return d ? d.toLocaleDateString() : "-";
  };

  // Carga inicial (primera página)
  const loadFirstPage = async () => {
    try {
      setLoading(true);
      const { ordenes, hasMore, nextCursor } = await obtenerOrdenesTrabajo({
        limit: 100,
      });
      setOrdenes(ordenes || []);
      setHasMore(!!hasMore);
      setNextCursor(nextCursor || null);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar órdenes.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar más (siguiente página)
  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    try {
      setLoadingMore(true);
      const {
        ordenes: extra,
        hasMore: more,
        nextCursor: cursor,
      } = await obtenerOrdenesTrabajo({
        limit: 20,
        cursorSort: nextCursor?.cursorSort,
        cursorId: nextCursor?.cursorId,
      });
      setOrdenes((prev) => [...prev, ...(extra || [])]);
      setHasMore(!!more);
      setNextCursor(cursor || null);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar más órdenes.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Montaje
  useEffect(() => {
    loadFirstPage();
  }, []);

  // Al cerrar modal, refrescar primera página (para ver cambios)
  useEffect(() => {
    if (!showModal) {
      const t = setTimeout(() => loadFirstPage(), 150);
      return () => clearTimeout(t);
    }
  }, [showModal, ordenes]);

  const columns = useMemo(
    () => [
      {
        name: "Folio",
        selector: (row) => row.folio,
        sortable: true,
      },
      {
        name: "Cliente",
        selector: (row) =>
          [row?.cliente?.nombre, row?.cliente?.apellidoPaterno]
            .filter(Boolean)
            .join(" "),
        sortable: true,
        minWidth: "180px",
      },
      {
        name: "Recepción",
        selector: (row) => fmtDate(row?.fechaRecepcion),
        sortable: true,
      },
      {
        name: "Entrega",
        selector: (row) => fmtDate(row?.fechaEntrega),
        sortable: true,
      },
      {
        name: "Anticipo",
        selector: (row) =>
          typeof row.anticipo === "number"
            ? `$${row.anticipo.toFixed(2)}`
            : "$0.00",
        sortable: true,
        center: true,
      },
      {
        name: "Total",
        selector: (row) =>
          row.total != null
            ? `$${Number(row.total).toFixed(2)}`
            : "PEND SERVICIO",
        sortable: true,
        center: true,
      },
      {
        name: "Status",
        sortable: true,
        cell: (row) => {
          let variant;
          switch (row.status) {
            case "PAGADO":
              variant = "success";
              break;
            case "REVISADA":
              variant = "secondary";
              break;
            case "SERVICIO":
              variant = "primary";
              break;
            default:
              variant = "dark";
          }
          return <span className={`badge bg-${variant}`}>{row.status}</span>;
        },
      },
      {
        name: "Acciones",
        ignoreRowClick: true,
        style: { overflow: "visible" },
        cell: (row) => (
          <>
            {row.status === "CREADA" && (
              <button
                className="btn btn-outline-secondary btn-sm me-1"
                onClick={() => {
                  setModalTitle("Servicios / Cambiar Status");
                  setModalContent(
                    <AddServicios
                      orden={row}
                      onClose={() => setShowModal(false)}
                      setShowModal={setShowModal}
                    />
                  );
                  setShowModal(true);
                }}
              >
                <FontAwesomeIcon icon={faListCheck} />
              </button>
            )}
            <button
              className="btn btn-outline-primary btn-sm me-1"
              onClick={() => {
                setModalTitle(`Información Orden: ${row.folio}`);
                setModalContent(<DetalleOrdenTrabajo orden={row} />);
                setShowModal(true);
              }}
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
            {row.status === "SERVICIO" && (
              <button
                className="btn btn-outline-success btn-sm"
                onClick={() => {
                  setModalTitle("Finalizar Orden de Trabajo");
                  setModalContent(
                    <FinalizarOrden
                      orden={row}
                      setShowModal={setShowModal}
                      onClose={() => setShowModal(false)}
                      onUpdated={() => setShowModal(false)}
                    />
                  );
                  setShowModal(true);
                }}
              >
                <FontAwesomeIcon icon={faMoneyBill} />
              </button>
            )}
            {userRole === "ADMIN" && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => {
                  setModalTitle("Confirmar Eliminación");
                  setModalContent(
                    <ConfirmarEliminacion orden={row} setShow={setShowModal} />
                  );
                  setShowModal(true);
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            )}
          </>
        ),
      },
    ],
    [userRole]
  );

  const filteredItems = useMemo(
    () =>
      ordenes.filter((o) => {
        const term = filterText.toLowerCase();

        const nombreCompleto = [
          o?.cliente?.nombre,
          o?.cliente?.apellidoPaterno,
          o?.cliente?.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          (o.folio || "").toLowerCase().includes(term) ||
          nombreCompleto.includes(term) ||
          (o.status || "").toLowerCase().includes(term)
        );
      }),
    [ordenes, filterText]
  );

  const SubHeaderComponent = useMemo(
    () => (
      <div className="d-flex w-100 align-items-center">
        <div className="input-group me-2">
          <span className="input-group-text">
            <FontAwesomeIcon icon={faListCheck} />
          </span>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar folio, cliente o status..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <button
          className="btn btn-success btn-sm"
          onClick={() => {
            setModalTitle("Registrar Orden de Trabajo");
            setModalContent(
              <RegistroOrdenServicio setShowModal={setShowModal} />
            );
            setShowModal(true);
          }}
        >
          <FontAwesomeIcon icon={faCirclePlus} /> Nueva Orden
        </button>
      </div>
    ),
    [filterText]
  );

  const customStyles = useMemo(
    () => ({
      table: { style: { border: "1px solid #dee2e6" } },
      headRow: { style: { borderBottom: "1px solid #dee2e6" } },
      rows: { style: { borderBottom: "1px solid #dee2e6" } },
      pagination: { style: { borderTop: "1px solid #dee2e6" } },
    }),
    []
  );

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <DataTable
            title="Órdenes de Trabajo"
            columns={columns}
            data={filteredItems}
            progressPending={loading && ordenes.length === 0}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 15, 20]}
            subHeader
            subHeaderComponent={SubHeaderComponent}
            persistTableHead
            highlightOnHover
            responsive
            customStyles={customStyles}
          />

          {hasMore && (
            <div className="text-center my-3">
              <button
                className="btn btn-outline-primary"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Cargando..." : "Cargar más"}
              </button>
            </div>
          )}
        </div>
      </div>

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

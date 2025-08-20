// src/pages/OrdenesTrabajo.jsx
import React, {
  useEffect,
  useState,
  useMemo,
  useContext,
  useCallback,
} from "react";
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

// Services (listar + buscar)
import {
  obtenerOrdenesTrabajo,
  buscarOrdenesTrabajo,
} from "../../services/ordenesTrabajoService";

// --- Utils de búsqueda local (para modo "listar") ---
const normalize = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const digitsOnly = (s) => (s ?? "").toString().replace(/\D+/g, "");

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // Paginación cursor-based
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null); // { cursorSort, cursorId } | null

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  const { userRole } = useContext(AuthContext);

  // Helpers de fecha (defensivos: string o Timestamp)
  const fmtDate = useCallback((v) => {
    const d = v?.toDate?.() ?? (v ? new Date(v) : null);
    return d ? d.toLocaleDateString() : "-";
  }, []);

  // Debounce del término
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(filterText.trim()), 350);
    return () => clearTimeout(t);
  }, [filterText]);

  const isSearching = debouncedTerm.length > 0;

  // Carga inicial o recarga (primera página)
  const loadFirstPage = useCallback(async () => {
    try {
      setLoading(true);
      const { ordenes, hasMore, nextCursor } = await (isSearching
        ? buscarOrdenesTrabajo({ q: debouncedTerm, limit: 50 })
        : obtenerOrdenesTrabajo({ limit: 100 }));
      setOrdenes(ordenes || []);
      setHasMore(!!hasMore);
      setNextCursor(nextCursor || null);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar órdenes.");
    } finally {
      setLoading(false);
    }
  }, [isSearching, debouncedTerm]);

  // Cargar más (siguiente página)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    try {
      setLoadingMore(true);
      const {
        ordenes: extra,
        hasMore: more,
        nextCursor: cursor,
      } = await (isSearching
        ? buscarOrdenesTrabajo({
            q: debouncedTerm,
            limit: 20,
            cursorSort: nextCursor?.cursorSort,
            cursorId: nextCursor?.cursorId,
          })
        : obtenerOrdenesTrabajo({
            limit: 20,
            cursorSort: nextCursor?.cursorSort,
            cursorId: nextCursor?.cursorId,
          }));
      setOrdenes((prev) => [...prev, ...(extra || [])]);
      setHasMore(!!more);
      setNextCursor(cursor || null);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar más órdenes.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, isSearching, debouncedTerm, nextCursor]);

  // Montaje / cambios de modo búsqueda
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // Al cerrar modal, refrescar primera página (para ver cambios) -> evita loop
  useEffect(() => {
    if (!showModal) {
      const t = setTimeout(() => loadFirstPage(), 150);
      return () => clearTimeout(t);
    }
  }, [showModal, loadFirstPage]);

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
    [userRole, fmtDate]
  );

  // Filtrado local SOLO en modo "listar" (no en modo búsqueda)
  const filteredItems = useMemo(() => {
    if (isSearching) return ordenes; // backend ya filtró
    const term = normalize(filterText);
    if (!term) return ordenes;

    return ordenes.filter((o) => {
      const nombreCompleto = normalize(
        [
          o?.cliente?.nombre,
          o?.cliente?.apellidoPaterno,
          o?.cliente?.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(" ")
      );
      const telefonos = Array.isArray(o?.cliente?.telefonos)
        ? o.cliente.telefonos.map(digitsOnly).join(" ")
        : digitsOnly(o?.cliente?.telefono);
      const dirObj = o?.cliente?.direccion;
      const direccion = Array.isArray(dirObj)
        ? normalize(dirObj.join(" "))
        : typeof dirObj === "object" && dirObj !== null
        ? normalize(Object.values(dirObj).filter(Boolean).join(" "))
        : normalize(dirObj);

      const folio = normalize(o?.folio);
      const status = normalize(o?.status);
      const termDigits = digitsOnly(term);

      const haystack = [
        folio,
        nombreCompleto,
        direccion,
        status,
        telefonos,
      ].join(" ");
      return (
        haystack.includes(term) ||
        (termDigits && telefonos.includes(termDigits))
      );
    });
  }, [ordenes, filterText, isSearching]);

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
            placeholder="Buscar por folio, nombre, teléfono, dirección o status..."
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
            data={isSearching ? ordenes : filteredItems}
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

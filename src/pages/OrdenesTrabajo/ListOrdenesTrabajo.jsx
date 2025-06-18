// src/pages/OrdenesTrabajo.jsx
import React, { useEffect, useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faListCheck,
  faEye,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";

import AddServicios from "./mods/addServicios";
import DetalleOrdenTrabajo from "./DetalleOrdenTrabajo";
import RegistroOrdenServicio from "./RegistroOrdenServicio";
import FinalizarOrden from "./mods/finalizarOrden";
import BasicModal from "../../components/BasicModal/BasicModal";
import { obtenerOrdenesTrabajo } from "../../services/ordenesTrabajoService";

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  // (Re)carga las órdenes al montar y cada vez que se cierra el modal
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await obtenerOrdenesTrabajo();
        setOrdenes(data);
      } catch {
        toast.error("Error al cargar órdenes de trabajo");
      } finally {
        setLoading(false);
      }
    })();
  }, [showModal]);

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
          [row.cliente.nombre, row.cliente.apellidoPaterno]
            .filter(Boolean)
            .join(" "),
        sortable: true,
        minWidth: "180px",
      },
      {
        name: "Recepción",
        selector: (row) => new Date(row.fechaRecepcion).toLocaleDateString(),
        sortable: true,
      },
      {
        name: "Entrega",
        selector: (row) =>
          row.fechaEntrega
            ? new Date(row.fechaEntrega).toLocaleDateString()
            : "-",
        sortable: true,
      },
      {
        name: "Anticipo",
        selector: (row) => `$${row.anticipo.toFixed(2)}`,
        sortable: true,
        center: true,
      },
      {
        name: "Total",
        selector: (row) =>
          row.total != null ? `$${row.total.toFixed(2)}` : "PEND SERVICIO",
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
                      onUpdated={() => setShowModal(false)}
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
          </>
        ),
      },
    ],
    []
  );

  const filteredItems = useMemo(
    () =>
      ordenes.filter((o) => {
        const term = filterText.toLowerCase();
        return (
          o.folio.toLowerCase().includes(term) ||
          o.cliente.nombre.toLowerCase().includes(term) ||
          o.status.toLowerCase().includes(term)
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
            progressPending={loading}
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
        </div>
      </div>

      {/* al cerrar, dispara recarga en useEffect */}
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

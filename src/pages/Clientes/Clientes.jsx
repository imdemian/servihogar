import React, { useEffect, useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faPenSquare,
  faSearch,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import RegistroClientes from "./Registro.clientes";
import EliminarCliente from "./Eliminacion.clientes";
import BasicModal from "../../components/BasicModal/BasicModal";
import { obtenerClientes } from "../../services/clientesService";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  // Fetch clientes (re-run when modal closes to refresh list)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await obtenerClientes();
        setClientes(data);
      } catch {
        toast.error("Error al cargar clientes");
      } finally {
        setLoading(false);
      }
    })();
  }, [showModal]);

  // Columns definition without invalid DOM props
  const columns = useMemo(
    () => [
      {
        name: "Nombre completo",
        selector: (row) =>
          [row.nombre, row.apellidoPaterno, row.apellidoMaterno]
            .filter(Boolean)
            .join(" "),
        sortable: true,
      },
      {
        name: "Teléfono",
        selector: (row) => row.telefono || "-",
        sortable: true,
      },
      {
        name: "Dirección",
        selector: (row) => row.direccion || "-",
        sortable: true,
        // control width instead of `grow`
        minWidth: "200px",
      },
      {
        name: "Estado",
        selector: (row) => row.estado,
        sortable: true,
      },
      {
        name: "Acciones",
        cell: (row) => (
          <>
            <button
              className="btn btn-outline-primary btn-sm me-1"
              onClick={() => {
                setModalTitle("Editar Cliente");
                setModalContent(
                  <RegistroClientes cliente={row} setShowModal={setShowModal} />
                );
                setShowModal(true);
              }}
            >
              <FontAwesomeIcon icon={faPenSquare} />
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                setModalTitle("Eliminar Cliente");
                setModalContent(
                  <EliminarCliente
                    cliente={row}
                    onDeleteSuccess={() => setShowModal(false)}
                    onCancel={() => setShowModal(false)}
                  />
                );
                setShowModal(true);
              }}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          </>
        ),
        ignoreRowClick: true,
        // allow overflow of the buttons
        style: { overflow: "visible" },
      },
    ],
    []
  );

  // Filtered data
  const filteredItems = clientes.filter((c) => {
    const term = filterText.toLowerCase();
    const fullName = [c.nombre, c.apellidoPaterno, c.apellidoMaterno]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      fullName.includes(term) ||
      (c.telefono || "").includes(term) ||
      (c.direccion || "").toLowerCase().includes(term)
    );
  });

  // Subheader: search + "Nuevo" button
  const SubHeaderComponent = useMemo(
    () => (
      <div className="d-flex w-100 align-items-center">
        <div className="input-group me-2">
          <span className="input-group-text">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <button
          className="btn btn-success btn-sm"
          onClick={() => {
            setModalTitle("Registrar Cliente");
            setModalContent(<RegistroClientes setShowModal={setShowModal} />);
            setShowModal(true);
          }}
        >
          <FontAwesomeIcon icon={faCirclePlus} /> Nuevo
        </button>
      </div>
    ),
    [filterText]
  );

  // Custom table styles adding borders
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
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <DataTable
            title="Clientes"
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

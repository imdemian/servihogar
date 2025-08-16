import React, { useEffect, useMemo, useState } from "react";
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
import {
  obtenerClientesPaginado,
  buscarClientes,
} from "../../services/clientesService";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // búsqueda
  const [filterText, setFilterText] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [searchField, setSearchField] = useState("nombre"); // 'nombre' | 'direccion'
  const [isSearching, setIsSearching] = useState(false);

  // paginación con cursor
  const [cursor, setCursor] = useState(null);
  const PAGE_SIZE = 100;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  // Debounce del texto de búsqueda (400 ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(filterText.trim()), 400);
    return () => clearTimeout(t);
  }, [filterText]);

  // Primera carga o cuando se cierra modal (refrescar)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { items, nextCursor } = await obtenerClientesPaginado({
          limit: PAGE_SIZE,
        });
        setClientes(items);
        setCursor(nextCursor);
        setIsSearching(false);
      } catch (e) {
        console.error(e);
        toast.error("Error al cargar clientes");
      } finally {
        setLoading(false);
      }
    })();
  }, [showModal]);

  // Efecto de búsqueda (cuando cambia debouncedTerm o searchField)
  useEffect(() => {
    (async () => {
      // si no hay término, recarga listado normal
      if (!debouncedTerm) {
        setLoading(true);
        try {
          const { items, nextCursor } = await obtenerClientesPaginado({
            limit: PAGE_SIZE,
          });
          setClientes(items);
          setCursor(nextCursor);
          setIsSearching(false);
        } catch (e) {
          console.error(e);
          toast.error("Error al cargar clientes");
        } finally {
          setLoading(false);
        }
        return;
      }

      // hay término: búsqueda
      setLoading(true);
      try {
        const { items, nextCursor } = await buscarClientes({
          q: debouncedTerm,
          field: searchField,
          limit: PAGE_SIZE,
        });
        setClientes(items);
        setCursor(nextCursor);
        setIsSearching(true);
      } catch (e) {
        console.error(e);
        toast.error("Error en la búsqueda");
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedTerm, searchField]);

  async function handleLoadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      let res;
      if (isSearching && debouncedTerm) {
        res = await buscarClientes({
          q: debouncedTerm,
          field: searchField,
          limit: PAGE_SIZE,
          cursor,
        });
      } else {
        res = await obtenerClientesPaginado({ limit: PAGE_SIZE, cursor });
      }
      setClientes((prev) => [...prev, ...(res.items || [])]);
      setCursor(res.nextCursor || null);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar más");
    } finally {
      setLoading(false);
    }
  }

  // Columnas
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
        style: { overflow: "visible" },
      },
    ],
    []
  );

  // Subheader: campo + búsqueda + botón Nuevo
  const SubHeaderComponent = useMemo(
    () => (
      <div className="d-flex w-100 align-items-center flex-wrap gap-2">
        <div className="input-group me-2" style={{ maxWidth: 420 }}>
          <span className="input-group-text">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder={`Buscar por ${
              searchField === "nombre" ? "nombre" : "dirección"
            }...`}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <select
            className="form-select form-select-sm"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            style={{ maxWidth: 140 }}
          >
            <option value="nombre">Nombre</option>
            <option value="direccion">Dirección</option>
          </select>
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

        <div className="ms-auto">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleLoadMore}
            disabled={!cursor || loading}
            title={!cursor ? "No hay más resultados" : "Cargar más"}
          >
            {loading
              ? "Cargando..."
              : cursor
              ? "Cargar más"
              : "Sin más resultados"}
          </button>
        </div>
      </div>
    ),
    [filterText, searchField, cursor, loading]
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
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <DataTable
            title="Clientes"
            columns={columns}
            data={clientes}
            progressPending={loading}
            // dejamos la paginación del DataTable en cliente,
            // y usamos "Cargar más" para traer más del backend
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

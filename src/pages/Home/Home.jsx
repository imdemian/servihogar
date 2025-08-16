// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from "react";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsToEye,
  faCheck,
  faEye,
  faFileArrowDown,
  faListCheck,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";

import BasicModal from "../../components/BasicModal/BasicModal";
import RegistroClientes from "../Clientes/Registro.clientes";
import RegistroOrdenServicio from "../OrdenesTrabajo/RegistroOrdenServicio";
import RegistroCotizaciones from "../Cotizaciones/RegistroCotizaciones";
import DetalleOrdenTrabajo from "../OrdenesTrabajo/DetalleOrdenTrabajo";
import AddServicios from "../OrdenesTrabajo/mods/addServicios";
import FinalizarOrden from "../OrdenesTrabajo/mods/finalizarOrden";
import VerEquiposServicios from "../OrdenesTrabajo/mods/verEquiposServicios";
import CambioStatusCot from "../Cotizaciones/CambioStatusCot";

import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { AuthContext } from "../../utils/context";
import { obtenerOrdenesTrabajoGarantia } from "../../services/ordenesTrabajoService";
import "./Home.scss";
import AgregarServicioGarantia from "../OrdenesTrabajo/mods/agregarServicioGarantia";
import { generarNotaOrdenServicio } from "../../services/pdfs/notaOrdenPDFgen";

export default function Home() {
  const { user } = useContext(AuthContext);

  const [ordenesServicio, setOrdenesServicio] = useState([]);
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState([]);
  const [garantias30, setGarantias30] = useState([]); // 👈 NUEVO

  const [loading, setLoading] = useState(true);
  const [loadingGarantias, setLoadingGarantias] = useState(true); // 👈 NUEVO

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);
  const [modalSize, setModalSize] = useState("md");

  const closeModal = () => setShowModal(false);

  const openModal = ({ title, content, size = "md" }) => {
    setModalTitle(title);
    setModalContent(content);
    setModalSize(size);
    setShowModal(true);
  };

  const abrirRegistrarCliente = () =>
    openModal({
      title: "Registrar Cliente",
      content: (
        <RegistroClientes onClose={closeModal} setShowModal={setShowModal} />
      ),
      size: "lg",
    });

  const abrirRegistrarOrden = () =>
    openModal({
      title: "Registrar Orden de Servicio",
      content: (
        <RegistroOrdenServicio
          onClose={closeModal}
          setShowModal={setShowModal}
        />
      ),
      size: "lg",
    });

  const abrirCrearCotizacion = () =>
    openModal({
      title: "Crear Cotización",
      content: (
        <RegistroCotizaciones onClose={closeModal} setShow={setShowModal} />
      ),
      size: "lg",
    });

  const abrirVerServicios = (orden) =>
    openModal({
      title: `Servicios & Equipos - ${orden.folio}`,
      content: (
        <VerEquiposServicios
          folio={orden.folio}
          servicios={orden.servicios || []}
          equipos={orden.equipos || []}
        />
      ),
      size: "sm",
    });

  // 🔁 Escuchar cambios en tiempo real (lo de siempre que ya tienes)
  useEffect(() => {
    if (!user) return;

    const unsubOrdenes = onSnapshot(
      collection(db, "ordenesTrabajo"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((o) =>
            ["creada", "servicio", "pre-servicio"].includes(
              o.status?.toLowerCase()
            )
          );
        setOrdenesServicio(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo órdenes:", error);
        toast.error("Error al cargar órdenes.");
        setLoading(false);
      }
    );

    const unsubCotizaciones = onSnapshot(
      collection(db, "cotizaciones"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((c) => c.status === "PENDIENTE");
        setCotizacionesPendientes(data);
      },
      (error) => {
        console.error("Error obteniendo cotizaciones:", error);
        toast.error("Error al cargar cotizaciones.");
      }
    );

    return () => {
      unsubOrdenes();
      unsubCotizaciones();
    };
  }, [user]);

  // Helpers para formateo
  const formatFecha = (tsOrString) => {
    try {
      if (!tsOrString) return "—";
      // Si viene de Firestore Timestamp con .toDate()
      const d =
        typeof tsOrString?.toDate === "function"
          ? tsOrString.toDate()
          : new Date(tsOrString);
      return d.toLocaleDateString("es-MX");
    } catch {
      return String(tsOrString);
    }
  };

  const mapRowToPdfOrden = (row) => {
    // Ajusta estos campos a tu esquema real
    const clienteNombre =
      row?.cliente?.nombre ||
      row?.clienteNombre ||
      row?.cliente?.displayName ||
      "Cliente";

    const servicios = (row?.servicios || row?.items || []).map((s) => ({
      servicio: s.servicio || s.descripcion || s.concepto || "Servicio",
      cantidad: Number(s.cantidad ?? 1),
      precio: Number(s.precio ?? s.precioUnitario ?? 0),
      total: Number(
        s.total ?? (s.precio ?? s.precioUnitario ?? 0) * (s.cantidad ?? 1)
      ),
    }));

    const totalCalc = servicios.reduce((a, b) => a + Number(b.total || 0), 0);

    return {
      numero: row.folio || row.numero || row.id || "SIN-FOLIO",
      fecha: formatFecha(
        row.fechaEntrega || row.createdAt || row.fechaCreacion
      ),
      cliente: {
        nombre: clienteNombre,
        telefono: row?.cliente?.telefono || row?.telefono || "",
        direccion: row?.cliente?.direccion || row?.direccion || "",
      },
      servicios,
      total: Number(row?.total ?? totalCalc),
      observaciones: row?.observaciones || row?.nota || row?.comentarios || "",
    };
  };

  const handleDescargarNota = (row) => {
    try {
      const ordenPDF = mapRowToPdfOrden(row);
      generarNotaOrdenServicio(ordenPDF);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar la nota PDF.");
    }
  };

  // 👇 NUEVO: cargar garantías (PAGADO con fechaEntrega ≤30 días) desde el backend
  useEffect(() => {
    const loadGarantias = async () => {
      try {
        setLoadingGarantias(true);
        const { ordenes } = await obtenerOrdenesTrabajoGarantia(); // GET /ordenesTrabajo/pendientesYGarantia
        setGarantias30(Array.isArray(ordenes) ? ordenes : []);
      } catch (e) {
        console.error(e);
        toast.error("Error al cargar órdenes en garantía.");
      } finally {
        setLoadingGarantias(false);
      }
    };
    if (user) loadGarantias();
  }, [user]);

  const columnsOrdenes = [
    { name: "Folio", selector: (row) => row.folio, sortable: true },
    {
      name: "Cliente",
      selector: (row) => row.cliente?.nombre || "-",
      sortable: true,
    },
    {
      name: "Ver servicios",
      cell: (row) => (
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => abrirVerServicios(row)}
        >
          <FontAwesomeIcon icon={faArrowsToEye} />
        </button>
      ),
      ignoreRowClick: true,
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
              onClick={() =>
                openModal({
                  title: "Servicios / Cambiar Status",
                  content: (
                    <AddServicios
                      orden={row}
                      onClose={closeModal}
                      setShowModal={setShowModal}
                    />
                  ),
                  size: "lg",
                })
              }
            >
              <FontAwesomeIcon icon={faListCheck} />
            </button>
          )}
          <button
            className="btn btn-outline-primary btn-sm me-1"
            onClick={() =>
              openModal({
                title: `Detalle Orden: ${row.folio}`,
                content: <DetalleOrdenTrabajo orden={row} />,
                size: "lg",
              })
            }
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          {row.status === "SERVICIO" && (
            <button
              className="btn btn-outline-success btn-sm"
              onClick={() =>
                openModal({
                  title: "Finalizar Orden",
                  content: (
                    <FinalizarOrden
                      orden={row}
                      onClose={closeModal}
                      setShowModal={setShowModal}
                    />
                  ),
                  size: "lg",
                })
              }
            >
              <FontAwesomeIcon icon={faMoneyBill} />
            </button>
          )}
        </>
      ),
    },
    { name: "Status", selector: (row) => row.status || "-", sortable: true },
    {
      name: "Fecha",
      selector: (row) =>
        row.fechaRecepcion
          ? new Date(row.fechaRecepcion).toLocaleDateString()
          : "-",
      sortable: true,
    },
  ];

  const columnsCotizaciones = [
    { name: "No.", selector: (row) => row.noCotizacion, sortable: true },
    {
      name: "Cliente",
      selector: (row) =>
        row.tituloCliente && row.nombreCliente
          ? `${row.tituloCliente} ${row.nombreCliente}`
          : row.nombreCliente || "-",
      sortable: true,
    },
    {
      name: "Total",
      selector: (row) => (row.total != null ? `$${row.total.toFixed(2)}` : "-"),
    },
    {
      name: "Fecha",
      selector: (row) =>
        row.fechaCotizacion
          ? new Date(row.fechaCotizacion).toLocaleDateString()
          : "-",
      sortable: true,
    },
    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="btn btn-outline-success btn-sm"
          onClick={() =>
            openModal({
              title: "Aceptar Cotización",
              content: (
                <CambioStatusCot cotizacion={row} setShow={setShowModal} />
              ),
              size: "lg",
            })
          }
        >
          <FontAwesomeIcon icon={faCheck} />
        </button>
      ),
    },
  ];

  // Columnas para Garantía (últimos 90 días)
  const columnsGarantia = [
    { name: "Folio", selector: (row) => row.folio, sortable: true },
    {
      name: "Cliente",
      selector: (row) =>
        [row?.cliente?.nombre, row?.cliente?.apellidoPaterno]
          .filter(Boolean)
          .join(" ") || "-",
      sortable: true,
    },
    {
      name: "Entregada",
      selector: (row) => {
        const v = row.fechaEntrega;
        const d =
          typeof v?.toDate === "function"
            ? v.toDate()
            : typeof v === "string"
            ? new Date(v)
            : v instanceof Date
            ? v
            : null;
        return d ? d.toLocaleDateString() : "-";
      },
      sortable: true,
    },
    {
      name: "Días desde entrega",
      selector: (row) => {
        const v = row.fechaEntrega;
        const d =
          typeof v?.toDate === "function"
            ? v.toDate()
            : typeof v === "string"
            ? new Date(v)
            : v instanceof Date
            ? v
            : null;
        if (!d) return "-";
        const diff = Math.floor(
          (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
        );
        return `${diff} días`;
      },
    },
    {
      name: "Acciones",
      ignoreRowClick: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() =>
              openModal({
                title: `Detalle Orden: ${row.folio}`,
                content: <DetalleOrdenTrabajo orden={row} />,
                size: "lg",
              })
            }
          >
            <FontAwesomeIcon icon={faEye} />
          </button>

          {/* NUEVO: Agregar servicio en garantía */}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() =>
              openModal({
                title: `Agregar servicio (garantía) — ${row.folio}`,
                content: (
                  <AgregarServicioGarantia
                    orden={row}
                    onDone={() => {
                      toast.success("Servicio agregado a la orden.");
                      closeModal();
                    }}
                  />
                ),
                size: "md",
              })
            }
          >
            <FontAwesomeIcon icon={faListCheck} />
          </button>

          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handleDescargarNota(row)}
            title="Descargar nota PDF"
          >
            <FontAwesomeIcon icon={faFileArrowDown} className="me-1" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-toolbar">
        <button
          className="btn btn-primary me-2"
          onClick={abrirRegistrarCliente}
        >
          Registrar Cliente
        </button>
        <button className="btn btn-primary me-2" onClick={abrirRegistrarOrden}>
          Registrar Orden
        </button>
        <button className="btn btn-primary" onClick={abrirCrearCotizacion}>
          Crear Cotización
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>Órdenes de Servicio</h2>
          <DataTable
            columns={columnsOrdenes}
            data={ordenesServicio}
            pagination
            highlightOnHover
            dense
          />
        </div>

        <div className="dashboard-panel">
          <h2>Cotizaciones Pendientes</h2>
          <DataTable
            columns={columnsCotizaciones}
            data={cotizacionesPendientes}
            pagination
            highlightOnHover
            dense
          />
        </div>

        {/*  NUEVO PANEL de Garantía */}
        <div className="dashboard-panel">
          <h2>Órdenes en garantía (últimos 90 días)</h2>
          {loadingGarantias ? (
            <p>Cargando garantías...</p>
          ) : (
            <DataTable
              columns={columnsGarantia}
              data={garantias30}
              pagination
              highlightOnHover
              dense
            />
          )}
        </div>
      </div>

      <BasicModal
        show={showModal}
        setShow={setShowModal}
        onClose={closeModal}
        title={modalTitle}
        size={modalSize}
      >
        {modalContent}
      </BasicModal>
    </div>
  );
}

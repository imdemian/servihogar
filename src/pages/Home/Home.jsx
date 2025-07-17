// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from "react";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsToEye,
  faCheck,
  faEye,
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

import "./Home.scss";

export default function Home() {
  const { user } = useContext(AuthContext);

  const [ordenesServicio, setOrdenesServicio] = useState([]);
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // 🔁 Escuchar cambios en tiempo real
  useEffect(() => {
    if (!user) return;

    const unsubOrdenes = onSnapshot(
      collection(db, "ordenesTrabajo"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((o) =>
            ["creada", "en servicio", "pre-servicio"].includes(
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

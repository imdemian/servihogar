// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faListCheck,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";

import BasicModal from "../../components/BasicModal/BasicModal";
import { obtenerOrdenesTrabajoPendientes } from "../../services/ordenesTrabajoService";
import { obtenerCotizacionesPendientes } from "../../services/cotizacionService";
import RegistroClientes from "../Clientes/Registro.clientes";
import RegistroOrdenServicio from "../OrdenesTrabajo/RegistroOrdenServicio";
import RegistroCotizaciones from "../Cotizaciones/RegistroCotizaciones";
import DetalleOrdenTrabajo from "../OrdenesTrabajo/DetalleOrdenTrabajo";
import AddServicios from "../OrdenesTrabajo/mods/addServicios";
import FinalizarOrden from "../OrdenesTrabajo/mods/finalizarOrden";
import VerEquiposServicios from "../OrdenesTrabajo/mods/verEquiposServicios";
import "./Home.scss";

export default function Home() {
  const [ordenesServicio, setOrdenesServicio] = useState([]);
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizado, setActualizado] = useState(false);

  // Estados del modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);
  const [modalSize, setModalSize] = useState("md");

  // Función para cargar datos
  const fetchData = async () => {
    setLoading(true);
    try {
      const ordenes = await obtenerOrdenesTrabajoPendientes([
        "creada",
        "en servicio",
      ]);
      const cotizaciones = await obtenerCotizacionesPendientes();
      setOrdenesServicio(ordenes);
      setCotizacionesPendientes(cotizaciones);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, []);

  // 2) Vuelve a cargar siempre que cambie `actualizado`
  useEffect(() => {
    if (actualizado) {
      fetchData();
      // Reseteamos para que no se quede “true” permanentemente
      setActualizado(false);
    }
  }, [actualizado]);

  // Abrir modal genérico
  const openModal = ({ title, content, size = "md" }) => {
    setModalTitle(title);
    setModalContent(content);
    setModalSize(size);
    setShowModal(true);
  };

  // Función para abrir el modal de agragar servicios

  const closeModal = () => setShowModal(false);

  // Acciones para abrir distintos modales
  const abrirRegistrarCliente = () =>
    openModal({
      title: "Registrar Cliente",
      content: (
        <RegistroClientes
          onClose={closeModal}
          setActualizado={setActualizado}
          setShowModal={setShowModal}
        />
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
          setActualizado={setActualizado}
        />
      ),
      size: "lg",
    });

  const abrirCrearCotizacion = () =>
    openModal({
      title: "Crear Cotización",
      content: (
        <RegistroCotizaciones
          onClose={closeModal}
          setActualizado={setActualizado}
          setShowModal={setShowModal}
        />
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

  // Columnas de órdenes
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
          Ver servicios
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
                      onUpdated={closeModal}
                      setActualizado={setActualizado}
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
                      setActualizado={setActualizado}
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

  // Columnas de cotizaciones
  const columnsCotizaciones = [
    { name: "ID", selector: (row) => row.id, sortable: true },
    {
      name: "Cliente",
      selector: (row) => row.clienteNombre || "-",
      sortable: true,
    },
    {
      name: "Total",
      selector: (row) => (row.total != null ? `$${row.total.toFixed(2)}` : "-"),
    },
    {
      name: "Fecha",
      selector: (row) =>
        row.fecha ? new Date(row.fecha).toLocaleDateString() : "-",
      sortable: true,
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

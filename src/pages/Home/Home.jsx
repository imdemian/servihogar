// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import BasicModal from "../../components/BasicModal/BasicModal";
import { obtenerOrdenesTrabajo } from "../../services/ordenesTrabajoService";
import { obtenerCotizacionesPendientes } from "../../services/cotizacionService";
import "./Home.scss";
import RegistroClientes from "../Clientes/Registro.clientes";
import RegistroOrdenServicio from "../OrdenesTrabajo/RegistroOrdenServicio";
import RegistroCotizaciones from "../Cotizaciones/RegistroCotizaciones";

const Home = () => {
  const [ordenesServicio, setOrdenesServicio] = useState([]);
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado genérico para el modal
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    content: null,
  });

  const openModal = ({ title, content }) => {
    setModalConfig({ show: true, title, content });
  };

  const closeModal = () => {
    setModalConfig({ show: false, title: "", content: null });
  };

  // Funciones para abrir formularios en modal
  const abrirRegistrarCliente = () =>
    openModal({
      title: "Registrar Cliente",
      content: <RegistroClientes setShowModal={closeModal} />,
    });
  const abrirRegistrarOrden = () =>
    openModal({
      title: "Registrar Orden de Servicio",
      content: <RegistroOrdenServicio setShowModal={closeModal} />,
    });
  const abrirCrearFactura = () =>
    openModal({
      title: "Crear Factura",
      content: <RegistroCotizaciones setShowModal={closeModal} />,
    });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const ordenes = await obtenerOrdenesTrabajo(["creada", "en servicio"]);
        const cotizaciones = await obtenerCotizacionesPendientes();
        setOrdenesServicio(ordenes);
        setCotizacionesPendientes(cotizaciones);
      } catch (error) {
        console.error("Error cargando datos del dashboard", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columnsOrdenes = [
    { name: "Folio", selector: (row) => row.folio, sortable: true },
    { name: "Cliente", selector: (row) => row.cliente.nombre, sortable: true },
    {
      name: "Servicio",
      sortable: true,
      cell: (row) => {
        const serviciosRaw = row.servicios;
        if (!serviciosRaw) return <span className="text-muted">-</span>;
        const servicios = Array.isArray(serviciosRaw)
          ? serviciosRaw
          : [serviciosRaw];
        if (servicios.length === 1) {
          const single = servicios[0];
          return <span>{single.servicio || single}</span>;
        }
        // Abrir modal genérico con lista de servicios
        const list = (
          <ul className="list-unstyled mb-0">
            {servicios.map((srv, idx) => (
              <li key={idx}>{srv.servicio || srv}</li>
            ))}
          </ul>
        );
        return (
          <button
            className="btn btn-sm btn-link p-0"
            onClick={() => openModal({ title: "Servicios", content: list })}
          >
            Ver ({servicios.length})
          </button>
        );
      },
    },
    { name: "Status", selector: (row) => row.status, sortable: true },
    {
      name: "Fecha",
      selector: (row) => new Date(row.fecha).toLocaleDateString(),
      sortable: true,
    },
  ];

  const columnsCotizaciones = [
    { name: "ID", selector: (row) => row.id, sortable: true },
    { name: "Cliente", selector: (row) => row.clienteNombre, sortable: true },
    { name: "Total", selector: (row) => `$${row.total?.toFixed(2)}` },
    {
      name: "Fecha",
      selector: (row) => new Date(row.fecha).toLocaleDateString(),
      sortable: true,
    },
  ];

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div>
      {/* Barra de acciones */}
      <div className="dashboard-toolbar">
        <button
          onClick={() => abrirRegistrarCliente()}
          className="btn btn-primary"
        >
          Registrar Cliente
        </button>
        <button
          onClick={() => abrirRegistrarOrden()}
          className="btn btn-primary"
        >
          Registrar Orden de Servicio
        </button>
        <button onClick={() => abrirCrearFactura()} className="btn btn-primary">
          Crear Factura
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

      {/* Modal de servicios */}
      {/* Modal genérico */}
      <BasicModal
        show={modalConfig.show}
        onClose={closeModal}
        title={modalConfig.title}
        size={modalConfig.size || "md"}
        setShow={closeModal}
      >
        {modalConfig.content}
      </BasicModal>
    </div>
  );
};

export default Home;

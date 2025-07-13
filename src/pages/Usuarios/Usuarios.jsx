import { useCallback, useEffect, useMemo, useState } from "react";
import BasicModal from "../../components/BasicModal/BasicModal";
import { obtenerUsuarios } from "../../services/usuariosService";
import DataTable from "react-data-table-component";
import RegistroUsuario from "./Registro.Usuario";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import EliminarUsuario from "./Eliminar.Usuario";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);

  //Propiedades del modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [contentModal, setContentModal] = useState(null);
  const [size, setSize] = useState("lg");

  // Función para abrir el modal para registrar un usuario
  const registrarUsuarios = (content) => {
    setContentModal(content);
    setModalTitle("Registrar Usuario");
    setSize("md");
    setShowModal(true);
  };

  // Función para abrir el modal para editar un usuario
  const handleEdit = (content) => {
    setContentModal(content);
    setModalTitle("Editar Usuario");
    setSize("md");
    setShowModal(true);
  };

  const handleDelete = useCallback(
    (usuario) => {
      setContentModal(
        <EliminarUsuario usuario={usuario} setShow={setShowModal} />
      );
      setModalTitle("Eliminar Usuario");
      setSize("md");
      setShowModal(true);
    },
    [setContentModal, setModalTitle, setSize, setShowModal]
  );

  useEffect(() => {
    cargarUsuarios();
  }, [showModal]);

  const cargarUsuarios = async () => {
    try {
      let data = await obtenerUsuarios(); // Asegúrate de tener esta función definida
      let lista = Array.isArray(data)
        ? data
        : Array.isArray(data.usuarios)
        ? data.usuarios
        : Array.isArray(data.data)
        ? data.data
        : Object.values(data);
      setUsuarios(lista);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setUsuarios([]);
    }
  };

  const columns = useMemo(
    () => [
      {
        name: "User",
        selector: (row) => row.email,
        sortable: true,
      },
      {
        name: "Nombre",
        selector: (row) => row.nombre,
        sortable: true,
      },
      {
        name: "Rol",
        selector: (row) => row.rol,
        sortable: true,
      },
      {
        name: "Empleado",
        selector: (row) => row.empleado?.id || "N/A",
        sortable: true,
      },
      {
        name: "Acciones",
        cell: (row) => (
          <div className="d-flex justify-content-around">
            <button
              className="btn btn-sm btn-primary me-2"
              onClick={() =>
                handleEdit(
                  <RegistroUsuario usuario={row} setShow={setShowModal} />
                )
              }
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDelete(row)}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <div className="container mt-4">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h1>Usuarios</h1>
        <button
          className="btn btn-primary"
          onClick={() =>
            registrarUsuarios(
              <RegistroUsuario usuario={null} setShow={setShowModal} />
            )
          }
        >
          Registrar Usuario
        </button>
      </div>

      <DataTable
        columns={columns}
        data={usuarios}
        pagination
        highlightOnHover
        responsive
      />
      <BasicModal
        show={showModal}
        setShow={setShowModal}
        title={modalTitle}
        size={size || "lg"}
      >
        {contentModal}
      </BasicModal>
    </div>
  );
};

export default Usuarios;

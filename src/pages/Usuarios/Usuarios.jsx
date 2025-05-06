import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { obtenerUsuarios } from "../../services/usuariosService";
import BasicModal from "../../components/BasicModal/BasicModal";
import RegistroUsuarios from "./registro.usuarios";
import "./Usuarios.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faPenSquare,
  faSearch,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { obtenerEmpleados } from "../../services/empleadosService";

const Usuarios = () => {
  // Estado para la lista de usuarios, empleados, loading, filtro
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  // Propiedades para el modal
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  // Abrir el modal para registrar un nuevo usuario
  const abrirModalRegistro = (content, editar) => {
    setShowModal(true);
    setModalContent(content);
    setModalTitle(!editar ? "Registro de Usuario" : "Editar Usuario");
  };

  // Carga usuarios y empleados
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [respUsuarios, respEmpleados] = await Promise.all([
        obtenerUsuarios(),
        obtenerEmpleados(),
      ]);
      console.log(respUsuarios, respEmpleados);
      setUsuarios(respUsuarios);
      setEmpleados(respEmpleados);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      toast.error("Error al cargar usuarios ó empleados");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [showModal]);

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  // Helper para encontrar el nombre completo del empleado
  const nombreEmpleado = (empleadoId) => {
    const e = empleados.find((emp) => emp._id === empleadoId);
    return e ? `${e.nombre} ${e.apellidoPaterno}` : "-";
  };

  return (
    <div className="container py-4">
      {/* Card con la tabla de usuarios */}
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Usuarios</h5>
          <button
            className="btn btn-success btn-sm"
            onClick={() =>
              abrirModalRegistro(
                <RegistroUsuarios setShowModal={setShowModal} />
              )
            }
          >
            <FontAwesomeIcon icon={faCirclePlus} className="me-1" />
            Agregar usuario
          </button>
        </div>

        <div className="input-group mb-3">
          <span className="input-group-text">
            <FontAwesomeIcon icon={faSearch} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar usuario..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
          />
        </div>

        <div className="card-body">
          {cargando ? (
            <div>Cargando...</div>
          ) : usuariosFiltrados.length > 0 ? (
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Empleado</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario._id}>
                    <td>{usuario.email}</td>
                    <td>{usuario.nombre || "-"}</td>
                    <td>
                      {usuario.empleadoId
                        ? nombreEmpleado(usuario.empleadoId)
                        : ""}
                    </td>
                    <td>{usuario.rol}</td>
                    {/* Aquí puedes agregar más campos según tu modelo de usuario */}
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger me-2"
                        // onClick={() => eliminarUsuario(usuario._id)}
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          abrirModalRegistro(
                            <RegistroUsuarios
                              usuario={usuario}
                              setShowModal={setShowModal}
                            />,
                            true
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faPenSquare} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-warning">
              No hay usuarios registrados.
            </div>
          )}
        </div>
      </div>

      {/* Modal para registrar usuario */}
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
};

export default Usuarios;

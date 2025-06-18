import React, { useEffect, useState } from "react";
import { obtenerEmpleados } from "../../services/empleadosService";
import { toast } from "react-toastify";
import {
  faCirclePlus,
  faPenSquare,
  faSearch,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BasicModal from "../../components/BasicModal/BasicModal";
import RegistroEmpleados from "./Registro.empleados";
import EliminarEmpleado from "./Eliminacion.empleado";

const Empleados = () => {
  // Estado para la lista de empleados
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  // Propiedades para el modal
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState(null);
  const [titleModal, setTitleModal] = useState("");

  // Abrir el modal para registrar un nuevo empleado
  const abrirModalRegistro = (content, editar) => {
    setShowModal(true);
    setContent(content);
    setTitleModal(!editar ? "Registro de Empleado" : "Editar Empleado");
  };

  const abrirModalEliminar = (content) => {
    setShowModal(true);
    setContent(content);
    setTitleModal("Eliminar Empleado");
  };

  // Función para cargar los empelados desde el backend
  const cargarEmpleados = async () => {
    try {
      const responseArray = await obtenerEmpleados();
      setEmpleados(responseArray);
    } catch (error) {
      console.error("Error al obtener los empleados: ", error);
      toast.error("Error al obtener los empleados");
    } finally {
      setCargando(false);
    }
  };

  // Cargar empleados al montar el componente
  useEffect(() => {
    cargarEmpleados();
  }, [showModal]);

  // Filtra los empleados por nombre (puedes ajustar el criterio si lo necesitas)
  const empleadosFiltrados = empleados.filter((empleado) =>
    empleado.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Empleados</h5>
          <button
            className="btn btn-success btn-sm"
            onClick={() =>
              abrirModalRegistro(
                <RegistroEmpleados setShowModal={setShowModal} />
              )
            }
          >
            <FontAwesomeIcon icon={faCirclePlus} className="me-1" />
            Agregar empleado
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
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : empleadosFiltrados.length > 0 ? (
            <div>
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Ordenes Asignadas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosFiltrados.map((empleado) => (
                    <tr key={empleado._id}>
                      <td>
                        {empleado.nombre +
                          " " +
                          empleado.apellidoPaterno +
                          " " +
                          empleado.apellidoMaterno || "-"}
                      </td>
                      <td>{empleado.telefono || "-"}</td>
                      <td>{empleado.direccion || "-"}</td>
                      <td>{empleado.ordenesAsignadas || "-"}</td>
                      <td>{empleado.estado ? "activo" : "inactivo"}</td>
                      <td>
                        {/* Aquí puedes agregar botones para editar o eliminar */}
                        <button
                          className="btn btn-outline-primary btn-sm me-1"
                          onClick={() =>
                            abrirModalRegistro(
                              <RegistroEmpleados
                                empleado={empleado}
                                setShowModal={setShowModal}
                              />,
                              true
                            )
                          }
                        >
                          <FontAwesomeIcon icon={faPenSquare} />
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            abrirModalEliminar(
                              <EliminarEmpleado
                                empleado={empleado}
                                setShowModal={setShowModal}
                              />
                            );
                          }}
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-warning">
              No hay empleados registrados.
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar empleado */}
      <BasicModal
        show={showModal}
        setShow={setShowModal}
        title={titleModal}
        size="lg"
      >
        {content}
      </BasicModal>
    </div>
  );
};

export default Empleados;

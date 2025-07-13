import { useEffect, useState } from "react";
import { eliminarUsuario } from "../../services/usuariosService";
import { toast } from "react-toastify";

const EliminarUsuario = ({ usuario, setShow }) => {
  // Inicializar los datos
  const [formData, setFormData] = useState({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    empleado: usuario.empleado,
  });

  // Actualiza formData si la prop 'usuario' cambia (modo edición)
  useEffect(() => {
    if (usuario) {
      setFormData({
        id: usuario.id,
        email: usuario.email || "",
        nombre: usuario.nombre || "",
        rol: usuario.rol || "",
        empleado: usuario.empleado || "",
      });
    }
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await eliminarUsuario(formData.id);
      console.log(response);
      if (response.success) {
        toast.success("Usuario eliminado con éxito");
      }
    } catch (error) {
      console.log(error);
      const msg =
        error.response?.data?.message ||
        "Error al eliminar el usuario. Inténtalo de nuevo.";
      toast.error(msg);
    } finally {
      setShow(false); // Cierra el modal después de eliminar
    }
  };

  return (
    <div>
      <h2>Eliminar Usuario</h2>
      <p className="text-center">
        ¿Estás seguro de que deseas eliminar al usuario {formData.nombre}?
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nombre" className="form-label mt-3">
            Nombre:
          </label>
          <input
            type="text"
            id="nombre"
            value={formData.nombre}
            className="form-control"
            readOnly
            disabled
          />
        </div>
        <div>
          <label htmlFor="email" className="form-label mt-3">
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            className="form-control"
            readOnly
            disabled
          />
        </div>
        <div>
          <label htmlFor="rol" className="form-label mt-3">
            Rol:
          </label>
          <input
            type="text"
            id="rol"
            value={formData.rol}
            className="form-control"
            readOnly
            disabled
          />
        </div>
        <div>
          <label htmlFor="empleado" className="form-label mt-3">
            Empleado:
          </label>
          <input
            type="text"
            id="empleado"
            value={formData.empleado || ""}
            className="form-control"
            readOnly
            disabled
          />
        </div>

        <div className="d-flex justify-content-center mt-4">
          <button type="submit" className="btn btn-danger">
            Eliminar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EliminarUsuario;

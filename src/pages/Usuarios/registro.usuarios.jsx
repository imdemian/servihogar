import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  registrarUsuario,
  actualizarUsuario,
} from "../../services/usuariosService";
import { obtenerEmpleados } from "../../services/empleadosService";

const RegistroUsuarios = ({ setRefreshCheckLogin, usuario, setShowModal }) => {
  // Si se pasa 'usuario' (para editar), usamos sus datos para inicializar el formData; si no, se inician vacíos.
  const [formData, setFormData] = useState({
    usuario: usuario?.usuario || "",
    nombre: usuario?.nombre || "",
    password: "", // Por razones de seguridad, la contraseña no se pre-carga
    rol: usuario?.rol || "",
    estado: usuario?.estado || "",
    // Si existiera otro campo (por ejemplo, empleado), se puede incluir aquí. (Lo tienes deshabilitado en el input)
    empleado: usuario?.empleado || "",
  });
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  // Cargar empleados
  const [empleados, setEmpleados] = useState([]);

  // Actualizar el estado si llega un usuario nuevo como prop (modo editar)
  useEffect(() => {
    if (usuario) {
      setFormData({
        usuario: usuario.usuario || "",
        nombre: usuario.nombre || "",
        password: "", // No pre-cargamos la contraseña en modo edición
        rol: usuario.rol || "",
        estado: usuario.estado || "",
        empleado: usuario.empleado || "",
      });
    }
  }, [usuario]);

  // Cargar empleados desde la API (ejemplo de uso de useEffect)
  const cargarEmpleados = async () => {
    try {
      const response = await obtenerEmpleados(); // Asegúrate de tener esta función definida
      if (response.data) {
        setEmpleados(response.data); // Actualiza el estado con la lista de empleados
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    cargarEmpleados(); // Llamar a la función para cargar empleados al montar el componente
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar cambio en el campo de confirmación de contraseña
  const handleChangePassword = (e) => {
    setPasswordConfirm(e.target.value);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Si estamos en modo registro (no editar), validar que se ingrese la contraseña y que coincida con confirmación
    if (!usuario && formData.password !== passwordConfirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    try {
      let response;
      if (usuario) {
        // Modo edición: actualizar el usuario; si password está vacío, se ignora la actualización de contraseña
        // Puedes preparar el objeto de actualización excluyendo password si está vacío
        const { password, ...dataSinPassword } = formData;
        const dataEnviar = password.trim() !== "" ? formData : dataSinPassword;
        response = await actualizarUsuario(usuario._id, dataEnviar);
      } else {
        // Modo registro: registra el usuario
        response = await registrarUsuario(formData);
      }

      if (response.data && response.data.success) {
        toast.success(
          usuario
            ? "Usuario actualizado con éxito."
            : "Usuario registrado con éxito."
        );
        if (setRefreshCheckLogin) setRefreshCheckLogin(true);
        // Reiniciar formulario: se puede limpiar o dejar los campos en modo edición (según tu lógica)
        setFormData({
          usuario: "",
          nombre: "",
          password: "",
          rol: "",
          estado: "",
          empleado: "",
        });
        setPasswordConfirm("");
      }
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Error al registrar/actualizar el usuario.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setShowModal(false); // Cerrar el modal después de registrar/actualizar
    }
  };

  return (
    <div className="registro-usuario-container">
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="usuario" className="form-label">
              Usuario
            </label>
            <input
              type="text"
              name="usuario"
              id="usuario"
              placeholder="Nombre de usuario"
              value={formData.usuario}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="nombre" className="form-label">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              placeholder="Ingresa tu nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
        </div>

        {/* En modo registro se requiere la contraseña, en modo edición es opcional */}
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            {usuario ? "Nueva Contraseña (opcional)" : "Contraseña"}
          </label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder={
              usuario ? "Deja vacío para mantener la actual" : "Contraseña"
            }
            value={formData.password}
            onChange={handleChange}
            required={!usuario}
            className="form-control"
          />
        </div>

        {!usuario && (
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Repite la contraseña"
              value={passwordConfirm}
              onChange={handleChangePassword}
              required={!usuario}
              className="form-control"
            />
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="rol" className="form-label">
            Rol
          </label>
          <input
            type="text"
            name="rol"
            id="rol"
            placeholder="Rol (opcional)"
            value={formData.rol}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {/* Ejemplo: selector de empleado */}
        <div className="mb-3">
          <label htmlFor="empleado" className="form-label">
            Empleado (opcional)
          </label>
          <select
            name="empleado"
            id="empleado"
            value={formData.empleado}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">— Ninguno —</option>
            {empleados.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.nombre} {emp.apellidoPaterno}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="estado" className="form-label">
            Estado
          </label>
          <input
            type="text"
            name="estado"
            id="estado"
            placeholder="Estado (opcional)"
            value={formData.estado}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <button type="submit" className="btn btn-success w-100">
          {usuario ? "Actualizar Usuario" : "Registrarse"}
        </button>
      </form>
    </div>
  );
};

export default RegistroUsuarios;

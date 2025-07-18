import React from "react";
import { eliminarOrdenTrabajo } from "../../../services/ordenesTrabajoService";
import { toast } from "react-toastify";

const ConfirmarEliminacion = ({ orden, setShow }) => {
  const handleEliminacion = () => {
    try {
      const response = eliminarOrdenTrabajo(orden.id);
      if (response) {
        toast.success("Orden eliminada correctamente");
        setShow(false);
      }
    } catch (error) {
      toast.error("Error al eliminar la orden: " + error.message);
    }
  };

  return (
    <div className="text-center">
      <p>
        ¿Deseas realizar esta acción sobre la orden{" "}
        <strong>{orden?.folio}</strong>?
      </p>
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button className="btn btn-secondary" onClick={() => setShow(false)}>
          Cancelar
        </button>
        <button className="btn btn-danger" onClick={handleEliminacion}>
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default ConfirmarEliminacion;

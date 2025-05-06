import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Obtener el token  desde el localStorage
  const token = localStorage.getItem("token");

  // Si no hay token, redirigir a la página de inicio de sesión
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token, renderizar el contenido
  return children;
};

export default ProtectedRoute;

// src/routers/Routing.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import configRouting from "./configRouting";
import Layout from "../layout/Layout";
import { AuthContext } from "../utils/context";

export default function Routing() {
  const { userRole } = useContext(AuthContext);

  // Filtramos las rutas que tenga permiso de ver este rol
  const filtered = configRouting.filter(
    (route) => !route.roles || route.roles.includes(userRole)
  );

  return (
    <Routes>
      {filtered.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <Layout>
              <route.page />
            </Layout>
          }
        />
      ))}

      {/* Ruta comodín: si no coincide ninguna, redirige al home o login */}
      <Route
        path="*"
        element={
          userRole ? (
            <Navigate to={filtered[0]?.path || "/"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

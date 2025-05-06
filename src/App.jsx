// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Routing from "./routers/Routing";
import LogIn from "./pages/LogIn/LogIn";
import RegisterTest from "./pages/RegisterTest/RegisterTest";
import { AuthContext } from "./utils/context";
import { ToastContainer } from "react-toastify";
import "./App.scss";

import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
// 🚀 IMPORTAR tu servicio que lee el perfil de Firestore:
import { obtenerUsuario } from "./services/usuariosService";

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        try {
          // ↪️ Aquí buscamos el perfil en Firestore y extraemos el rol
          const perfil = await obtenerUsuario(fbUser.uid);
          setUserRole(perfil.rol || "");
        } catch (e) {
          console.error("Error cargando perfil:", e);
          setUserRole("");
        }
      } else {
        setUser(null);
        setUserRole("");
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingUser) {
    return (
      <div className="app-loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ user, userRole }}>
        <Routes>
          {/* públicas */}
          <Route path="/login" element={<LogIn />} />
          <Route path="/register-test" element={<RegisterTest />} />

          {/* protegidas */}
          <Route
            path="/*"
            element={user ? <Routing /> : <Navigate to="/login" replace />}
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          newestOnTop={false}
          closeOnClick
          draggable
          pauseOnHover
        />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

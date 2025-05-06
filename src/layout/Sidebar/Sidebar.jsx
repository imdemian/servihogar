// src/components/Sidebar/Sidebar.jsx
import React, { useState } from "react";
import "./sidebar.scss";
import {
  faArrowLeft,
  faArrowRight,
  faHome,
  faMoneyBill1,
  faNoteSticky,
  faPeopleGroup,
  faQuestionCircle,
  faScrewdriverWrench,
  faSignOutAlt,
  faUsers,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService"; // <-- importamos el nuevo logout()
import { toast } from "react-toastify";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate(); // <-- hook para navegación

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Items principales
  const menuItems = [
    { title: "Inicio", route: "/home", icon: faHome },
    { title: "Usuarios", route: "/usuarios", icon: faUsers },
    { title: "Clientes", route: "/clientes", icon: faPeopleGroup },
    { title: "Empleados", route: "/empleados", icon: faUserTie },
    {
      title: "Órdenes de Trabajo",
      route: "/ordenesTrabajo",
      icon: faNoteSticky,
    },
    { title: "Órdenes Test", route: "/ordenesTest", icon: faNoteSticky },
    { title: "Cotizaciones", route: "/cotizaciones", icon: faMoneyBill1 },
    { title: "Test", route: "/test", icon: faNoteSticky },
  ];

  // Items inferiores (solo Salir necesita logout)
  const bottomMenuItems = [
    { title: "Ayuda", route: "/help", icon: faQuestionCircle, action: null },
    { title: "Salir", route: "/login", icon: faSignOutAlt, action: "logout" },
  ];

  // Handler de logout
  const handleLogout = async () => {
    try {
      await logout(); // cierra sesión en Firebase
      toast.success("Sesión cerrada");
      navigate("/login", { replace: true }); // redirige a login
    } catch (err) {
      console.error(err);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="top-section">
        {!isCollapsed && (
          <div className="logo">
            <FontAwesomeIcon icon={faScrewdriverWrench} />
            <span>ServiHogar</span>
          </div>
        )}
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={isCollapsed ? faArrowRight : faArrowLeft} />
        </button>
      </div>

      <div className={`sidebar-links ${isCollapsed ? "collapsed" : ""}`}>
        {menuItems.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            className="nav-link"
            activeclassname="active"
          >
            <FontAwesomeIcon icon={item.icon} className="icon" />
            {!isCollapsed && <span className="title">{item.title}</span>}
          </NavLink>
        ))}
      </div>

      {!isCollapsed && (
        <div className="bottom-section">
          {bottomMenuItems.map((item) => (
            <div key={item.title} className="nav-link bottom-link">
              <FontAwesomeIcon icon={item.icon} className="icon" />
              <span
                className="title"
                onClick={item.action === "logout" ? handleLogout : undefined}
              >
                {item.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

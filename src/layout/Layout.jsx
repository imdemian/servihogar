// import { useContext } from "react";
import Sidebar from "./sidebar/sidebar";
import { AuthContext } from "../utils/context";
import "./Layout.scss";

// Añadir setRefreshCheckLogin después
const Layout = ({ children }) => {
  // Obtener el usuario desde el contexto
  // const { user } = useContext(AuthContext);

  return (
    <>
      <div className="layout-wrapper">
        <Sidebar />
        <div className="content-wrapper bg-white">{children}</div>
      </div>
    </>
  );
};

export default Layout;

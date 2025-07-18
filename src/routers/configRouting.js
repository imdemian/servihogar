import Home from "../pages/Home/Home";
import Usuarios from "../pages/Usuarios/Usuarios";
import Empleados from "../pages/Empleados/Empleados";
import Clientes from "../pages/Clientes/Clientes";
import RegisterTest from "../pages/RegisterTest/RegisterTest";
import Cotizaciones from "../pages/Cotizaciones/Cotizaciones";
import RegistroCotizaciones from "../pages/Cotizaciones/RegistroCotizaciones";
import OrdenesTrabajo from "../pages/OrdenesTrabajo/ListOrdenesTrabajo";
import RegistroOrdenServicio from "../pages/OrdenesTrabajo/RegistroOrdenServicio";
import OrdenesTrabajoMobile from "../pages/OrdenesTrabajo/OrdenesTrabajoMobile";
// import EquipoFotosUploader from "../pages/test/Test";
// import OrdenesIndustrialRest from "../pages/OrdenesIndustrial/OrdenesIndustrial.tst";
// import FormularioOrdenServicio from "../pages/OrdenesTrabajo/OrdenesTest";
// import OrdenesTrabajoRegistro from "../pages/OrdenesTrabajo/OrdenesTrabajo.registro";

const isMobile = window.innerWidth <= 768;

const configRouting = [
  {
    path: "/",
    page: Home,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/home",
    page: Home,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/usuarios",
    page: Usuarios,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/register-test",
    page: RegisterTest,
  },
  {
    path: "/empleados",
    page: Empleados,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/clientes",
    page: Clientes,
    roles: ["ADMIN", "MANAGER"],
  },
  // {
  //   path: "/test",
  //   page: EquipoFotosUploader,
  //   roles: ["ADMIN", "MANAGER", "TECNICO"],
  // },
  {
    path: "/registro-cotizaciones",
    page: RegistroCotizaciones,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/cotizaciones",
    page: Cotizaciones,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/registro-ordenes-servicio",
    page: RegistroOrdenServicio,
    roles: ["ADMIN", "MANAGER", "TECNICO"],
  },
  {
    path: "/ordenesTrabajo",
    page: isMobile ? OrdenesTrabajoMobile : OrdenesTrabajo,
    roles: ["ADMIN", "MANAGER", "TECNICO"],
  },
];

export default configRouting;

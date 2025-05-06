import Home from "../pages/Home/Home";
import Usuarios from "../pages/Usuarios/Usuarios";
import Empleados from "../pages/Empleados/Empleados";
import Clientes from "../pages/Clientes/Clientes";
import RegisterTest from "../pages/RegisterTest/RegisterTest";
// import EquipoFotosUploader from "../pages/test/Test";
// import OrdenesIndustrialRest from "../pages/OrdenesIndustrial/OrdenesIndustrial.tst";
// import FormularioOrdenServicio from "../pages/OrdenesTrabajo/OrdenesTest";
// import OrdenesTrabajoRegistro from "../pages/OrdenesTrabajo/OrdenesTrabajo.registro";

const configRouting = [
  {
    path: "/",
    page: Home,
    roles: ["ADMIN", "MANAGER", "TECNICO"],
  },
  {
    path: "/home",
    page: Home,
    roles: ["ADMIN", "MANAGER", "TECNICO"],
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
  // {
  //   path: "/cotizaciones",
  //   page: OrdenesIndustrialRest,
  //   roles: ["ADMIN", "MANAGER", "TECNICO"],
  // },
  // {
  //   path: "/ordenesTest",
  //   page: FormularioOrdenServicio,
  //   roles: ["ADMIN", "MANAGER", "TECNICO"],
  // },
  // {
  //   path: "/ordenesTrabajo",
  //   page: OrdenesTrabajoRegistro,
  //   roles: ["ADMIN", "MANAGER", "TECNICO"],
  // },
];

export default configRouting;

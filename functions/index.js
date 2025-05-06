// functions/index.js
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";

// Asegúrate de inicializar admin antes de montar cualquier ruta
import "./admin.js";

import usuariosRouter from "./routes/usuariosRouter.js";
import clientesRouter from "./routes/clientesRouter.js";
import empleadosRouter from "./routes/empleadosRouter.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Monta tu API bajo /usuarios
app.use("/usuarios", usuariosRouter);
app.use("/clientes", clientesRouter);
app.use("/empleados", empleadosRouter);

// Exporta la función HTTP
export const api = functions.https.onRequest(app);

import "./triggers/index.js";

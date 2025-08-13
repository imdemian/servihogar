// functions/middlewares/checkAuth.js
import admin from "../admin.js";

export async function checkAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ message: "Token no provisto" });
    }

    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.uid = decoded.uid;
    req.user = decoded; // por si luego usas custom claims (roles)
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

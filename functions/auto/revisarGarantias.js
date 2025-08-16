// functions/auto/revisarGarantias.js
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../admin.js";

export const revisarGarantias = onSchedule(
  { schedule: "every 24 hours", timeZone: "America/Mexico_City" },
  async () => {
    const hoy = new Date();
    const noventaDiasMs = 90 * 24 * 60 * 60 * 1000;

    const toDateSafe = (v) => {
      if (!v) return null;
      if (typeof v?.toDate === "function") return v.toDate();
      if (v instanceof Date) return v;
      if (typeof v === "string") {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      if (typeof v === "object" && "seconds" in v)
        return new Date(v.seconds * 1000);
      return null;
    };

    let actualizadas = 0;

    const snap = await db
      .collection("ordenesTrabajo")
      .where("garantia", "==", true)
      .get();

    const batch = db.batch();

    snap.forEach((doc) => {
      const fechaEntrega = toDateSafe(doc.get("fechaEntrega"));
      if (!fechaEntrega) return;
      if (hoy - fechaEntrega > noventaDiasMs) {
        batch.update(doc.ref, { garantia: false, updatedAt: new Date() });
        actualizadas++;
      }
    });

    if (actualizadas > 0) await batch.commit();
    console.log(`[revisarGarantias] actualizadas: ${actualizadas}`);
  }
);

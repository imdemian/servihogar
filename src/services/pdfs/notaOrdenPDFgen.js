// src/utils/generarNotaOrdenServicio.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logourl from "../../assets/logoServiHogar.png";

export function generarNotaOrdenServicio(orden) {
  console.log(orden);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  const ensureSpace = (needed = 0) => {
    if (y + needed > pageHeight - margin - 80) {
      // 80px de colchón para pie
      doc.addPage();
      y = margin;
    }
  };

  // --- Encabezado ---
  doc.addImage(logourl, "PNG", margin, y, 80, 80);
  doc.setFontSize(14).setFont("helvetica", "bold");
  doc.text("SERVIHOGAR", margin + 100, y + 20);
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("Reparación y Mantenimiento", margin + 100, y + 35);
  doc.text("Tel: 427 272 90 93", margin + 100, y + 50);
  y += 90;

  // --- Datos de la Orden ---
  doc.setFontSize(12).setFont("helvetica", "bold");
  doc.text(`Orden de Servicio #${orden.numero}`, margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${orden.fecha}`, pageWidth - margin - 150, y);
  y += 20;
  doc.text(`Cliente: ${orden.cliente?.nombre || "N/D"}`, margin, y);
  y += 15;
  if (orden.cliente?.telefono) {
    doc.text(`Teléfono: ${orden.cliente.telefono}`, margin, y);
    y += 15;
  }
  if (orden.cliente?.direccion) {
    doc.text(`Dirección: ${orden.cliente.direccion}`, margin, y);
    y += 15;
  }
  y += 10;

  // --- Tabla de Servicios ---
  autoTable(doc, {
    startY: y,
    head: [["Servicio", "Cantidad", "P. Unit", "Total"]],
    body: (orden.servicios || []).map((s) => [
      s.servicio || s.descripcion || "—",
      s.cantidad ?? 1,
      `$${Number(s.precio ?? 0).toFixed(2)}`,
      `$${Number(s.total ?? (s.precio ?? 0) * (s.cantidad ?? 1)).toFixed(2)}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 10, cellPadding: 5 },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 18 : y + 18;

  // --- Totales ---
  doc.setFontSize(12).setFont("helvetica", "bold");
  doc.text(`Total: $${Number(orden.total).toFixed(2)}`, margin, y);

  // ⬅️ Línea divisoria debajo del total
  y += 8; // pequeño espacio
  doc.setDrawColor(180).setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 25; // más espacio antes de las cláusulas

  // =======================
  //   CLÁUSULAS DE GARANTÍA
  // =======================
  ensureSpace(40);
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("CLÁUSULAS DE GARANTÍA", margin, y);
  y += 12;
  doc.setDrawColor(180).line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "normal").setFontSize(9);

  const clausulas = [
    "1.- Las reparaciones a que se refiere el anverso de este documento tienen una garantía de 90 días contados a partir de la fecha de entrega del aparato o equipo ya reparado; esta garantía es en mano de obra y servicio de mantenimiento general; en piezas, refacciones y accesorios la garantía es la especificada por el proveedor “30 días”. La garantía aplica siempre y cuando no se manifieste mal uso, negligencia o descuido; lo anterior de conformidad con lo establecido en el artículo 77 de la Ley Federal de Protección al Consumidor.",
    "2.- Si el aparato o equipo es intervenido por un tercero, EL PRESTADOR DEL SERVICIO no será responsable y la garantía quedará sin efecto.",
    "3.- Las reclamaciones por garantía se harán AL PRESTADOR DEL SERVICIO, para lo cual EL CLIENTE deberá informar de forma presencial o telefónica.",
    "4.- Las reparaciones efectuadas por EL PRESTADOR DEL SERVICIO, en cumplimiento a la garantía del servicio, serán sin cargo alguno para EL CLIENTE, salvo aquellos trabajos que no deriven de las reparaciones aceptadas en el presupuesto.",
    "5.- No se computará dentro del plazo de garantía, el tiempo que dure la reparación y/o mantenimiento del aparato o equipo para el cumplimiento de la misma.",
    "6.- Para hacer válida la garantía es OBLIGATORIO traer copia de esta nota/folio de servicio y haber cubierto la totalidad del pago en tiempo y forma.",
    "7.- La garantía del producto no se valida por maltrato del equipo, variaciones de voltaje, área inadecuada de instalación, daño accidental, causas externas y aspectos estéticos tales como polvo, rayones/abolladuras, hendiduras, plástico roto, fisuras y/o descuadre de los equipos.",
    "8.- Si fuera necesario el reemplazo de alguna pieza, diferente a las señaladas en el anverso de este documento, esta será cubierta por EL CLIENTE, así como la mano de obra.",
    "9.- Toda revisión FUERA DE GARANTÍA tiene un costo de $200 mínimo. Costo absorbido en caso de quedarse a reparación previa autorización del CLIENTE.",
  ];

  const maxW = pageWidth - margin * 2;
  clausulas.forEach((texto) => {
    const lines = doc.splitTextToSize(texto, maxW);
    ensureSpace(lines.length * 10 + 4); // menos espacio entre líneas
    doc.text(lines, margin, y);
    y += lines.length * 10 + 4;
  });

  // --- Firmas ---
  ensureSpace(80);
  y += 10;
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text("_________________________", margin, y);
  doc.text("Firma del Cliente", margin, y + 12);
  doc.text("_________________________", margin + 300, y);
  doc.text("Firma del Técnico", margin + 300, y + 12);

  // --- Pie de página ---
  const addFooter = () => {
    const py = pageHeight - 70;
    doc.setFontSize(9).setFont("helvetica", "bold");
    doc.text("DOMICILIO DE ATENCIÓN", margin, py);

    // ⬅️ Ajustado de +220 a +180
    doc.text("HORARIO DE ATENCIÓN", margin + 180, py);

    doc.text("TELÉFONOS", pageWidth - margin - 120, py);

    doc.setFont("helvetica", "normal");
    doc.text("5 de Mayo #91, Col. Centro", margin, py + 14);
    doc.text("San Juan del Río, Querétaro", margin, py + 28);

    // ⬅️ También aquí el ajuste
    doc.text(
      "Lunes a viernes de 9:00 a 3:00 pm y de 4:00 a 6:00 pm",
      margin + 180,
      py + 14
    );
    doc.text("Sábados de 9:00 a 2:00 pm", margin + 180, py + 28);

    doc.text("Oficina  427 272 90 93", pageWidth - margin - 120, py + 14);
    doc.text("Oficina  427 277 76 15", pageWidth - margin - 120, py + 28);
    doc.text("Ing. Efrén 427 132 76 31", pageWidth - margin - 120, py + 42);
  };

  // Si hay varias páginas, agrega pie al final de cada una
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter();
  }

  // Descargar
  doc.save(`OrdenServicio_${orden.numero}.pdf`);
}

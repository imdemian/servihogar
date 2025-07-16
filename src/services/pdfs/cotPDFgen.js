import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logourl from "../../assets/logoServiHogar.png";

/**
 * Genera un PDF con la información de la cotización y lanza la descarga.
 * @param {Object} cotizacion — Objeto de cotización
 */
export function generateCotizacionPdf(cotizacion) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 40;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoWidth = 100;
  const logoHeight = 100;
  const espacioEntreLogoYTexto = 20;

  // — Logo —
  doc.addImage(logourl, "PNG", margin, y, logoWidth, logoHeight);

  // — Título de la empresa centrado horizontalmente como bloque —
  doc.setFontSize(14);
  const titulo =
    "Reparación, Mantenimiento y Ventas de Aire Acondicionado Comercial e Industrial, Cámaras Frigoríficas, Lavadoras y Refrigeradores Nacionales e Importados";
  const textoAreaX = margin + logoWidth + espacioEntreLogoYTexto;
  const textoAreaWidth = pageWidth - textoAreaX - margin;

  const splitTitulo = doc.splitTextToSize(titulo, textoAreaWidth);
  doc.text(splitTitulo, textoAreaX + textoAreaWidth / 2, y + 20, {
    align: "center",
  });
  const tituloHeight = splitTitulo.length * 14 + 10;
  y += tituloHeight + 10;

  // — Datos de contacto debajo del título —
  doc.setFontSize(8);
  const datosContacto =
    "Efrén Padilla Ugalde RFC: PAUE760622KNO Dir. Francisco Monroy Vélez #15 Fracc. Los Naranjos C.P.: 76800";
  const splitDatosContacto = doc.splitTextToSize(datosContacto, textoAreaWidth);
  doc.text(splitDatosContacto, textoAreaX + textoAreaWidth / 2, y + 5, {
    align: "center",
  });
  const contactoHeight = splitDatosContacto.length * 14 + 10;
  y += contactoHeight;

  y = Math.max(y, margin + logoHeight) + 20;

  // — INFORMACIÓN DEL CLIENTE Y FECHA —
  doc.setFontSize(12);
  doc.text(
    `Cliente: ${cotizacion.tituloCliente} ${cotizacion.nombreCliente}`,
    margin,
    y
  );
  doc.text(
    `Fecha: ${new Date(cotizacion.fechaCotizacion).toLocaleDateString()}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 15;

  doc.text(
    `No. Cotización: ${cotizacion.noCotizacion}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 30;

  // — Descripción de la cotización —
  if (cotizacion.leyendaCotizacion) {
    const descripcion = doc.splitTextToSize(
      cotizacion.leyendaCotizacion,
      pageWidth - margin * 2
    );
    doc.text(descripcion, margin, y);
    y += descripcion.length * 14 + 10;
  }

  // — Preparo datos para la tabla con formato MXN —
  const headers = ["#", "Descripción", "Capacidad", "Cant.", "Unit.", "Total"];
  const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

  const rows = cotizacion.items.map((item, i) => [
    String(i + 1),
    item.descripcion,
    item.capacidad,
    String(item.cantidad),
    currencyFormatter.format(item.costoUnitario),
    currencyFormatter.format(item.costoTotal),
  ]);

  const totalRow = [
    "",
    "",
    "",
    "",
    "Total",
    currencyFormatter.format(cotizacion.total),
  ];

  const tableWidth = 30 + 200 + 80 + 50 + 60 + 60; // suma de cellWidths = 480
  const leftMargin = (pageWidth - tableWidth) / 2;

  // — Inserto tabla con autoTable —
  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    foot: [totalRow],
    tableWidth: "wrap", // que se ajuste al contenido
    margin: { left: leftMargin },
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: 255,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [217, 232, 246],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 200 },
      2: { cellWidth: 80 },
      3: { cellWidth: 50 },
      4: { cellWidth: 60, halign: "right" },
      5: { cellWidth: 60, halign: "right" },
    },
  });

  // — Y final de tabla —
  const finalY = doc.lastAutoTable.finalY + 20;

  y = finalY;

  // — Leyenda final —
  if (cotizacion.leyendaFinal) {
    const leyenda = doc.splitTextToSize(
      cotizacion.leyendaFinal,
      pageWidth - margin * 2
    );
    doc.text(leyenda, margin, y);
    y += leyenda.length * 14 + 20;
  }

  // — Términos finales —
  const terminos = [
    "Forma de pago: Se requiere el costo total de los equipos para solicitarlos y el resto al término del trabajo.",
    "Tiempo de entrega del equipo: 1 semana después de tener el anticipo.",
    "Sin más por el momento quedo de usted esperando su pronta respuesta.",
  ];

  doc.setFontSize(12);
  terminos.forEach((linea) => {
    const texto = doc.splitTextToSize(linea, pageWidth - margin * 2);
    doc.text(texto, margin, y);
    y += texto.length * 14 + 10;
  });

  // — Firma final centrada —
  y += 20; // espacio antes de la firma
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");

  const firma = ["Atentamente", "Ing. Efrén Padilla Ugalde"];
  firma.forEach((linea) => {
    doc.text(linea, pageWidth / 2, y, { align: "center" });
    y += 18;
  });

  // — Descarga —
  const filename = `cotizacion_${cotizacion.noCotizacion || cotizacion.id}.pdf`;
  doc.save(filename);
}

import type { Appointment } from "@/services/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale/es";

const fmtDate = (dt: string) => {
  try {
    const utcDateStr =
      dt.includes("T") && dt.endsWith("Z") ? dt : `${dt.replace(" ", "T")}Z`;

    return format(parseISO(utcDateStr), "dd MMM yyyy, HH:mm", { locale: es });
  } catch {
    return dt;
  }
};

export const generateReservationPDF = (appointmentDetail: Appointment) => {
  if (!appointmentDetail) return;

  const doc = new jsPDF();

  // 1. Título y Encabezado
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text("Amelia's Beauty Skin", 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`Detalle de Reserva #${appointmentDetail.id}`, 14, 28);

  // 2. Información del Paciente
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Información del Paciente", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${appointmentDetail.patient_name}`, 14, 47);
  doc.text(`Teléfono: ${appointmentDetail.patient_phone || "N/A"}`, 14, 54);
  doc.text(`Email: ${appointmentDetail.patient_email || "N/A"}`, 14, 61);

  // 3. Información de la Reserva
  doc.setFont("helvetica", "bold");
  doc.text("Detalles del Servicio", 105, 40);
  doc.setFont("helvetica", "normal");
  doc.text(`Servicio: ${appointmentDetail.service_name}`, 105, 47);
  doc.text(`Especialidad: ${appointmentDetail.specialty_name || "—"}`, 105, 54);
  doc.text(`Estado: ${appointmentDetail.status_name}`, 105, 61);
  doc.text(`Fecha Creación: ${fmtDate(appointmentDetail.created_at)}`, 105, 68);

  let currentY = 75;

  // 4. Ficha Clínica Láser (Si existe)
  if (appointmentDetail.laserRecord) {
    const lr = appointmentDetail.laserRecord;
    const zones =
      lr.zones
        ?.map((z: any) => (typeof z === "string" ? z : z.zone_name))
        .join(", ") || "N/A";

    doc.setFont("helvetica", "bold");
    doc.text("Ficha Clínica Láser", 14, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 7;

    doc.text(`Zonas a tratar: ${zones}`, 14, currentY);
    currentY += 7;
    doc.text(
      `Fototipo: Tipo ${lr.fitzpatrick_type || "N/A"} (Puntaje: ${lr.total_score || 0})`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(
      `Método actual: ${lr.current_hair_removal_method || "No especificado"}`,
      14,
      currentY,
    );
    currentY += 7;

    doc.setFont("helvetica", "bold");
    doc.text("Antecedentes Médicos:", 14, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 7;

    doc.text(
      `Enfermedades a la piel: ${lr.skin_diseases || "Ninguna"}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(
      `Medicamentos: ${lr.photosensitive_meds || "Ninguno"}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(`Tatuajes: ${lr.tattoos_zone || "Ninguno"}`, 14, currentY);
    currentY += 7;
    doc.text(
      `Implantes/Injertos: ${lr.implants_zone || "Ninguno"}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(
      `Prótesis/Placas: ${lr.plates_prosthesis_zone || "Ninguno"}`,
      14,
      currentY,
    );
    currentY += 7;
    doc.text(
      `Nevus atípico: ${lr.atypical_nevus_zone || "Ninguno"}`,
      14,
      currentY,
    );
    currentY += 7;
  }

  // 5. Tabla de Sesiones
  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Sesiones (${appointmentDetail?.sessions?.length})`, 14, currentY);

  const tableData = appointmentDetail?.sessions?.map((s) => [
    `#${s.session_number}`,
    s.staff_name,
    fmtDate(s.start_date_time),
    s.session_status,
    s.notes || "—",
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [
      ["Sesión", "Especialista", "Fecha y Hora Inicio", "Estado", "Notas"],
    ],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] }, // Azul primario
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // 6. Generar y Descargar
  const safeName = appointmentDetail.patient_name.replace(/\s+/g, "_");
  doc.save(`Reserva_${appointmentDetail.id}_${safeName}.pdf`);
};

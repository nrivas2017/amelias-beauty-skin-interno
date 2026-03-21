import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  CreateAppointmentDTO,
  CreatePatientDTO,
  CreateServiceDTO,
  CreateSpecialtyDTO,
  CreateStaffDTO,
  LaserClinicalRecord,
  Patient,
  Service,
  Session,
  SessionStatus,
  Specialty,
  Staff,
  UpdateServiceDTO,
  UpdateSessionDTO,
  UpdateSpecialtyDTO,
  UpdateStaffDTO,
  LaserZone,
  CreateLaserZoneDTO,
  UpdateLaserZoneDTO,
  LaserPatient,
  LaserSessionWithParams,
  LaserSessionParameter,
} from "./types";

const API_URL = "http://localhost:3000/api";

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMessage);
  }
  return res.json();
};

export const api = {
  // ─── CATALOGS ────────────────────────────────────────────────────────────
  getAppointmentStatuses: async (): Promise<AppointmentStatus[]> => {
    const res = await fetch(`${API_URL}/catalogs/appointment-statuses`);
    return handleResponse(res);
  },
  getSessionStatuses: async (): Promise<SessionStatus[]> => {
    const res = await fetch(`${API_URL}/catalogs/session-statuses`);
    return handleResponse(res);
  },

  // ─── PERSONAL (STAFF) ────────────────────────────────────────────────────
  getStaff: async (): Promise<Staff[]> => {
    const res = await fetch(`${API_URL}/staff`);
    return handleResponse(res);
  },
  createStaff: async (data: CreateStaffDTO): Promise<Staff> => {
    const res = await fetch(`${API_URL}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateStaff: async (
    id: string | number,
    data: UpdateStaffDTO,
  ): Promise<Staff> => {
    const res = await fetch(`${API_URL}/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ─── SERVICIOS ────────────────────────────────────────────────────────────
  getServices: async (): Promise<Service[]> => {
    const res = await fetch(`${API_URL}/services`);
    return handleResponse(res);
  },
  createService: async (data: CreateServiceDTO): Promise<Service> => {
    const res = await fetch(`${API_URL}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateService: async (
    id: string | number,
    data: UpdateServiceDTO,
  ): Promise<Service> => {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ─── ESPECIALIDADES ───────────────────────────────────────────────────────
  getSpecialties: async (): Promise<Specialty[]> => {
    const res = await fetch(`${API_URL}/specialties`);
    return handleResponse(res);
  },
  createSpecialty: async (data: CreateSpecialtyDTO): Promise<Specialty> => {
    const res = await fetch(`${API_URL}/specialties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateSpecialty: async (
    id: string | number,
    data: UpdateSpecialtyDTO,
  ): Promise<Specialty> => {
    const res = await fetch(`${API_URL}/specialties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ─── ZONAS LÁSER ─────────────────────────────────────────────────────────
  getLaserZones: async (): Promise<LaserZone[]> => {
    const res = await fetch(`${API_URL}/laser-zones`);
    return handleResponse(res);
  },
  createLaserZone: async (data: CreateLaserZoneDTO): Promise<LaserZone> => {
    const res = await fetch(`${API_URL}/laser-zones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateLaserZone: async (
    id: string | number,
    data: UpdateLaserZoneDTO,
  ): Promise<LaserZone> => {
    const res = await fetch(`${API_URL}/laser-zones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ─── PARÁMETROS LÁSER ───────────────────────────────────────────────────
  getLaserPatients: async (): Promise<LaserPatient[]> => {
    const res = await fetch(`${API_URL}/laser-parameters/patients`);
    return handleResponse(res);
  },
  getLaserSessionsByPatient: async (
    patientId: string | number,
  ): Promise<LaserSessionWithParams[]> => {
    const res = await fetch(
      `${API_URL}/laser-parameters/patients/${patientId}/sessions`,
    );
    return handleResponse(res);
  },
  upsertLaserParameters: async (
    sessionId: string | number,
    zoneId: string | number,
    data: Partial<LaserSessionParameter> & { general_notes?: string },
  ): Promise<{ message: string }> => {
    const res = await fetch(
      `${API_URL}/laser-parameters/sessions/${sessionId}/zones/${zoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(res);
  },

  // ─── PACIENTES ────────────────────────────────────────────────────────────
  getPatients: async (): Promise<Patient[]> => {
    const res = await fetch(`${API_URL}/patients`);
    return handleResponse(res);
  },
  createPatient: async (data: CreatePatientDTO): Promise<Patient> => {
    const res = await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updatePatient: async (
    id: string | number,
    data: Partial<CreatePatientDTO>,
  ): Promise<Patient> => {
    const res = await fetch(`${API_URL}/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ─── CITAS Y SESIONES ─────────────────────────────────────────────────────

  /** Sesiones del calendario (con filtro opcional por fecha) */
  getSessions: async (date?: string): Promise<Session[]> => {
    const url = date
      ? `${API_URL}/appointments/sessions?date=${date}`
      : `${API_URL}/appointments/sessions`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  /** Listado de reservas con filtros opcionales */
  getAppointments: async (
    filters?: AppointmentFilters,
  ): Promise<Appointment[]> => {
    const params = new URLSearchParams();
    if (filters?.patient_id)
      params.set("patient_id", String(filters.patient_id));
    if (filters?.service_id)
      params.set("service_id", String(filters.service_id));
    if (filters?.status_id) params.set("status_id", String(filters.status_id));
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    const qs = params.toString();
    const res = await fetch(`${API_URL}/appointments${qs ? `?${qs}` : ""}`);
    return handleResponse(res);
  },

  /** Detalle de una reserva (incluye sesiones y ficha láser si aplica) */
  getAppointmentById: async (id: string | number): Promise<Appointment> => {
    const res = await fetch(`${API_URL}/appointments/${id}`);
    return handleResponse(res);
  },

  /** Crear nueva reserva (con una o varias sesiones) */
  createAppointment: async (
    data: CreateAppointmentDTO,
  ): Promise<{ appointment_id: number }> => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  /** Agregar sesión a reserva existente */
  addSession: async (
    appointmentId: string | number,
    data: {
      staff_id: string | number;
      start_date_time: string;
      end_date_time: string;
      estimated_duration_minutes?: number;
      notes?: string;
    },
  ): Promise<{ session_id: number; session_number: number }> => {
    const res = await fetch(
      `${API_URL}/appointments/${appointmentId}/sessions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(res);
  },

  /** Actualizar / reagendar una sesión */
  updateSession: async (
    id: string | number,
    data: UpdateSessionDTO,
  ): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_URL}/appointments/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  /** Eliminar una sesión (si no ha sido completada/finalizada) */
  deleteSession: async (id: string | number): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_URL}/appointments/sessions/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },

  /** Cancelar reserva completa */
  cancelAppointment: async (
    id: string | number,
    close_notes?: string,
  ): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_URL}/appointments/${id}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ close_notes }),
    });
    return handleResponse(res);
  },

  /** Finalizar reserva completa (solo si no tiene sesiones pendientes) */
  completeAppointment: async (
    id: string | number,
  ): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },

  /** Obtener ficha láser de una reserva */
  getLaserRecord: async (
    appointmentId: string | number,
  ): Promise<LaserClinicalRecord> => {
    const res = await fetch(
      `${API_URL}/appointments/${appointmentId}/laser-record`,
    );
    return handleResponse(res);
  },

  /** Actualizar ficha láser */
  updateLaserRecord: async (
    appointmentId: string | number,
    data: Partial<LaserClinicalRecord>,
  ): Promise<{ ok: boolean }> => {
    const res = await fetch(
      `${API_URL}/appointments/${appointmentId}/laser-record`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(res);
  },
};

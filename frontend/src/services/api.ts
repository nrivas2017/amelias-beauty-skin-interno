import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentDTO,
  CreatePatientDTO,
  CreateServiceDTO,
  CreateSpecialtyDTO,
  CreateStaffDTO,
  LaserClinicalRecord,
  Patient,
  Service,
  Session,
  Specialty,
  Staff,
  UpdateServiceDTO,
  UpdateSessionDTO,
  UpdateSpecialtyDTO,
  UpdateStaffDTO,
} from "./types";

const API_URL = "http://localhost:3000/api";

export const api = {
  // ─── CATALOGS ────────────────────────────────────────────────────────────
  getAppointmentStatuses: async (): Promise<any[]> => {
    const res = await fetch(`${API_URL}/catalogs/appointment-statuses`);
    if (!res.ok) throw new Error("Error fetching appointment statuses");
    return res.json();
  },
  getSessionStatuses: async (): Promise<any[]> => {
    const res = await fetch(`${API_URL}/catalogs/session-statuses`);
    if (!res.ok) throw new Error("Error fetching session statuses");
    return res.json();
  },

  // ─── PERSONAL (STAFF) ────────────────────────────────────────────────────
  getStaff: async (): Promise<Staff[]> => {
    const res = await fetch(`${API_URL}/staff`);
    if (!res.ok) throw new Error("Error fetching staff");
    return res.json();
  },
  createStaff: async (data: CreateStaffDTO): Promise<Staff> => {
    const res = await fetch(`${API_URL}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error creating staff");
    return res.json();
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
    if (!res.ok) throw new Error("Error updating staff");
    return res.json();
  },

  // ─── SERVICIOS ────────────────────────────────────────────────────────────
  getServices: async (): Promise<Service[]> => {
    const res = await fetch(`${API_URL}/services`);
    if (!res.ok) throw new Error("Error fetching services");
    return res.json();
  },
  createService: async (data: CreateServiceDTO): Promise<Service> => {
    const res = await fetch(`${API_URL}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error creating service");
    return res.json();
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
    if (!res.ok) throw new Error("Error updating service");
    return res.json();
  },

  // ─── ESPECIALIDADES ───────────────────────────────────────────────────────
  getSpecialties: async (): Promise<Specialty[]> => {
    const res = await fetch(`${API_URL}/specialties`);
    if (!res.ok) throw new Error("Error fetching specialties");
    return res.json();
  },
  createSpecialty: async (data: CreateSpecialtyDTO): Promise<Specialty> => {
    const res = await fetch(`${API_URL}/specialties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Error creating specialty");
    }
    return res.json();
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
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Error updating specialty");
    }
    return res.json();
  },

  // ─── PACIENTES ────────────────────────────────────────────────────────────
  getPatients: async (): Promise<Patient[]> => {
    const res = await fetch(`${API_URL}/patients`);
    if (!res.ok) throw new Error("Error fetching patients");
    return res.json();
  },
  createPatient: async (data: CreatePatientDTO): Promise<Patient> => {
    const res = await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error creating patient");
    return res.json();
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
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(
        errData.errors ? errData.errors.join(", ") : "Error updating patient",
      );
    }
    return res.json();
  },

  // ─── CITAS Y SESIONES ─────────────────────────────────────────────────────

  /** Sesiones del calendario (con filtro opcional por fecha) */
  getSessions: async (date?: string): Promise<Session[]> => {
    const url = date
      ? `${API_URL}/appointments/sessions?date=${date}`
      : `${API_URL}/appointments/sessions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error fetching sessions");
    return res.json();
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
    if (!res.ok) throw new Error("Error fetching appointments");
    return res.json();
  },

  /** Detalle de una reserva (incluye sesiones y ficha láser si aplica) */
  getAppointmentById: async (id: string | number): Promise<Appointment> => {
    const res = await fetch(`${API_URL}/appointments/${id}`);
    if (!res.ok) throw new Error("Error fetching appointment");
    return res.json();
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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Error creating appointment");
    }
    return res.json();
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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Error adding session");
    }
    return res.json();
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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Error updating session");
    }
    return res.json();
  },

  /** Eliminar una sesión (si no ha sido completada/finalizada) */
  deleteSession: async (id: string | number): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_URL}/appointments/sessions/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Error al eliminar la sesión");
    }
    return res.json();
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
    if (!res.ok) throw new Error("Error canceling appointment");
    return res.json();
  },

  /** Finalizar reserva completa (solo si no tiene sesiones pendientes) */
  completeAppointment: async (
    id: string | number,
  ): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Error al finalizar la reserva");
    }
    return res.json();
  },

  /** Obtener ficha láser de una reserva */
  getLaserRecord: async (
    appointmentId: string | number,
  ): Promise<LaserClinicalRecord> => {
    const res = await fetch(
      `${API_URL}/appointments/${appointmentId}/laser-record`,
    );
    if (!res.ok) throw new Error("Error fetching laser record");
    return res.json();
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
    if (!res.ok) throw new Error("Error updating laser record");
    return res.json();
  },
};

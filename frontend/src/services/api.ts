import type {
  CreateAppointmentDTO,
  CreatePatientDTO,
  CreateServiceDTO,
  CreateSpecialtyDTO,
  CreateStaffDTO,
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
  // --- MANTENEDOR DE PERSONAL (STAFF) ---
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
  // --- MANTENEDOR DE SERVICIOS ---
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

  // --- Pacientes ---
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

  // --- Citas (Appointments & Sessions) ---
  getSessions: async (date?: string): Promise<Session[]> => {
    const url = date
      ? `${API_URL}/appointments/sessions?date=${date}`
      : `${API_URL}/appointments/sessions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error fetching sessions");
    return res.json();
  },
  createAppointment: async (data: CreateAppointmentDTO): Promise<Session> => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error creating appointment");
    return res.json();
  },
  updateSession: async (
    id: string | number,
    data: UpdateSessionDTO,
  ): Promise<Session> => {
    const res = await fetch(`${API_URL}/appointments/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error updating session");
    return res.json();
  },
  cancelAppointment: async (
    id: string | number,
  ): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/appointments/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error canceling appointment");
    return res.json();
  },
};

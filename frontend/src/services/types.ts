export interface Staff {
  id: string | number;
  full_name: string;
  is_active?: boolean;
}

export interface Service {
  id: string | number;
  name: string;
  estimated_duration: number;
  label_color: string;
  is_active?: boolean;
}

export interface Specialty {
  id: string | number;
  name: string;
  is_active?: boolean;
}

export interface Patient {
  id: string | number;
  full_name: string;
  age: number;
  email: string;
  address: string;
  phone: string;
  pregnant_lactating: boolean;
  allergies: string;
  medical_treatment: string;
}

export interface Session {
  id: string | number;
  appointment_id: string | number;
  start_date_time: string; // ISO String
  end_date_time: string; // ISO String
  notes?: string;
  patient_name: string;
  service_name: string;
  label_color: string;
  staff_id: string | number;
  staff_name: string;
  session_status: string;
}

// Staff DTOs
export type CreateStaffDTO = Omit<Staff, "id"> & {
  specialty_ids?: (string | number)[];
};
export type UpdateStaffDTO = Partial<CreateStaffDTO>;

// Service DTOs
export type CreateServiceDTO = Omit<Service, "id">;
export type UpdateServiceDTO = Partial<CreateServiceDTO>;

// Patient DTOs
export type CreatePatientDTO = Omit<Patient, "id">;

// Specialty DTOs
export type CreateSpecialtyDTO = Omit<Specialty, "id">;
export type UpdateSpecialtyDTO = Partial<CreateSpecialtyDTO>;

// Appointment / Session DTOs
export interface CreateAppointmentDTO {
  patient_id: string | number;
  service_id: string | number;
  staff_id: string | number;
  start_date_time: string; // ISO Date String
  notes?: string;
}

export interface UpdateSessionDTO {
  session_status?: string;
  start_date_time?: string;
  end_date_time?: string;
  staff_id?: string | number;
  notes?: string;
}

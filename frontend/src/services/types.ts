export interface Staff {
  id: string | number;
  full_name: string;
  is_active?: boolean;
  specialties?: Specialty[];
}

export interface Specialty {
  id: string | number;
  name: string;
  code: string;
  is_active?: boolean;
}

export interface SessionStatus {
  id: number;
  name: string;
  code: string;
}

export interface Service {
  id: string | number;
  name: string;
  specialty_id: string | number | null;
  specialty_name?: string;
  specialty_code?: string;
  label_color: string;
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
  session_number: number;
  start_date_time: string;
  end_date_time: string;
  estimated_duration_minutes?: number;
  actual_start_time?: string;
  actual_end_time?: string;
  notes?: string;
  close_notes?: string;
  patient_name?: string;
  service_name?: string;
  label_color?: string;
  specialty_code?: string;
  staff_id: string | number;
  staff_name?: string;
  session_status: string;
  session_status_code: string;
  status_id: string | number;
}

export interface Appointment {
  id: string | number;
  patient_id: string | number;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  service_id: string | number;
  service_name: string;
  label_color: string;
  specialty_code?: string;
  specialty_name?: string;
  status_id: string | number;
  status_name: string;
  status_code: string;
  total_price?: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
  session_count?: number;
  sessions?: Session[];
  laserRecord?: LaserClinicalRecord | null;
}

export interface LaserClinicalRecord {
  id?: string | number;
  appointment_id: string | number;
  tattoos_zone?: string;
  photosensitive_meds?: string;
  implants_zone?: string;
  plates_prosthesis_zone?: string;
  atypical_nevus_zone?: string;
  skin_diseases?: string;
  current_hair_removal_method?: string;
  skin_color_score?: number;
  hair_color_score?: number;
  eye_color_score?: number;
  freckles_score?: number;
  genetic_heritage_score?: number;
  burn_potential_score?: number;
  tan_potential_score?: number;
  total_score?: number;
  fitzpatrick_type?: number;
  zones?: string[];
}

// Staff
export type CreateStaffDTO = Omit<Staff, "id"> & {
  specialty_ids?: (string | number)[];
};
export type UpdateStaffDTO = Partial<CreateStaffDTO>;

// Service
export type CreateServiceDTO = Omit<
  Service,
  "id" | "specialty_name" | "specialty_code"
>;
export type UpdateServiceDTO = Partial<CreateServiceDTO>;

// Patient
export type CreatePatientDTO = Omit<Patient, "id">;

// Specialty
export type CreateSpecialtyDTO = Omit<Specialty, "id">;
export type UpdateSpecialtyDTO = Partial<CreateSpecialtyDTO>;

// Session DTO (para crear dentro de un appointment)
export interface CreateSessionDTO {
  staff_id: string | number;
  start_date_time: string;
  end_date_time: string;
  estimated_duration_minutes?: number;
  notes?: string;
}

// Appointment
export interface CreateAppointmentDTO {
  patient_id: string | number;
  service_id: string | number;
  total_price?: number;
  payment_method?: string;
  notes?: string;
  sessions: CreateSessionDTO[];
  laserRecord?: Omit<LaserClinicalRecord, "id" | "appointment_id">;
}

export interface UpdateSessionDTO {
  staff_id?: string | number;
  start_date_time?: string;
  end_date_time?: string;
  estimated_duration_minutes?: number;
  status_id?: string | number;
  notes?: string;
  close_notes?: string;
  actual_start_time?: string;
  actual_end_time?: string;
}

export interface AppointmentFilters {
  patient_id?: string | number;
  service_id?: string | number;
  status_id?: string | number;
  date_from?: string;
  date_to?: string;
}

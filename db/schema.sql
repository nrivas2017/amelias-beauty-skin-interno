-- ============================================================
-- Amelia's Beauty Skin - Schema
-- ============================================================

-- Especialidades del negocio
-- El campo "code" es un identificador único de negocio (usado por el backend para lógica especial)
CREATE TABLE specialties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    is_active INTEGER DEFAULT 1
);

INSERT INTO specialties (name, code, is_active) VALUES
('Depilación Láser', 'LASER_DEPILATION', 1),
('Manicure / Esmaltado', 'MANICURE', 1),
('Masajes', 'MASSAGE', 1),
('Pestañas', 'EYELASHES', 1),
('Servicios de Pies', 'FOOT_CARE', 1);

-- Estados de reserva (appointment)
CREATE TABLE appointment_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE
);

INSERT INTO appointment_statuses (name, code) VALUES
('En tratamiento', 'IN_TREATMENT'),
('Finalizada', 'COMPLETED'),
('Cancelada', 'CANCELLED');

-- Estados de sesión
CREATE TABLE session_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE
);

INSERT INTO session_statuses (name, code) VALUES
('Agendada', 'SCHEDULED'),
('Confirmada', 'CONFIRMED'),
('Realizada', 'COMPLETED'),
('Cancelada por paciente', 'CANCELLED_BY_PATIENT'),
('Cancelada por profesional', 'CANCELLED_BY_STAFF'),
('Finalizada', 'FINALIZED');

-- Servicios ofrecidos
-- specialty_id relaciona el servicio con su especialidad
-- estimated_duration fue removido; la duración se gestiona por sesión
CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty_id INTEGER NOT NULL,
    label_color TEXT DEFAULT '#3b82f6',
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);

INSERT INTO services (name, specialty_id, label_color, is_active) VALUES
('Láser Cuerpo Completo',    1, '#7c3aed', 1),
('Láser Facial',             1, '#9333ea', 1),
('Esmaltado Semipermanente', 2, '#ec4899', 1),
('Manicure Clásica',         2, '#f472b6', 1),
('Masaje Reductor',          3, '#0ea5e9', 1),
('Masaje Relajante',         3, '#38bdf8', 1),
('Extensión de Pestañas',    4, '#10b981', 1),
('Lifting de Pestañas',      4, '#34d399', 1),
('Pedicure Spa',             5, '#f59e0b', 1),
('Kapping de Pies',          5, '#fbbf24', 1);

-- Personal
CREATE TABLE staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
);

INSERT INTO staff (full_name, is_active) VALUES
('María José Sandoval San Martín', 1),
('Mariana Sandoval San Martín', 1);

-- Especialidades que puede realizar cada miembro del personal
CREATE TABLE staff_specialties (
    staff_id INTEGER,
    specialty_id INTEGER,
    PRIMARY KEY (staff_id, specialty_id),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);

INSERT INTO staff_specialties (staff_id, specialty_id) VALUES
(1, 1),  -- María José → Depilación Láser
(1, 3),  -- María José → Masajes
(2, 2),  -- Mariana → Manicure
(2, 4),  -- Mariana → Pestañas
(2, 5);  -- Mariana → Servicios de Pies

-- Pacientes
CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    national_id TEXT NOT NULL UNIQUE,
    age INTEGER,
    email TEXT,
    address TEXT,
    phone TEXT NOT NULL,
    pregnant_lactating INTEGER DEFAULT 0,
    allergies TEXT,
    medical_treatment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reservas (Appointment) — agrupa 1 o más sesiones de un mismo servicio para un paciente
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    status_id INTEGER DEFAULT 1,
    notes TEXT,                          -- notas generales de la reserva
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (status_id) REFERENCES appointment_statuses(id)
);

-- Sesiones — cada instancia agendada dentro de una reserva
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    staff_id INTEGER,
    status_id INTEGER DEFAULT 1,
    session_number INTEGER DEFAULT 1,
    -- Horario planificado (lo ingresa el usuario al agendar)
    start_date_time DATETIME NOT NULL,
    end_date_time DATETIME NOT NULL,
    estimated_duration_minutes INTEGER,  -- estimado de planificación (15–60 min, intervalos de 5)
    -- Tiempos reales (se registran al finalizar la sesión)
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    -- Notas
    notes TEXT,                          -- notas internas de la sesión
    close_notes TEXT,                    -- comentario al finalizar o cancelar
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (status_id) REFERENCES session_statuses(id)
);

-- Ficha clínica de depilación láser (se asocia a una reserva de tipo LASER_DEPILATION)
CREATE TABLE laser_clinical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL UNIQUE,  -- 1 ficha por reserva
    tattoos_zone TEXT,
    photosensitive_meds TEXT,
    implants_zone TEXT,
    plates_prosthesis_zone TEXT,
    atypical_nevus_zone TEXT,
    skin_diseases TEXT,
    current_hair_removal_method TEXT,
    skin_color_score INTEGER,
    hair_color_score INTEGER,
    eye_color_score INTEGER,
    freckles_score INTEGER,
    genetic_heritage_score INTEGER,
    burn_potential_score INTEGER,
    tan_potential_score INTEGER,
    total_score INTEGER,
    fitzpatrick_type INTEGER,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Zonas a tratar en depilación láser (relación 1:N con la ficha clínica)
CREATE TABLE laser_treatment_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    laser_record_id INTEGER NOT NULL,
    zone_name TEXT NOT NULL,
    FOREIGN KEY (laser_record_id) REFERENCES laser_clinical_records(id)
);
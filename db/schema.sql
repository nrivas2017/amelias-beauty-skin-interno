CREATE TABLE specialties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1
);

INSERT INTO specialties
(name, is_active)
VALUES
('Depilación', 1),
('Manicure', 1);

CREATE TABLE appointment_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO appointment_statuses
(name)
VALUES
('Pendiente de pago'),
('En tratamiento'),
('Finalizado');

CREATE TABLE session_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO session_statuses
(name)
VALUES
('Agendada'),
('Confirmada'),
('Cancelada por paciente'),
('Realizada');

CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    estimated_duration INTEGER,
    label_color TEXT DEFAULT '#3b82f6',
    is_active INTEGER DEFAULT 1
);

INSERT INTO services
(name, estimated_duration, label_color, is_active)
VALUES
('Láser cuerpo Completo', 120, '#3b82f6', 1);

CREATE TABLE staff ( -- Personal
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
);

INSERT INTO staff
(full_name, is_active)
VALUES
('María José Sandoval San Martín', 1),
('Mariana Sandoval San Martín', 1);

CREATE TABLE staff_specialties ( -- Especialidades del personal
    staff_id INTEGER,
    specialty_id INTEGER,
    PRIMARY KEY (staff_id, specialty_id),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);

INSERT INTO staff_specialties
(staff_id, specialty_id)
VALUES
(1, 1),
(2, 2);

CREATE TABLE patients ( -- Pacientes
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    age INTEGER,
    email TEXT UNIQUE,
    address TEXT,
    phone TEXT NOT NULL,
    pregnant_lactating INTEGER DEFAULT 0, -- embarazo
    allergies TEXT, -- alergias
    medical_treatment TEXT, -- tratamientos médicos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments ( -- Cita General
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER, -- Paciente
    service_id INTEGER, -- Servicio
    status_id INTEGER, -- Estado servicio
    total_price REAL, -- Valor promocial
    payment_method TEXT, -- Metodo pago
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (status_id) REFERENCES appointment_statuses(id)
);

CREATE TABLE sessions ( -- Sesiones
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER, -- Cita General
    staff_id INTEGER, -- Personal que atiende
    status_id INTEGER, -- Estado sesion
    start_date_time DATETIME NOT NULL, -- Inicio sesion
    end_date_time DATETIME NOT NULL, -- Fin sesion
    session_number INTEGER DEFAULT 1, -- nro sesion
    notes TEXT, -- notas
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (status_id) REFERENCES session_statuses(id)
);

CREATE TABLE laser_clinical_records ( -- ficha clinica depilacion laser
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER, -- paciente
    appointment_id INTEGER, -- cita general
    tattoos_zone TEXT, -- tatuajes
    photosensitive_meds TEXT, -- medicamento fotosensible
    implants_zone TEXT, -- injertos
    plates_prosthesis_zone TEXT, -- placas / protesis / marca pasos
    atypical_nevus_zone TEXT, -- nevus atipico
    skin_diseases TEXT, -- Ca, HTA, Epilepsia, etc.
    current_hair_removal_method TEXT, -- metodo depilacion actual
    skin_color_score INTEGER, -- color natural piel
    hair_color_score INTEGER, -- color natural pelo
    eye_color_score INTEGER, -- color ojos
    freckles_score INTEGER, -- pecas naturales
    genetic_heritage_score INTEGER, -- herencia genetica
    burn_potential_score INTEGER, -- potencial quemadura exposicion al sol
    tan_potential_score INTEGER, -- potencial bronceado
    total_score INTEGER,  -- puntaje fototipo
    fitzpatrick_type INTEGER,   -- Fototipo (Fitzpatrick) I al VI
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE laser_treatment_zones ( -- zonas a tratar
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    laser_record_id INTEGER,
    zone_name TEXT,
    FOREIGN KEY (laser_record_id) REFERENCES laser_clinical_records(id)
);
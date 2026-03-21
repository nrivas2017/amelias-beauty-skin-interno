import { Request, Response, NextFunction } from "express";
import db from "../config/database";
import { SPECIALTY_CODES } from "../config/specialtyCodes";

export const getLaserPatients = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Buscar todos los pacientes que tengan reservas con especialidad LASER_DEPILATION
    const patients = await db("patients")
      .distinct("patients.id", "patients.full_name", "patients.national_id")
      .join("appointments", "patients.id", "appointments.patient_id")
      .join("services", "appointments.service_id", "services.id")
      .join("specialties", "services.specialty_id", "specialties.id")
      .where("specialties.code", SPECIALTY_CODES.LASER_DEPILATION)
      .orderBy("patients.full_name", "asc");

    res.json(patients);
  } catch (err) {
    next(err);
  }
};

export const getLaserSessionsByPatient = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ message: "Se requiere un ID de paciente" });
    }

    // Obtener todas las sesiones de láser del paciente
    const sessions = await db("sessions")
      .select(
        "sessions.id",
        "sessions.appointment_id",
        "sessions.staff_id",
        "staff.full_name as staff_name",
        "sessions.start_date_time",
        "sessions.notes",
        "services.name as service_name",
      )
      .join("appointments", "sessions.appointment_id", "appointments.id")
      .join("services", "appointments.service_id", "services.id")
      .join("specialties", "services.specialty_id", "specialties.id")
      .leftJoin("staff", "sessions.staff_id", "staff.id")
      .where("appointments.patient_id", patientId)
      .andWhere("specialties.code", SPECIALTY_CODES.LASER_DEPILATION)
      .orderBy("sessions.start_date_time", "asc");

    if (sessions.length === 0) {
      return res.json([]);
    }

    const sessionIds = sessions.map((s) => s.id);

    // Obtener todos los parámetros de esas sesiones
    const parameters = await db("laser_session_parameters").whereIn(
      "session_id",
      sessionIds,
    );

    // Adjuntar los parámetros a cada sesión
    const sessionsWithParams = sessions.map((session) => {
      const sessionParams = parameters.filter(
        (p) => p.session_id === session.id,
      );
      return {
        ...session,
        parameters: sessionParams,
      };
    });

    res.json(sessionsWithParams);
  } catch (err) {
    next(err);
  }
};

export const upsertLaserParameters = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { sessionId, zoneId } = req.params;
    const {
      mole_or_tattoo,
      energy_j_cm2,
      pulse_width_ms,
      frequency,
      laser_intensity,
      machine_used,
      reevaluation_description,
      general_notes, // Se usará para actualizar sessions.notes
    } = req.body;

    if (!sessionId || !zoneId) {
      return res
        .status(400)
        .json({ message: "Se requiere sessionId y zoneId" });
    }

    // Actualizar las notas generales de la sesión si se enviaron
    if (general_notes !== undefined) {
      await db("sessions")
        .where({ id: sessionId })
        .update({ notes: general_notes });
    }

    // Verificar si ya existen parámetros para esta sesión y zona
    const existingParams = await db("laser_session_parameters")
      .where({ session_id: sessionId, zone_id: zoneId })
      .first();

    if (existingParams) {
      // Actualizar
      await db("laser_session_parameters")
        .where({ id: existingParams.id })
        .update({
          mole_or_tattoo,
          energy_j_cm2,
          pulse_width_ms,
          frequency,
          laser_intensity,
          machine_used,
          reevaluation_description,
        });
    } else {
      // Crear
      await db("laser_session_parameters").insert({
        session_id: sessionId,
        zone_id: zoneId,
        mole_or_tattoo,
        energy_j_cm2,
        pulse_width_ms,
        frequency,
        laser_intensity,
        machine_used,
        reevaluation_description,
      });
    }

    res.json({ message: "Parámetros actualizados exitosamente" });
  } catch (err) {
    next(err);
  }
};

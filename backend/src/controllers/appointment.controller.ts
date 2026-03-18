import { Request, Response, NextFunction } from "express";
import { Knex } from "knex";
import db from "../config/database";
import { isLaserSpecialty } from "../config/specialtyCodes";
import {
  getAppointmentStatusIdByCode,
  getSessionStatusIdByCode,
} from "../services/catalog.service";
import { SessionStatusCodes } from "../config/catalogCodes";
import { AppError } from "../utils/errors";

export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { date } = req.query;
    let query = db("sessions as s")
      .join("appointments as a", "s.appointment_id", "a.id")
      .join("patients as p", "a.patient_id", "p.id")
      .join("services as sv", "a.service_id", "sv.id")
      .join("specialties as sp", "sv.specialty_id", "sp.id")
      .join("staff as st", "s.staff_id", "st.id")
      .join("session_statuses as ss", "s.status_id", "ss.id")
      .select(
        "s.id",
        "s.appointment_id",
        "s.start_date_time",
        "s.end_date_time",
        "s.estimated_duration_minutes",
        "s.session_number",
        "s.notes",
        "s.close_notes",
        "p.id as patient_id",
        "p.full_name as patient_name",
        "sv.name as service_name",
        "sv.label_color",
        "sp.id as specialty_id",
        "sp.code as specialty_code",
        "st.id as staff_id",
        "st.full_name as staff_name",
        "ss.name as session_status",
        "ss.code as session_status_code",
        "ss.id as status_id",
      );

    if (date) query = query.whereRaw("date(s.start_date_time) = ?", [date]);

    res.json(await query);
  } catch (err) {
    next(err);
  }
};

export const getAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { patient_id, service_id, status_id, date_from, date_to } = req.query;

    let query = db("appointments as a")
      .join("patients as p", "a.patient_id", "p.id")
      .join("services as sv", "a.service_id", "sv.id")
      .join("specialties as sp", "sv.specialty_id", "sp.id")
      .join("appointment_statuses as ast", "a.status_id", "ast.id")
      .select(
        "a.id",
        "a.patient_id",
        "p.full_name as patient_name",
        "p.phone as patient_phone",
        "a.service_id",
        "sv.name as service_name",
        "sv.label_color",
        "sp.id as specialty_id",
        "sp.code as specialty_code",
        "sp.name as specialty_name",
        "a.status_id",
        "ast.name as status_name",
        "ast.code as status_code",
        "a.notes",
        "a.created_at",
      )
      .orderBy("a.created_at", "desc");

    if (patient_id) query = query.where("a.patient_id", patient_id);
    if (service_id) query = query.where("a.service_id", service_id);
    if (status_id) query = query.where("a.status_id", status_id);
    if (date_from)
      query = query.whereRaw("date(a.created_at) >= ?", [date_from]);
    if (date_to) query = query.whereRaw("date(a.created_at) <= ?", [date_to]);

    const appointments = await query;

    // Agregar conteo de sesiones para cada reserva
    const ids = appointments.map((a: any) => a.id);
    if (ids.length > 0) {
      const counts = await db("sessions")
        .whereIn("appointment_id", ids)
        .groupBy("appointment_id")
        .select("appointment_id")
        .count("id as session_count");

      const countMap: Record<number, number> = {};
      counts.forEach((c: any) => {
        countMap[c.appointment_id] = Number(c.session_count);
      });

      appointments.forEach((a: any) => {
        a.session_count = countMap[a.id] ?? 0;
      });
    }

    res.json(appointments);
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;

    const appointment = await db("appointments as a")
      .join("patients as p", "a.patient_id", "p.id")
      .join("services as sv", "a.service_id", "sv.id")
      .join("specialties as sp", "sv.specialty_id", "sp.id")
      .join("appointment_statuses as ast", "a.status_id", "ast.id")
      .select(
        "a.id",
        "a.patient_id",
        "p.full_name as patient_name",
        "p.phone as patient_phone",
        "p.email as patient_email",
        "a.service_id",
        "sv.name as service_name",
        "sv.label_color",
        "sp.id as specialty_id",
        "sp.code as specialty_code",
        "sp.name as specialty_name",
        "a.status_id",
        "ast.name as status_name",
        "ast.code as status_code",
        "a.notes",
        "a.created_at",
      )
      .where("a.id", id)
      .first();

    if (!appointment) {
      throw new AppError(`Reserva con ID ${id} no encontrada.`);
    }

    const sessions = await db("sessions as s")
      .join("appointments as a", "s.appointment_id", "a.id")
      .join("session_statuses as ss", "s.status_id", "ss.id")
      .join("staff as st", "s.staff_id", "st.id")
      .join("services as sv", "a.service_id", "sv.id")
      .join("specialties as sp", "sv.specialty_id", "sp.id")
      .join("patients as p", "a.patient_id", "p.id")
      .select(
        "s.id",
        "s.appointment_id",
        "s.session_number",
        "s.start_date_time",
        "s.end_date_time",
        "s.estimated_duration_minutes",
        "s.actual_start_time",
        "s.actual_end_time",
        "s.notes",
        "s.close_notes",
        "p.id as patient_id",
        "p.full_name as patient_name",
        "sv.name as service_name",
        "sv.label_color",
        "sp.id as specialty_id",
        "sp.code as specialty_code",
        "s.staff_id",
        "st.full_name as staff_name",
        "ss.name as session_status",
        "ss.code as session_status_code",
        "ss.id as status_id",
      )
      .where("s.appointment_id", id)
      .orderBy("s.session_number", "asc");

    // Incluir ficha láser si aplica
    let laserRecord = null;
    if (isLaserSpecialty(appointment.specialty_code)) {
      const record = await db("laser_clinical_records")
        .where({ appointment_id: id })
        .first();
      if (record) {
        const zones = await db("laser_treatment_zones").where({
          laser_record_id: record.id,
        });
        laserRecord = { ...record, zones };
      }
    }

    res.json({ ...appointment, sessions, laserRecord });
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { patient_id, service_id, notes, sessions, laserRecord } = req.body;

    if (!patient_id || !service_id || !sessions || sessions.length === 0) {
      throw new AppError(
        "patient_id, service_id y al menos una sesión son obligatorios.",
      );
    }

    // Validar que las sesiones no finalicen antes que inicien y estén en orden cronológico
    for (let i = 0; i < sessions.length; i++) {
      const curr = sessions[i];
      if (new Date(curr.end_date_time) <= new Date(curr.start_date_time)) {
        throw new AppError(
          `La sesión ${i + 1} no puede finalizar antes de iniciar.`,
        );
      }
    }

    // Validar que las sesiones estén en orden cronológico ascendente
    for (let i = 1; i < sessions.length; i++) {
      const prevStart = new Date(sessions[i - 1].start_date_time);
      const currStart = new Date(sessions[i].start_date_time);
      if (currStart < prevStart) {
        throw new AppError(
          `La sesión ${i + 1} no puede comenzar antes que la sesión ${i}. Las sesiones deben estar en orden cronológico ascendente.`,
        );
      }
    }

    const service = await db("services as s")
      .join("specialties as sp", "s.specialty_id", "sp.id")
      .select("s.specialty_id", "sp.code as specialty_code", "s.is_active")
      .where("s.id", service_id)
      .first();

    if (!service) {
      throw new AppError(`Servicio con ID ${service_id} no encontrado.`);
    }
    if (!service.is_active) {
      throw new AppError(`El servicio seleccionado no está activo.`);
    }

    const staffIds = sessions.map((s: any) => s.staff_id);
    const staffRecords = await db("staff")
      .whereIn("id", staffIds)
      .select("id", "is_active");
    const staffSpecialties = await db("staff_specialties").whereIn(
      "staff_id",
      staffIds,
    );

    for (let i = 0; i < sessions.length; i++) {
      const staffId = sessions[i].staff_id;
      const staff = staffRecords.find((s) => s.id === staffId);

      if (!staff) {
        throw new AppError(`Especialista con ID ${staffId} no encontrado.`);
      }
      if (!staff.is_active) {
        throw new AppError(`El especialista seleccionado no está activo.`);
      }

      if (service.specialty_id) {
        const hasSpec = staffSpecialties.some(
          (ss) =>
            ss.staff_id === staffId && ss.specialty_id === service.specialty_id,
        );
        if (!hasSpec) {
          throw new AppError(
            `El especialista no tiene la especialidad requerida para este servicio`,
          );
        }
      }
    }

    const inTreatmentId = await getAppointmentStatusIdByCode("IN_TREATMENT");
    const scheduledId = await getSessionStatusIdByCode("SCHEDULED");

    const result = await db.transaction(async (trx: Knex.Transaction) => {
      const [appointment_id] = await trx("appointments").insert({
        patient_id,
        service_id,
        status_id: inTreatmentId,
        notes: notes || null,
      });

      for (let i = 0; i < sessions.length; i++) {
        const sess = sessions[i];
        await trx("sessions").insert({
          appointment_id,
          staff_id: sess.staff_id,
          status_id: scheduledId,
          session_number: i + 1,
          start_date_time: sess.start_date_time,
          end_date_time: sess.end_date_time,
          estimated_duration_minutes: sess.estimated_duration_minutes || null,
          notes: sess.notes || null,
        });
      }

      if (isLaserSpecialty(service?.specialty_code) && laserRecord) {
        const [laser_record_id] = await trx("laser_clinical_records").insert({
          appointment_id,
          tattoos_zone: laserRecord.tattoos_zone || null,
          photosensitive_meds: laserRecord.photosensitive_meds || null,
          implants_zone: laserRecord.implants_zone || null,
          plates_prosthesis_zone: laserRecord.plates_prosthesis_zone || null,
          atypical_nevus_zone: laserRecord.atypical_nevus_zone || null,
          skin_diseases: laserRecord.skin_diseases || null,
          current_hair_removal_method:
            laserRecord.current_hair_removal_method || null,
          skin_color_score: laserRecord.skin_color_score || 0,
          hair_color_score: laserRecord.hair_color_score || 0,
          eye_color_score: laserRecord.eye_color_score || 0,
          freckles_score: laserRecord.freckles_score || 0,
          genetic_heritage_score: laserRecord.genetic_heritage_score || 0,
          burn_potential_score: laserRecord.burn_potential_score || 0,
          tan_potential_score: laserRecord.tan_potential_score || 0,
          total_score: laserRecord.total_score || 0,
          fitzpatrick_type: laserRecord.fitzpatrick_type || null,
        });

        if (laserRecord.zones && laserRecord.zones.length > 0) {
          for (const zone of laserRecord.zones) {
            await trx("laser_treatment_zones").insert({
              laser_record_id,
              zone_name: zone,
            });
          }
        }
      }

      return { appointment_id };
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const addSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      staff_id,
      start_date_time,
      end_date_time,
      estimated_duration_minutes,
      notes,
    } = req.body;

    const appointment = await db("appointments as a")
      .join("services as s", "a.service_id", "s.id")
      .select("a.*", "s.specialty_id")
      .where("a.id", id)
      .first();

    if (!appointment) {
      throw new AppError(`Reserva con ID ${id} no encontrada.`);
    }

    const staff = await db("staff").where({ id: staff_id }).first();
    if (!staff || !staff.is_active) {
      throw new AppError(`El especialista no está activo o no existe.`);
    }

    if (appointment.specialty_id) {
      const hasSpec = await db("staff_specialties")
        .where({ staff_id, specialty_id: appointment.specialty_id })
        .first();
      if (!hasSpec) {
        throw new AppError(
          "El especialista no tiene la especialidad requerida para este servicio",
        );
      }
    }

    if (new Date(end_date_time) <= new Date(start_date_time)) {
      throw new AppError(
        "La fecha y hora de fin debe ser posterior a la de inicio.",
      );
    }

    const cancelledByPatientId = await getSessionStatusIdByCode(
      SessionStatusCodes.CANCELLED_BY_PATIENT,
    );
    const cancelledByStaffId = await getSessionStatusIdByCode(
      SessionStatusCodes.CANCELLED_BY_STAFF,
    );

    // Buscar la sesión activa más reciente (no cancelada) para validar el orden cronológico
    const lastActiveSession = await db("sessions")
      .where({ appointment_id: id })
      .whereNotIn("status_id", [cancelledByPatientId, cancelledByStaffId])
      .orderBy("session_number", "desc")
      .first();

    if (lastActiveSession) {
      const lastStart = new Date(lastActiveSession.start_date_time);
      const newStart = new Date(start_date_time);
      if (newStart < lastStart) {
        throw new AppError(
          `La nueva sesión no puede comenzar antes que la sesión #${lastActiveSession.session_number} (${lastActiveSession.start_date_time}). Las sesiones deben estar en orden cronológico ascendente.`,
        );
      }
    }

    const result = await db("sessions")
      .where({ appointment_id: id })
      .max("session_number as max_number")
      .first();
    const nextNumber = (Number(result?.max_number) || 0) + 1;

    const scheduledId = await getSessionStatusIdByCode("SCHEDULED");

    const [session_id] = await db("sessions").insert({
      appointment_id: id,
      staff_id,
      status_id: scheduledId,
      session_number: nextNumber,
      start_date_time,
      end_date_time,
      estimated_duration_minutes: estimated_duration_minutes || null,
      notes: notes || null,
    });

    res.status(201).json({ session_id, session_number: nextNumber });
  } catch (err) {
    next(err);
  }
};

export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      staff_id,
      start_date_time,
      end_date_time,
      estimated_duration_minutes,
      status_id,
      notes,
      close_notes,
      actual_start_time,
      actual_end_time,
    } = req.body;

    const session = await db("sessions").where({ id: req.params.id }).first();
    if (!session) {
      throw new AppError(`Sesión con ID ${req.params.id} no encontrada.`);
    }

    if (staff_id !== undefined && staff_id !== "") {
      const staff = await db("staff").where({ id: staff_id }).first();
      if (!staff || !staff.is_active)
        return res
          .status(400)
          .json({ message: "El especialista no está activo o no existe" });

      const appointment = await db("appointments as a")
        .join("services as s", "a.service_id", "s.id")
        .select("s.specialty_id")
        .where("a.id", session.appointment_id)
        .first();

      if (appointment.specialty_id) {
        const hasSpec = await db("staff_specialties")
          .where({ staff_id, specialty_id: appointment.specialty_id })
          .first();
        if (!hasSpec) {
          throw new AppError(
            "El especialista no tiene la especialidad requerida para este servicio",
          );
        }
      }
    }

    const finalStart =
      start_date_time !== undefined ? start_date_time : session.start_date_time;
    const finalEnd =
      end_date_time !== undefined ? end_date_time : session.end_date_time;

    if (new Date(finalEnd) <= new Date(finalStart)) {
      throw new AppError(
        "La fecha y hora de fin debe ser posterior a la de inicio.",
      );
    }

    // Validar cronología si se cambia la fecha de inicio
    if (start_date_time !== undefined) {
      const allSessions = await db("sessions")
        .where({ appointment_id: session.appointment_id })
        .orderBy("session_number", "asc");

      const currentIndex = allSessions.findIndex((s) => s.id === session.id);

      if (currentIndex > 0) {
        const prevSession = allSessions[currentIndex - 1];
        if (new Date(start_date_time) < new Date(prevSession.start_date_time)) {
          throw new AppError(
            `La nueva fecha de inicio no puede ser anterior a la sesión #${prevSession.session_number} (${prevSession.start_date_time}).`,
          );
        }
      }

      if (currentIndex < allSessions.length - 1) {
        const nextSession = allSessions[currentIndex + 1];
        if (new Date(start_date_time) > new Date(nextSession.start_date_time)) {
          throw new AppError(
            `La nueva fecha de inicio no puede ser posterior a la sesión #${nextSession.session_number} (${nextSession.start_date_time}).`,
          );
        }
      }
    }

    const updateData: Record<string, any> = {};
    if (staff_id !== undefined && staff_id !== "")
      updateData.staff_id = staff_id;
    if (start_date_time !== undefined)
      updateData.start_date_time = start_date_time;
    if (end_date_time !== undefined) updateData.end_date_time = end_date_time;
    if (estimated_duration_minutes !== undefined)
      updateData.estimated_duration_minutes = estimated_duration_minutes;
    if (status_id !== undefined) updateData.status_id = status_id;
    if (notes !== undefined) updateData.notes = notes;
    if (close_notes !== undefined) updateData.close_notes = close_notes;
    if (actual_start_time !== undefined)
      updateData.actual_start_time = actual_start_time;
    if (actual_end_time !== undefined)
      updateData.actual_end_time = actual_end_time;

    await db("sessions").where({ id: req.params.id }).update(updateData);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { close_notes } = req.body;

    const cancelledAppointmentId =
      await getAppointmentStatusIdByCode("CANCELLED");
    const cancelledByStaffId =
      await getSessionStatusIdByCode("CANCELLED_BY_STAFF");
    const scheduledId = await getSessionStatusIdByCode("SCHEDULED");
    const confirmedId = await getSessionStatusIdByCode("CONFIRMED");

    await db.transaction(async (trx: Knex.Transaction) => {
      await trx("sessions")
        .where({ appointment_id: id })
        .whereIn("status_id", [scheduledId, confirmedId])
        .update({
          status_id: cancelledByStaffId,
          close_notes: close_notes || null,
        });
      await trx("appointments").where({ id }).update({
        status_id: cancelledAppointmentId,
      });
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const completeAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const appointment = await db("appointments").where({ id }).first();
    if (!appointment) {
      throw new AppError(`Reserva con ID ${id} no encontrada.`);
    }

    // Verificar que no queden sesiones pendientes usando los códigos del catálogo
    const scheduledId = await getSessionStatusIdByCode(
      SessionStatusCodes.SCHEDULED,
    );
    const confirmedId = await getSessionStatusIdByCode(
      SessionStatusCodes.CONFIRMED,
    );

    const pendingSessions = await db("sessions")
      .where({ appointment_id: id })
      .whereIn("status_id", [scheduledId, confirmedId]);

    if (pendingSessions.length > 0) {
      throw new AppError(
        `No se puede finalizar la reserva porque tiene ${pendingSessions.length} sesión(es) pendiente(s). Finaliza o cancela cada sesión antes de cerrar la reserva.`,
      );
    }

    const completedAppointmentId =
      await getAppointmentStatusIdByCode("COMPLETED");

    await db("appointments").where({ id }).update({
      status_id: completedAppointmentId,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const getLaserRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;
    const record = await db("laser_clinical_records")
      .where({ appointment_id: id })
      .first();

    if (!record) {
      throw new AppError(`Ficha láser con ID ${id} no encontrada.`);
    }

    const zones = await db("laser_treatment_zones").where({
      laser_record_id: record.id,
    });

    res.json({ ...record, zones });
  } catch (err) {
    next(err);
  }
};

export const updateLaserRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;
    const { zones, ...fields } = req.body;

    const record = await db("laser_clinical_records")
      .where({ appointment_id: id })
      .first();

    if (!record) {
      throw new AppError(`Ficha láser con ID ${id} no encontrada.`);
    }

    await db.transaction(async (trx: Knex.Transaction) => {
      await trx("laser_clinical_records")
        .where({ appointment_id: id })
        .update(fields);

      if (zones !== undefined) {
        await trx("laser_treatment_zones")
          .where({ laser_record_id: record.id })
          .delete();
        for (const zone of zones) {
          await trx("laser_treatment_zones").insert({
            laser_record_id: record.id,
            zone_name: zone,
          });
        }
      }
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const session = await db("sessions").where({ id }).first();
    if (!session) {
      throw new AppError(`Sesión con ID ${id} no encontrada.`);
    }

    const completedId = await getSessionStatusIdByCode("COMPLETED");
    const finalizedId = await getSessionStatusIdByCode("FINALIZED");

    if (
      session.status_id === completedId ||
      session.status_id === finalizedId
    ) {
      throw new AppError(
        "No se puede eliminar una sesión finalizada o completada.",
      );
    }

    await db("sessions").where({ id }).delete();

    res.json({ ok: true, message: "Sesión eliminada correctamente." });
  } catch (err) {
    next(err);
  }
};

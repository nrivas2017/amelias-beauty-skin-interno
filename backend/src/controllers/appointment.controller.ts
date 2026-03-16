import { Request, Response, NextFunction } from "express";
import db from "../config/database";

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
      .join("staff as st", "s.staff_id", "st.id")
      .join("session_statuses as ss", "s.status_id", "ss.id")
      .select(
        "s.id",
        "s.appointment_id",
        "s.start_date_time",
        "s.end_date_time",
        "s.session_number",
        "s.notes",
        "p.full_name as patient_name",
        "sv.name as service_name",
        "sv.label_color",
        "st.id as staff_id",
        "st.full_name as staff_name",
        "ss.name as session_status",
      );

    if (date) query = query.whereRaw("date(s.start_date_time) = ?", [date]);

    res.json(await query);
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      patient_id,
      service_id,
      total_price,
      payment_method,
      start_date_time,
      end_date_time,
      staff_id,
      notes,
    } = req.body;

    const result = await db.transaction(async (trx) => {
      const [appointment_id] = await trx("appointments").insert({
        patient_id,
        service_id,
        status_id: 1,
        total_price,
        payment_method,
      });
      await trx("sessions").insert({
        appointment_id,
        staff_id,
        status_id: 1,
        start_date_time,
        end_date_time,
        session_number: 1,
        notes,
      });
      return { appointment_id };
    });

    res.status(201).json(result);
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
    await db("sessions").where({ id: req.params.id }).update(req.body);
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
    await db.transaction(async (trx) => {
      await trx("sessions")
        .where({ appointment_id: id })
        .update({ status_id: 3 });
      await trx("appointments").where({ id }).update({ status_id: 3 });
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

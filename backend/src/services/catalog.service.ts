import db from "../config/database";
import {
  AppointmentStatusCode,
  SessionStatusCode,
} from "../config/catalogCodes";

export const getAppointmentStatusIdByCode = async (
  code: AppointmentStatusCode,
): Promise<number> => {
  const status = await db("appointment_statuses")
    .where("code", code)
    .select("id")
    .first();
  if (!status) {
    throw new Error(`Appointment status with code ${code} not found`);
  }
  return status.id;
};

export const getSessionStatusIdByCode = async (
  code: SessionStatusCode,
): Promise<number> => {
  const status = await db("session_statuses")
    .where("code", code)
    .select("id")
    .first();
  if (!status) {
    throw new Error(`Session status with code ${code} not found`);
  }
  return status.id;
};

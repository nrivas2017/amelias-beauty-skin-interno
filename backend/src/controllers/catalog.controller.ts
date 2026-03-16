import { Request, Response, NextFunction } from "express";
import db from "../config/database";

export const getAppointmentStatuses = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await db("appointment_statuses"));
  } catch (err) {
    next(err);
  }
};

export const getSessionStatuses = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await db("session_statuses"));
  } catch (err) {
    next(err);
  }
};

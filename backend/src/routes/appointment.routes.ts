import { Router } from "express";
import * as AppointmentController from "../controllers/appointment.controller";

const router = Router();

// @route  GET /api/appointments/sessions
// @desc
// @access Public
router.get("/sessions", AppointmentController.getSessions);

// @route  POST /api/appointments
// @desc
// @access Public
router.post("/", AppointmentController.createAppointment);

// @route  PATCH /api/appointments/sessions/:id
// @desc
// @access Public
router.patch("/sessions/:id", AppointmentController.updateSession);

// @route  DELETE /api/appointments/:id
// @desc
// @access Public
router.delete("/:id", AppointmentController.cancelAppointment);

export default router;

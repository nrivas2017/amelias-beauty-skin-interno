import { Router } from "express";
import * as AppointmentController from "../controllers/appointment.controller";

const router = Router();

// @route  GET /api/appointments/sessions/sessions?date=YYYY-MM-DD
// @desc
// @access Public
router.get("/sessions", AppointmentController.getSessions);

// @route  GET /api/appointments?patient_id=&service_id=&status_id=&date_from=&date_to=
// @desc
// @access Public
router.get("/", AppointmentController.getAppointments);

// @route  GET /api/appointments/:id
// @desc
// @access Public
router.get("/:id", AppointmentController.getAppointmentById);

// @route  POST /api/appointments
// @desc
// @access Public
router.post("/", AppointmentController.createAppointment);

// @route  POST /api/appointments/:id/sessions
// @desc
// @access Public
router.post("/:id/sessions", AppointmentController.addSession);

// @route  PATCH /api/appointments/sessions/:id
// @desc
// @access Public
router.patch("/sessions/:id", AppointmentController.updateSession);

// @route  DELETE /api/appointments/sessions/:id
// @desc   Elimina una sesión si no está finalizada
// @access Public
router.delete("/sessions/:id", AppointmentController.deleteSession);

// @route  PATCH /api/appointments/:id/cancel
// @desc
// @access Public
router.patch("/:id/cancel", AppointmentController.cancelAppointment);

// @route  PATCH /api/appointments/:id/complete
// @desc   Finaliza una reserva (solo si no tiene sesiones pendientes)
// @access Public
router.patch("/:id/complete", AppointmentController.completeAppointment);

// @route  GET /api/appointments/:id/laser-record
// @desc
// @access Public
router.get("/:id/laser-record", AppointmentController.getLaserRecord);

// @route  PATCH /api/appointments/:id/laser-record
// @desc
// @access Public
router.patch("/:id/laser-record", AppointmentController.updateLaserRecord);

export default router;

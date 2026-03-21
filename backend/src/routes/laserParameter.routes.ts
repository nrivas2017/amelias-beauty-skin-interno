import { Router } from "express";
import {
  getLaserPatients,
  getLaserSessionsByPatient,
  upsertLaserParameters,
} from "../controllers/laserParameter.controller";

const router = Router();

// @route  GET /api/laser-parameters/patients
// @desc   Obtener lista de pacientes que han tomado depilación láser
router.get("/patients", getLaserPatients);

// @route  GET /api/laser-parameters/patients/:patientId/sessions
// @desc   Obtener todas las sesiones láser de un paciente con sus parámetros
router.get("/patients/:patientId/sessions", getLaserSessionsByPatient);

// @route  PUT /api/laser-parameters/sessions/:sessionId/zones/:zoneId
// @desc   Actualizar o guardar parámetros de láser para una sesión y zona
router.put("/sessions/:sessionId/zones/:zoneId", upsertLaserParameters);

export default router;

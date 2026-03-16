import { Router } from "express";
import * as PatientController from "../controllers/patient.controller";

const router = Router();

// @route  GET /api/patients
// @desc
// @access Public
router.get("/", PatientController.getPatients);

// @route  POST /api/patients
// @desc
// @access Public
router.post("/", PatientController.createPatient);

// @route  PATCH /api/patients/:id
// @desc
// @access Public
router.patch("/:id", PatientController.updatePatient);

export default router;

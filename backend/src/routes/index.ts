import { Router } from "express";
import catalogRoutes from "./catalog.routes";
import appointmentRoutes from "./appointment.routes";
import patientRoutes from "./patient.routes";
import serviceRoutes from "./service.routes";
import staffRoutes from "./staff.routes";
import specialtyRoutes from "./specialty.routes";

const router = Router();

// @route  /api/catalogs
router.use("/catalogs", catalogRoutes);

// @route  /api/appointments
router.use("/appointments", appointmentRoutes);

// @route  /api/patients
router.use("/patients", patientRoutes);

// @route  /api/services
router.use("/services", serviceRoutes);

// @route  /api/staff
router.use("/staff", staffRoutes);

// @route  /api/specialties
router.use("/specialties", specialtyRoutes);

export default router;

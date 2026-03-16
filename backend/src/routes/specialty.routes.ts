import { Router } from "express";
import * as SpecialtyController from "../controllers/specialty.controller";

const router = Router();

// @route   GET /api/specialties
router.get("/", SpecialtyController.getSpecialties);

// @route   POST /api/specialties
router.post("/", SpecialtyController.createSpecialty);

// @route   PATCH /api/specialties/:id
router.patch("/:id", SpecialtyController.updateSpecialty);

export default router;

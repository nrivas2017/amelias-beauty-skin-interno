import { Router } from "express";
import * as SpecialtyController from "../controllers/specialty.controller";

const router = Router();

// @route  GET /api/specialties
// @desc
// @access Public
router.get("/", SpecialtyController.getSpecialties);

// @route  POST /api/specialties
// @desc
// @access Public
router.post("/", SpecialtyController.createSpecialty);

// @route  PATCH /api/specialties/:id
// @desc
// @access Public
router.patch("/:id", SpecialtyController.updateSpecialty);

export default router;

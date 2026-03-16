import { Router } from "express";
import * as StaffController from "../controllers/staff.controller";

const router = Router();

// @route  GET /api/staff
// @desc
// @access Public
router.get("/", StaffController.getStaff);

// @route  POST /api/staff
// @desc
// @access Public
router.post("/", StaffController.createStaff);

// @route  PATCH /api/staff/:id
// @desc
// @access Public
router.patch("/:id", StaffController.updateStaff);

export default router;

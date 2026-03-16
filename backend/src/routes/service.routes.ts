import { Router } from "express";
import * as ServiceController from "../controllers/service.controller";

const router = Router();

// @route  GET /api/services
// @desc
// @access Public
router.get("/", ServiceController.getServices);

// @route  POST /api/services
// @desc
// @access Public
router.post("/", ServiceController.createService);

// @route  PATCH /api/services/:id
// @desc
// @access Public
router.patch("/:id", ServiceController.updateService);

export default router;

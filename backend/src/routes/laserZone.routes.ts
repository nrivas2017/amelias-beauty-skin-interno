import { Router } from "express";
import {
  getLaserZones,
  createLaserZone,
  updateLaserZone,
} from "../controllers/laserZone.controller";

const router = Router();

// @route  GET /api/laser-zones
// @desc   Obtener todas las zonas láse
router.get("/", getLaserZones);

// @route  POST /api/laser-zones
// @desc   Crear nueva zona láser
router.post("/", createLaserZone);

// @route  PUT /api/laser-zones/:id
// @desc   Actualizar zona láser
router.put("/:id", updateLaserZone);

export default router;

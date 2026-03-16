import { Router } from "express";
import * as CatalogController from "../controllers/catalog.controller";

const router = Router();

//@Route    GET /api/catalogs/appointment-statuses
// @desc
// @access Public
router.get("/appointment-statuses", CatalogController.getAppointmentStatuses);

//@Route    GET /api/catalogs/session-statuses
// @desc
// @access Public
router.get("/session-statuses", CatalogController.getSessionStatuses);

export default router;

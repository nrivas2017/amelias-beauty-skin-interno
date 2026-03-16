import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error(err.message || "Error inesperado", {
    status: err.status,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
};

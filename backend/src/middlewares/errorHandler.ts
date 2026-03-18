import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = err.status || 500;
  const message = err.message || "Error interno del servidor";

  logger.error(`${message}`, {
    status: status,
    stack: err.stack,
  });

  res.status(status).json({
    status: "error",
    message: message,
  });
};

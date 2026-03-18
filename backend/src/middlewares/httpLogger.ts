import morgan from "morgan";
import { Request, Response } from "express";
import logger from "../config/logger";

const skipFn = (_req: Request, _res: Response) => {
  return process.env.NODE_ENV === "test";
};

export const httpLogger = morgan(":method :url :status :response-time ms", {
  skip: skipFn,
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
});

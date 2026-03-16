import morgan from "morgan";
import logger from "../config/logger";
import { Request, Response } from "express";

const morganStream = {
  write: (message: string) => {
    logger.http(message.trimEnd());
  },
};

const morganFormat =
  ":method :url :status :res[content-length] bytes — :response-time ms";

const skipFn = (_req: Request, _res: Response) => {
  return process.env.NODE_ENV === "test";
};

export const httpLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: skipFn,
});

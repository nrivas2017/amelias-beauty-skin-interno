import winston from "winston";
import { env } from "./env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "warn" : "debug",
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        consoleFormat,
      ),
    }),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: jsonFormat,
    }),

    new winston.transports.File({
      filename: "logs/combined.log",
      format: jsonFormat,
    }),
  ],
});

export default logger;

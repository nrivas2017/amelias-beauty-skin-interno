import dotenv from "dotenv";
import path from "path";

dotenv.config();

interface EnvConfig {
  PORT: number;
  DB_PATH: string;
  NODE_ENV: string;
}

const getConfig = (): EnvConfig => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const defaultDbPath = path.resolve(__dirname, "../../../db/amelias.db");
  const DB_PATH = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : defaultDbPath;

  const NODE_ENV = process.env.NODE_ENV || "development";

  return {
    PORT,
    DB_PATH,
    NODE_ENV,
  };
};

export const env = getConfig();

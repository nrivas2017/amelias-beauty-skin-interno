import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

interface EnvConfig {
  PORT: number;
  DB_PATH: string;
  NODE_ENV: string;
}

const getConfig = (): EnvConfig => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const NODE_ENV = process.env.NODE_ENV || "development";

  let DB_PATH = "";
  const isElectron = process.versions.hasOwnProperty("electron");

  const bundledDbPath = isElectron
    ? path.join(__dirname, "../../db/amelias.db")
    : path.resolve(__dirname, "../../../db/amelias.db");

  if (isElectron) {
    const { app } = require("electron");

    const userDataPath = app.getPath("userData");
    const dbDir = path.join(userDataPath, "database");

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    DB_PATH = path.join(dbDir, "amelias.db");

    if (!fs.existsSync(DB_PATH)) {
      if (fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, DB_PATH);
        console.log(
          "Database successfully copied to a secure environment:",
          DB_PATH,
        );
      } else {
        console.error(
          "Error: The original database was not found at:",
          bundledDbPath,
        );
      }
    }
  } else {
    DB_PATH = process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : bundledDbPath;
  }

  return {
    PORT,
    DB_PATH,
    NODE_ENV,
  };
};

export const env = getConfig();

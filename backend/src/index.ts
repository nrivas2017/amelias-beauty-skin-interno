import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { httpLogger } from "./middlewares/httpLogger";
import { env } from "./config/env";
import logger from "./config/logger";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

app.use(httpLogger);

app.use("/api", routes);

// --- Serve frontend for Electron ---
const isPackaged = __dirname.includes("app.asar");

const frontendPath = isPackaged
  ? path.join(__dirname, "../frontend")
  : path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendPath));

app.get(/.*/, (_, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
// -----------------------------------

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(
    `Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`,
  );
});

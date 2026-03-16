import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { httpLogger } from "./middlewares/httpLogger";
import { env } from "./config/env";
import logger from "./config/logger";

const app = express();

app.use(cors());
app.use(express.json());

app.use(httpLogger);

app.use("/api", routes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(
    `Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`,
  );
});

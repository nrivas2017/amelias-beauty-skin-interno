import knex from "knex";
import { env } from "./env";

const db = knex({
  client: "better-sqlite3",
  connection: {
    filename: env.DB_PATH,
  },
  useNullAsDefault: true,
});

export default db;

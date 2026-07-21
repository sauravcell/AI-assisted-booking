import { Pool } from "pg";
import { config } from "../config";

export const db = new Pool({
  host: config.DATABASE_HOST,

  port: config.DATABASE_PORT,

  database: config.DATABASE_NAME,

  user: config.DATABASE_USER,

  password: config.DATABASE_PASSWORD,

  max: 10,
});

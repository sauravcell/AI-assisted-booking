import { Pool, types } from "pg";
import { config } from "../config";

/**
 * By default node-postgres parses DATE columns into a JS Date at
 * local midnight, which then serializes shifted by a day in any
 * timezone behind UTC. We only ever want the raw "YYYY-MM-DD" the
 * server sent, so keep it as a string (OID 1082 = date).
 */
types.setTypeParser(1082, (value) => value);

export const db = new Pool({
  host: config.DATABASE_HOST,

  port: config.DATABASE_PORT,

  database: config.DATABASE_NAME,

  user: config.DATABASE_USER,

  password: config.DATABASE_PASSWORD,

  max: 10,
});

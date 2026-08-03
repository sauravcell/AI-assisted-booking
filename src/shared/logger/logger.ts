import pino from "pino";

import { config } from "../../config";

/**
 * process.env.NODE_ENV is never actually set (not in .env, not in
 * the `dev` script), so it reads as undefined rather than
 * "development" - falling through to the "info" level below and
 * silently dropping every debug log. config.NODE_ENV already
 * defaults to "development" via its Zod schema, so read the
 * resolved config instead of the raw env var.
 */
const isDevelopment = config.NODE_ENV === "development";

export const logger = pino({
  level: isDevelopment ? "debug" : "info",

  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      }
    : undefined,
});

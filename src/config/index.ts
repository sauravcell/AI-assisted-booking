import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(3000),

  DATABASE_HOST: z.string(),

  DATABASE_PORT: z.coerce.number(),

  DATABASE_NAME: z.string(),

  DATABASE_USER: z.string(),

  DATABASE_PASSWORD: z.string(),

  TELEGRAM_BOT_TOKEN: z.string(),

  GROQ_API_KEY: z.string(),

  GROQ_MODEL: z.string(),

  LANGSMITH_API_KEY: z.string(),

  LANGSMITH_TRACING: z.enum(["true", "false"]).default("true"),

  LANGSMITH_PROJECT: z.string(),
});

export const config = envSchema.parse(process.env);

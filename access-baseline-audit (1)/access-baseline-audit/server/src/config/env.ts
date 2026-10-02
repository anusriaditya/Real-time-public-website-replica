import "dotenv/config";
import { z } from "zod";

/**
 * Every environment variable the server depends on is declared here, once.
 * If something required is missing or malformed, we crash on boot with a
 * readable message instead of failing later with a cryptic runtime error
 * three requests into a demo.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DB_PATH: z.string().min(1).default("./data/app.db"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
};

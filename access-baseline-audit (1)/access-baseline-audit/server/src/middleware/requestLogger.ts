import { pinoHttp } from "pino-http";
import { env } from "../config/env.js";

export const requestLogger = pinoHttp({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
      : undefined,
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

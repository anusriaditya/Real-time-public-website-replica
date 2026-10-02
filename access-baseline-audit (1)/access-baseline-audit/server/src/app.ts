import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { serviceStatusRouter } from "./modules/service-status/service-status.routes.js";

export function createApp(): Express {
  const app = express();

  // Order matters here: security headers and logging wrap everything;
  // CORS must run before routes; body parsing before anything that reads
  // req.body; the error handler is registered LAST so Express recognizes
  // it as an error middleware and routes thrown/async errors to it.
  app.use(helmet());
  app.use(requestLogger);
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptimeSeconds: process.uptime() });
  });

  app.use("/api/service-alerts", serviceStatusRouter);

  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Route not found" } });
  });

  app.use(errorHandler);

  return app;
}

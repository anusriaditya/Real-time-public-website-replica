import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDb, getDb } from "./db/client.js";

// Touch the DB once at boot so migrations run and a bad DB_PATH fails
// loudly here, not on the first incoming request.
getDb();

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  console.log(`[server] received ${signal}, shutting down...`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });

  // Don't hang forever if a connection refuses to drain.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

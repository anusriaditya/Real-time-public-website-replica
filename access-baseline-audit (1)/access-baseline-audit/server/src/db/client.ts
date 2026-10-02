import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { env } from "../config/env.js";

let db: Database.Database | null = null;

/**
 * Lazily opens a single shared connection. better-sqlite3 is synchronous
 * and file-backed, which is the right trade-off for a service this size:
 * no connection pool to misconfigure, no async driver overhead, and the
 * whole dataset fits in memory anyway. Swap this module for a
 * postgres.ts (pg/Drizzle) if the service ever needs concurrent writers
 * or to live outside a single instance -- the module boundary is
 * intentionally the *only* place that decision is made.
 */
export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = resolve(process.cwd(), env.DB_PATH);
  mkdirSync(dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  return db;
}

function runMigrations(connection: Database.Database): void {
  connection.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
  );

  const migrationFile = "001_init.sql";
  const alreadyApplied = connection
    .prepare("SELECT 1 FROM _migrations WHERE name = ?")
    .get(migrationFile);

  if (alreadyApplied) return;

  const migrationPath = resolve(import.meta.dirname, "migrations", migrationFile);
  const sql = readFileSync(migrationPath, "utf-8");

  const applyMigration = connection.transaction(() => {
    connection.exec(sql);
    connection
      .prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)")
      .run(migrationFile, new Date().toISOString());
  });

  applyMigration();
}

export function closeDb(): void {
  db?.close();
  db = null;
}

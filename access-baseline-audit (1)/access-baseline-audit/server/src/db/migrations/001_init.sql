CREATE TABLE IF NOT EXISTS service_alerts (
  id TEXT PRIMARY KEY,
  route_code TEXT NOT NULL,
  route_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('on_time', 'delayed', 'disrupted', 'suspended')),
  message TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_alerts_status ON service_alerts (status);

-- Seed rows so the vertical slice is demoable immediately after `pnpm dev`,
-- without needing a separate seeding step for a take-home review.
INSERT OR IGNORE INTO service_alerts (id, route_code, route_name, status, message, updated_at)
VALUES
  ('a3f1c2b0-1111-4a11-9c11-000000000001', '5C', 'Broadway - Besant Nagar', 'on_time', 'Running as scheduled.', '2026-09-13T04:00:00.000Z'),
  ('a3f1c2b0-1111-4a11-9c11-000000000002', '18B', 'Thiruvanmiyur - T. Nagar', 'delayed', 'Approx. 12 min delay due to signal maintenance on Anna Salai.', '2026-09-13T04:05:00.000Z'),
  ('a3f1c2b0-1111-4a11-9c11-000000000003', 'M55', 'Tambaram - Koyambedu', 'disrupted', 'Diverted via GST Road due to waterlogging near Chromepet.', '2026-09-13T03:50:00.000Z');

import { ServiceAlertSchema, type ServiceAlert } from "@access-audit/shared";
import { getDb } from "../../db/client.js";

interface ServiceAlertRow {
  id: string;
  route_code: string;
  route_name: string;
  status: string;
  message: string;
  updated_at: string;
}

function rowToAlert(row: ServiceAlertRow): ServiceAlert {
  // Validate at the boundary: if the DB ever contains a row that doesn't
  // match the contract (bad migration, manual edit, corrupted data), we
  // find out here with a clear error -- not downstream in the client
  // after it's already rendered garbage to a user.
  return ServiceAlertSchema.parse({
    id: row.id,
    routeCode: row.route_code,
    routeName: row.route_name,
    status: row.status,
    message: row.message,
    updatedAt: row.updated_at,
  });
}

export function listServiceAlerts(): ServiceAlert[] {
  const rows = getDb()
    .prepare(
      `SELECT id, route_code, route_name, status, message, updated_at
       FROM service_alerts
       ORDER BY updated_at DESC`
    )
    .all() as ServiceAlertRow[];

  return rows.map(rowToAlert);
}

export function getServiceAlertById(id: string): ServiceAlert | null {
  const row = getDb()
    .prepare(
      `SELECT id, route_code, route_name, status, message, updated_at
       FROM service_alerts
       WHERE id = ?`
    )
    .get(id) as ServiceAlertRow | undefined;

  return row ? rowToAlert(row) : null;
}

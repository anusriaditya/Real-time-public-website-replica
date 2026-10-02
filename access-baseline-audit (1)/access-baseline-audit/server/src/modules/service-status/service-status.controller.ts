import type { Request, Response } from "express";
import { ServiceAlertListResponseSchema } from "@access-audit/shared";
import { getServiceAlertById, listServiceAlerts } from "./service-status.service.js";

export function getServiceAlerts(_req: Request, res: Response): void {
  const alerts = listServiceAlerts();

  const payload = ServiceAlertListResponseSchema.parse({
    data: alerts,
    meta: {
      count: alerts.length,
      generatedAt: new Date().toISOString(),
    },
  });

  res.json(payload);
}

export function getServiceAlert(req: Request, res: Response): void {
  const alert = getServiceAlertById(req.params.id ?? "");

  if (!alert) {
    res.status(404).json({
      ok: false,
      error: { code: "ALERT_NOT_FOUND", message: `No alert with id ${req.params.id}` },
    });
    return;
  }

  res.json({ ok: true, data: alert });
}

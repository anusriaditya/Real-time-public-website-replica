import { ServiceAlertListResponseSchema, type ServiceAlert } from "@access-audit/shared";

export type FetchAlertsResult =
  | { ok: true; alerts: ServiceAlert[] }
  | { ok: false; error: string };

export async function fetchServiceAlerts(): Promise<FetchAlertsResult> {
  try {
    const res = await fetch("/api/service-alerts");

    if (!res.ok) {
      return { ok: false, error: `Server responded with ${res.status}` };
    }

    const json = await res.json();
    // Re-validate on the client too: the shared schema is cheap insurance
    // against a server deploy drifting out of sync with the client build.
    const parsed = ServiceAlertListResponseSchema.parse(json);
    return { ok: true, alerts: parsed.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown network error",
    };
  }
}

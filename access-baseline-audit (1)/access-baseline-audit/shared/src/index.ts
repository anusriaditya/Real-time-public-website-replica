import { z } from "zod";

/**
 * Shared contract for the "service status" vertical slice.
 *
 * This is the ONE place the shape of a service alert is defined. The server
 * validates incoming/outgoing data against `ServiceAlertSchema` at runtime,
 * and the client imports the same schema to get compile-time types for free.
 * If the contract changes, both sides break at build time instead of at 2am
 * in production.
 */
export const ServiceAlertSchema = z.object({
  id: z.string().uuid(),
  routeCode: z.string().min(1).max(12),
  routeName: z.string().min(1).max(120),
  status: z.enum(["on_time", "delayed", "disrupted", "suspended"]),
  message: z.string().max(280),
  updatedAt: z.string().datetime(),
});

export type ServiceAlert = z.infer<typeof ServiceAlertSchema>;

export const ServiceAlertListResponseSchema = z.object({
  data: z.array(ServiceAlertSchema),
  meta: z.object({
    count: z.number().int().nonnegative(),
    generatedAt: z.string().datetime(),
  }),
});

export type ServiceAlertListResponse = z.infer<typeof ServiceAlertListResponseSchema>;

/**
 * Generic envelope for anything the API returns. Keeping error and success
 * shapes distinct (rather than `{ data: T | null, error: string | null }`)
 * means consumers can't accidentally read `data` on a failed response
 * without TypeScript narrowing forcing them to check `ok` first.
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export const STATUS_LABELS: Record<ServiceAlert["status"], string> = {
  on_time: "Running on time",
  delayed: "Delayed",
  disrupted: "Service disrupted",
  suspended: "Service suspended",
};

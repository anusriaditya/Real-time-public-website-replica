import { STATUS_LABELS, type ServiceAlert } from "@access-audit/shared";

const STATUS_ICON: Record<ServiceAlert["status"], string> = {
  on_time: "✓",
  delayed: "⏱",
  disrupted: "⚠",
  suspended: "✕",
};

interface ServiceAlertListProps {
  alerts: ServiceAlert[];
}

export function ServiceAlertList({ alerts }: ServiceAlertListProps) {
  if (alerts.length === 0) {
    return <p>No active route alerts right now.</p>;
  }

  return (
    <ul className="alert-list" aria-label="Bus route status list">
      {alerts.map((alert) => (
        <li key={alert.id} className={`alert-card alert-card--${alert.status}`}>
          {/*
            Direct remediation for Audit Issue #2 (docs/accessibility-audit-report.md):
            every item gets a distinct, descriptive accessible name (route +
            status), instead of every item in a list sharing one generic
            label like "direction". A screen reader user can now tell these
            apart without opening each one.
          */}
          <h3 className="alert-card__route">
            {alert.routeCode} · {alert.routeName}
          </h3>
          <p className="alert-card__status">
            <span aria-hidden="true">{STATUS_ICON[alert.status]}</span>{" "}
            <strong>{STATUS_LABELS[alert.status]}</strong>
          </p>
          <p className="alert-card__message">{alert.message}</p>
        </li>
      ))}
    </ul>
  );
}

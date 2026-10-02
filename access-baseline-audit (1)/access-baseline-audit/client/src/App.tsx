import { useEffect, useState } from "react";
import type { ServiceAlert } from "@access-audit/shared";
import { Header } from "./components/Header";
import { ServiceAlertList } from "./components/ServiceAlertList";
import { SkipLink } from "./components/SkipLink";
import { fetchServiceAlerts } from "./lib/api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; alerts: ServiceAlert[] };

export function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchServiceAlerts().then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", alerts: result.alerts }
          : { status: "error", message: result.error }
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SkipLink />
      <Header />

      {/*
        Direct remediation for Audit Issue #5 (docs/accessibility-audit-report.md):
        exactly one <h1> per page, and every section below it steps down
        one level at a time (h1 -> h2 -> h3 in ServiceAlertList). A screen
        reader user can now jump straight to "Route status" using their
        heading-navigation shortcut instead of reading the whole page top
        to bottom to find it.
      */}
      <main id="main-content">
        <h1>Route status</h1>
        <p>Live status for city bus routes, refreshed from the depot feed.</p>

        {/* Polite live region: announces state changes without interrupting
            whatever the screen reader is currently reading. */}
        <div role="status" aria-live="polite">
          {state.status === "loading" && <p>Loading route status…</p>}
          {state.status === "error" && (
            <p role="alert">Couldn't load route status: {state.message}</p>
          )}
        </div>

        {state.status === "ready" && (
          <section aria-labelledby="alerts-heading">
            <h2 id="alerts-heading">Active alerts</h2>
            <ServiceAlertList alerts={state.alerts} />
          </section>
        )}
      </main>

      <footer>
        <p>
          Independent status dashboard. Not affiliated with{" "}
          <a href="https://mtcbus.tn.gov.in">Metropolitan Transport Corporation (Chennai) Ltd</a>.
        </p>
      </footer>
    </>
  );
}

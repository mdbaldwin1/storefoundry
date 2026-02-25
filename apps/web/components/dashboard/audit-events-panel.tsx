"use client";

import { useMemo, useState } from "react";
import type { AuditEventRecord } from "@/types/database";

type AuditEventsPanelProps = {
  initialEvents: Array<Pick<AuditEventRecord, "id" | "action" | "entity" | "entity_id" | "metadata" | "created_at">>;
};

type AuditEventsResponse = {
  events?: Array<Pick<AuditEventRecord, "id" | "action" | "entity" | "entity_id" | "metadata" | "created_at">>;
  error?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function AuditEventsPanel({ initialEvents }: AuditEventsPanelProps) {
  const [events, setEvents] = useState(initialEvents);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonActions = useMemo(() => {
    return [...new Set(initialEvents.map((event) => event.action))].slice(0, 8);
  }, [initialEvents]);

  async function applyFilters() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: "50" });

    if (actionFilter.trim().length > 0) {
      params.set("action", actionFilter.trim());
    }

    if (entityFilter.trim().length > 0) {
      params.set("entity", entityFilter.trim());
    }

    const response = await fetch(`/api/audit-events?${params.toString()}`, { method: "GET" });
    const payload = (await response.json()) as AuditEventsResponse;

    setLoading(false);

    if (!response.ok || !payload.events) {
      setError(payload.error ?? "Unable to load audit events.");
      return;
    }

    setEvents(payload.events);
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/80 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Recent Audit Events</h2>
        <p className="text-sm text-muted-foreground">
          Track sensitive merchant actions for support investigations and operational confidence.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1">
          <label htmlFor="audit-action" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Action
          </label>
          <input
            id="audit-action"
            list="audit-actions"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            placeholder="promotion.created"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <datalist id="audit-actions">
            {commonActions.map((action) => (
              <option key={action} value={action} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1">
          <label htmlFor="audit-entity" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Entity
          </label>
          <input
            id="audit-entity"
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value)}
            placeholder="order"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => void applyFilters()}
          disabled={loading}
          className="h-fit self-end rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ul className="space-y-2">
        {events.length === 0 ? (
          <li className="rounded-md border border-border bg-muted/25 px-3 py-2 text-sm text-muted-foreground">No events found.</li>
        ) : (
          events.map((event) => (
            <li key={event.id} className="space-y-2 rounded-md border border-border bg-muted/25 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-border bg-background px-2 py-0.5 font-medium">{event.action}</span>
                <span className="rounded-full border border-border bg-background px-2 py-0.5">{event.entity}</span>
                {event.entity_id ? (
                  <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted-foreground">{event.entity_id}</span>
                ) : null}
                <span className="ml-auto text-muted-foreground">{formatDate(event.created_at)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{JSON.stringify(event.metadata)}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

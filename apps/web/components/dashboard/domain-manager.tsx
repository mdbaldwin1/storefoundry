"use client";

import { useState } from "react";
import { FEATURES } from "@/config/features";
import type { StoreDomainRecord } from "@/types/database";

type DomainManagerProps = {
  initialDomains: Array<Pick<StoreDomainRecord, "id" | "domain" | "is_primary" | "verification_status">>;
};

type DomainResponse = {
  domain?: Pick<StoreDomainRecord, "id" | "domain" | "is_primary" | "verification_status">;
  deleted?: boolean;
  error?: string;
};

export function DomainManager({ initialDomains }: DomainManagerProps) {
  const manualVerifyEnabled = FEATURES.manualDomainVerification;
  const [domains, setDomains] = useState(initialDomains);
  const [domainInput, setDomainInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addDomain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/stores/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domainInput, isPrimary: domains.length === 0 })
    });

    const payload = (await response.json()) as DomainResponse;

    setSaving(false);

    if (!response.ok || !payload.domain) {
      setError(payload.error ?? "Unable to add domain.");
      return;
    }

    setDomains((current) => [payload.domain!, ...current]);
    setDomainInput("");
  }

  async function makePrimary(domainId: string) {
    setError(null);

    const response = await fetch("/api/stores/domains", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId, isPrimary: true })
    });

    const payload = (await response.json()) as DomainResponse;

    if (!response.ok || !payload.domain) {
      setError(payload.error ?? "Unable to set primary domain.");
      return;
    }

    setDomains((current) => current.map((domain) => ({ ...domain, is_primary: domain.id === domainId })));
  }

  async function markVerified(domainId: string) {
    setError(null);

    const response = await fetch("/api/stores/domains", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId, verificationStatus: "verified" })
    });

    const payload = (await response.json()) as DomainResponse;

    if (!response.ok || !payload.domain) {
      setError(payload.error ?? "Unable to verify domain.");
      return;
    }

    setDomains((current) =>
      current.map((domain) => (domain.id === domainId ? { ...domain, verification_status: "verified" } : domain))
    );
  }

  async function removeDomain(domainId: string) {
    setError(null);

    const response = await fetch("/api/stores/domains", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId })
    });

    const payload = (await response.json()) as DomainResponse;

    if (!response.ok || !payload.deleted) {
      setError(payload.error ?? "Unable to remove domain.");
      return;
    }

    setDomains((current) => current.filter((domain) => domain.id !== domainId));
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
      <h2 className="text-lg font-semibold">Domains</h2>
      <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
        <p>Add a custom domain, then create a CNAME record pointing `www` to `cname.storefoundry.app`.</p>
        <p className="mt-1">Root domain: create an ALIAS/ANAME to `storefoundry.app` if your DNS provider supports it.</p>
        {!manualVerifyEnabled ? (
          <p className="mt-1">Verification is DNS-automated in production. Manual verify is disabled for safety.</p>
        ) : (
          <p className="mt-1">Manual verify is enabled for local/dev testing only.</p>
        )}
      </div>
      <form onSubmit={addDomain} className="flex flex-col gap-2 sm:flex-row">
        <input
          required
          placeholder="athomeapothacary.com"
          value={domainInput}
          onChange={(event) => setDomainInput(event.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add domain"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-2">
        {domains.length === 0 ? (
          <li className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">No domains connected yet.</li>
        ) : (
          domains.map((domain) => (
            <li key={domain.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span className="font-medium">{domain.domain}</span>
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">{domain.verification_status}</span>
              {domain.is_primary ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">primary</span> : null}
              {!domain.is_primary ? (
                <button type="button" onClick={() => void makePrimary(domain.id)} className="ml-auto rounded-md border border-border px-2 py-1 text-xs">
                  Set primary
                </button>
              ) : null}
              {manualVerifyEnabled && domain.verification_status !== "verified" ? (
                <button type="button" onClick={() => void markVerified(domain.id)} className="rounded-md border border-border px-2 py-1 text-xs">
                  Mark verified
                </button>
              ) : null}
              <button type="button" onClick={() => void removeDomain(domain.id)} className="rounded-md border border-border px-2 py-1 text-xs">
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

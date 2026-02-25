"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { RowActionButton, RowActions } from "@/components/ui/row-actions";
import { StatusChip } from "@/components/ui/status-chip";
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

  function verificationTone(status: StoreDomainRecord["verification_status"]) {
    if (status === "verified") return "success" as const;
    if (status === "failed") return "danger" as const;
    return "warning" as const;
  }

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
    <Card className="bg-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Domains</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
          <p>Add a custom domain, then create a CNAME record pointing `www` to `cname.myrivo.app`.</p>
          <p className="mt-1">Root domain: create an ALIAS/ANAME to `myrivo.app` if your DNS provider supports it.</p>
          {!manualVerifyEnabled ? (
            <p className="mt-1">Verification is DNS-automated in production. Manual verify is disabled for safety.</p>
          ) : (
            <p className="mt-1">Manual verify is enabled for local/dev testing only.</p>
          )}
        </div>
        <form onSubmit={addDomain} className="flex flex-col gap-2 sm:flex-row">
          <Input required placeholder="athomeapothacary.com" value={domainInput} onChange={(event) => setDomainInput(event.target.value)} />
          <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add domain"}</Button>
        </form>
        <FeedbackMessage type="error" message={error} />
        <ul className="space-y-2">
          {domains.length === 0 ? (
            <li className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">No domains connected yet.</li>
          ) : (
            domains.map((domain) => (
              <li key={domain.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className="font-medium">{domain.domain}</span>
                <StatusChip label={domain.verification_status} tone={verificationTone(domain.verification_status)} />
                {domain.is_primary ? <StatusChip label="primary" tone="info" /> : null}
                <RowActions>
                  {!domain.is_primary ? (
                    <RowActionButton type="button" onClick={() => void makePrimary(domain.id)}>
                      Set primary
                    </RowActionButton>
                  ) : null}
                  {manualVerifyEnabled && domain.verification_status !== "verified" ? (
                    <RowActionButton type="button" onClick={() => void markVerified(domain.id)}>
                      Mark verified
                    </RowActionButton>
                  ) : null}
                  <RowActionButton type="button" onClick={() => void removeDomain(domain.id)}>
                    Remove
                  </RowActionButton>
                </RowActions>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

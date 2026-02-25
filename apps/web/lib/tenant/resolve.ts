const platformHosts = new Set(["localhost:3000", "myrivo.app", "www.myrivo.app"]);

export function normalizeHost(rawHost: string | null): string {
  if (!rawHost) {
    return "";
  }

  return rawHost.toLowerCase().trim();
}

export function resolveTenantLookup(hostHeader: string | null) {
  const host = normalizeHost(hostHeader);

  if (!host) {
    return { type: "missing" as const, key: null };
  }

  if (platformHosts.has(host)) {
    return { type: "platform" as const, key: null };
  }

  if (host.endsWith(".myrivo.app")) {
    return { type: "slug" as const, key: host.replace(".myrivo.app", "") };
  }

  return { type: "domain" as const, key: host };
}

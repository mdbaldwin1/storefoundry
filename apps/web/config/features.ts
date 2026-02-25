function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export const FEATURES = {
  manualDomainVerification: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY, false)
};

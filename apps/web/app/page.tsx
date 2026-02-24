import Link from "next/link";

const highlights = [
  "Tenant-safe storefronts and domain routing",
  "Inventory and order workflows for makers",
  "Stripe subscriptions without platform take-rate"
];

export default function HomePage() {
  return (
    <main style={{ margin: "0 auto", maxWidth: 860, padding: "48px 24px", fontFamily: "ui-sans-serif, system-ui" }}>
      <p style={{ letterSpacing: 1.4, textTransform: "uppercase", fontSize: 12 }}>Storefoundry</p>
      <h1 style={{ fontSize: 42, marginTop: 8, marginBottom: 16 }}>Build a branded commerce site in minutes.</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5, marginBottom: 28 }}>
        Multi-tenant commerce for makers who want full control over brand, domain, catalog, and subscriptions.
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 28 }}>
        {highlights.map((highlight) => (
          <li key={highlight} style={{ marginBottom: 8 }}>
            {highlight}
          </li>
        ))}
      </ul>
      <Link href="/dashboard" style={{ color: "#0f172a", fontWeight: 700 }}>
        Open Merchant Dashboard
      </Link>
    </main>
  );
}

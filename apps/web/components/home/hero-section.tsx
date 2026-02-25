import Link from "next/link";

const highlights = [
  "Tenant-safe storefronts and domain routing",
  "Inventory and order workflows for makers",
  "Stripe subscriptions with configurable platform fees"
];

export function HeroSection() {
  return (
    <section className="rounded-lg border border-border bg-card/80 p-8 shadow-sm backdrop-blur sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Storefoundry</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Build a branded commerce site in minutes.</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Multi-tenant commerce for makers who want full control over brand, domain, catalog, and monetization.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-foreground/90 sm:text-base">
        {highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-accent" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Open Merchant Dashboard
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted/40"
        >
          Create Account
        </Link>
      </div>
    </section>
  );
}

export function DashboardOverview() {
  return (
    <section className="rounded-lg border border-border bg-card/80 p-8 shadow-sm backdrop-blur">
      <h1 className="text-3xl font-semibold">Merchant Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Foundation screen for store setup, product management, inventory, and billing workflows.
      </p>
      <div className="mt-6 rounded-md border border-border bg-muted/45 p-4 text-sm text-muted-foreground">
        Next milestone: connect authentication and tenant onboarding forms.
      </div>
    </section>
  );
}

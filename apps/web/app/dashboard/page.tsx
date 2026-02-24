export default function DashboardPage() {
  return (
    <main style={{ margin: "0 auto", maxWidth: 980, padding: "48px 24px", fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Merchant Dashboard</h1>
      <p style={{ marginBottom: 20 }}>
        Foundation screen for store setup, product management, inventory, and billing workflows.
      </p>
      <div style={{ border: "1px solid #d4d4d8", borderRadius: 12, padding: 16 }}>
        Next milestone: connect authentication and tenant onboarding forms.
      </div>
    </main>
  );
}

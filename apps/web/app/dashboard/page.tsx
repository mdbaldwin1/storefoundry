import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageShell } from "@/components/layout/page-shell";

export default function DashboardPage() {
  return (
    <PageShell>
      <DashboardOverview />
    </PageShell>
  );
}

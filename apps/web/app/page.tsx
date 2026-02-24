import { HeroSection } from "@/components/home/hero-section";
import { PageShell } from "@/components/layout/page-shell";

export default function HomePage() {
  return (
    <PageShell maxWidthClassName="max-w-4xl">
      <HeroSection />
    </PageShell>
  );
}

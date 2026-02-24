import { LoginForm } from "@/components/auth/login-form";
import { PageShell } from "@/components/layout/page-shell";

export default function LoginPage() {
  return (
    <PageShell maxWidthClassName="max-w-lg">
      <LoginForm />
    </PageShell>
  );
}

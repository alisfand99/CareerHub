import { AppShell } from "@/components/layout/app-shell";
import { OrchestratorShell } from "@/components/orchestrator/orchestrator-shell";
import { getCachedUserEmail } from "@/lib/auth/cached-session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userEmail = await getCachedUserEmail();

  return (
    <OrchestratorShell>
      <AppShell userEmail={userEmail}>{children}</AppShell>
    </OrchestratorShell>
  );
}

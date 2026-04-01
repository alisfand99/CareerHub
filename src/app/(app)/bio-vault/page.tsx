import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BioVaultPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bio-Vault</h1>
        <p className="text-sm text-muted-foreground">
          The skill engine: chat intake, structured master data, and tailored
          resume generation (Phase 3).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
          <CardDescription>
            Chat UI for raw dumps, AI parsing into{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              master_skills
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              experience_blocks
            </code>
            , and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              projects
            </code>
            ; resume Markdown/PDF from Apply Hub context.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ApplyHubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Apply Hub</h1>
        <p className="text-sm text-muted-foreground">
          Kanban pipeline and Gemini-powered JD gap analysis (Phase 2).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
          <CardDescription>
            Columns for Wishlist, Applied, Interview, and Offer; slide-over job
            entry; Supabase{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">jobs</code>{" "}
            integration.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

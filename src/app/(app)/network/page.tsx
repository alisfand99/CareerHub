import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NetworkPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Network CRM</h1>
        <p className="text-sm text-muted-foreground">
          Strategic contacts, AI indexing, and referral outreach (Phase 4).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
          <CardDescription>
            Table of contacts with relationship strength, notes → expertise /
            influence sphere, and referral path suggestions tied to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">jobs</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

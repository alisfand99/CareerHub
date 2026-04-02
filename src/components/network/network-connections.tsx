"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Mail, Phone, User } from "lucide-react";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import type { ContactRow } from "@/lib/queries/contacts";
import { AddContactDialog } from "@/components/dashboard/dashboard-manual-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function ContactMethod({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null | undefined;
  href?: string | null;
}) {
  const v = value?.trim();
  const active = Boolean(v && href);
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
        active
          ? "border-border bg-background"
          : "border-dashed border-muted-foreground/25 bg-muted/30 text-muted-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-medium uppercase tracking-wide opacity-80">
          {label}
        </span>
        {active ? (
          <a
            href={href!}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            className="truncate font-medium text-primary underline-offset-4 hover:underline"
          >
            {v}
          </a>
        ) : (
          <span className="font-medium opacity-60">—</span>
        )}
      </span>
    </div>
  );
}

export function NetworkConnections({
  initialContacts,
}: {
  initialContacts: ContactRow[];
}) {
  const router = useRouter();
  const { triggerManualPulse } = useOrchestrator();
  const [contacts, setContacts] = useState(initialContacts);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  useEffect(() => {
    const h = window.location.hash;
    if (h.startsWith("#c-")) {
      requestAnimationFrame(() => {
        document.querySelector(h)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, []);

  async function ingest(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const trimmed = raw.trim();
    if (!trimmed) {
      setErr("Paste a LinkedIn URL or profile text.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contacts/from-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: trimmed }),
      });
      const data = (await res.json()) as {
        error?: string;
        contact?: ContactRow;
      };
      if (!res.ok) {
        setErr(data.error ?? "Request failed.");
        return;
      }
      if (data.contact) {
        setContacts((prev) => [data.contact!, ...prev]);
      } else {
        router.refresh();
      }
      triggerManualPulse("network");
      setRaw("");
      if (data.contact?.id) {
        window.location.hash = `c-${data.contact.id}`;
      }
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Network CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a LinkedIn profile link or copied profile text — we extract
            name, company, and keywords. Contacts whose company matches a job
            appear on that job&apos;s page.
          </p>
        </div>
        <AddContactDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add from LinkedIn</CardTitle>
          <CardDescription>
            Smart import needs the AI service turned on for this site. You can
            always use &quot;Add contact&quot; to enter someone by hand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void ingest(e)} className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="li-raw">URL or pasted profile</Label>
              <textarea
                id="li-raw"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={5}
                placeholder="https://www.linkedin.com/in/… or paste headline, about, experience…"
                className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {err ? (
              <p className="text-xs text-destructive" role="alert">
                {err}
              </p>
            ) : null}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Parsing…
                </>
              ) : (
                "Save to connections"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Your connections ({contacts.length})
        </h2>
        {contacts.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No contacts yet. Ingest a profile or add one manually.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {contacts.map((c) => (
              <li key={c.id} id={`c-${c.id}`}>
                <Card className="h-full border-border/80">
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-start gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted/50">
                        <User className="size-4 text-muted-foreground" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base leading-snug">
                          {c.full_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {[c.role_title, c.company].filter(Boolean).join(" · ") ||
                            "—"}
                        </CardDescription>
                      </div>
                    </div>
                    {c.keywords && c.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {c.keywords.map((k) => (
                          <Badge key={k} variant="secondary" className="text-[0.65rem]">
                            {k}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent className="grid gap-2 pt-0">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                      Contact
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <ContactMethod
                        icon={Mail}
                        label="Email"
                        value={c.email}
                        href={c.email ? `mailto:${c.email}` : null}
                      />
                      <ContactMethod
                        icon={Phone}
                        label="Phone"
                        value={c.phone}
                        href={c.phone ? `tel:${c.phone.replace(/\s/g, "")}` : null}
                      />
                      <div className="sm:col-span-2">
                        <ContactMethod
                          icon={ExternalLink}
                          label="LinkedIn"
                          value={c.linkedin_url ? "Open profile" : null}
                          href={c.linkedin_url ?? null}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

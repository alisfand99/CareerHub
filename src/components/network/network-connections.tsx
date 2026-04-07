"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Link2,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function networkPipeline(contacts: ContactRow[]) {
  const stages = [
    "Prospecting",
    "Connection sent",
    "First meeting",
    "Follow-up",
    "Opportunity",
  ];
  const counts = [0, 0, 0, 0, 0];
  for (const c of contacts) {
    const s = Math.max(0, Math.min(100, Number(c.relationship_strength) || 0));
    const idx = Math.min(4, Math.floor(s / 20));
    counts[idx] += 1;
  }
  const max = Math.max(1, ...counts);
  return stages.map((label, i) => ({ label, count: counts[i], max }));
}

function topCompanies(contacts: ContactRow[]) {
  const m = new Map<string, number>();
  for (const c of contacts) {
    const k = (c.company?.trim() || "Other").slice(0, 28);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

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

function NetworkGraphViz({ contacts }: { contacts: ContactRow[] }) {
  const nodes = contacts.slice(0, 14);
  const n = nodes.length || 1;

  return (
    <div
      className="relative min-h-[300px] overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white shadow-inner"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full text-slate-300"
        viewBox="0 0 400 280"
        preserveAspectRatio="xMidYMid slice"
      >
        {nodes.length > 1
          ? nodes.slice(1).map((_, i) => (
              <line
                key={i}
                x1="200"
                y1="140"
                x2={200 + 120 * Math.cos((2 * Math.PI * (i + 1)) / n)}
                y2={140 + 70 * Math.sin((2 * Math.PI * (i + 1)) / n)}
                stroke="currentColor"
                strokeWidth="1"
                className={i % 4 === 0 ? "text-orange-300" : "text-cyan-200"}
              />
            ))
          : null}
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-orange-100/90 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-orange-800">
        Referral paths
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-cyan-200/80 bg-white/95 px-3 py-1.5 text-[0.65rem] font-medium text-cyan-800 shadow-sm">
        <Link2 className="size-3.5" />
        CareerHub.AI
      </div>
      {nodes.map((c, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const rx = 38;
        const ry = 22;
        const left = 50 + rx * Math.cos(angle);
        const top = 50 + ry * Math.sin(angle);
        return (
          <div
            key={c.id}
            className="absolute w-24 -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <div className="mx-auto flex size-11 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-cyan-100 to-slate-100 text-[0.65rem] font-bold text-slate-700 shadow-md">
              {initials(c.full_name)}
            </div>
            <p className="mt-1 line-clamp-2 text-[0.6rem] font-medium leading-tight text-slate-700">
              {c.full_name}
            </p>
            <p className="line-clamp-1 text-[0.55rem] text-slate-500">
              {[c.role_title, c.company].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        );
      })}
      {nodes.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center p-6 text-center text-sm text-slate-500">
          Add contacts to see your relationship map.
        </div>
      ) : null}
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

  const pipeline = useMemo(() => networkPipeline(contacts), [contacts]);
  const companies = useMemo(() => topCompanies(contacts), [contacts]);
  const topReferrers = useMemo(
    () =>
      [...contacts]
        .sort(
          (a, b) =>
            (b.relationship_strength ?? 0) - (a.relationship_strength ?? 0),
        )
        .slice(0, 4),
    [contacts],
  );
  const maxCo = Math.max(1, ...companies.map(([, v]) => v));

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
          <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-slate-900">
            Network CRM
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Map relationships, track pipeline stages, and keep intros aligned
            with roles in Apply Hub.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 font-serif text-sm font-medium text-slate-800 sm:flex">
            <Sparkles className="size-5 text-cyan-600" aria-hidden />
            <span>
              Career-Hub <span className="text-cyan-700">AI</span>
            </span>
          </div>
          <AddContactDialog />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(220px,260px)]">
        <aside className="flex flex-col gap-4">
          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                My network pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipeline.map(({ label, count, max: m }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-[0.7rem] text-slate-600">
                    <span>{label}</span>
                    <span className="tabular-nums font-medium text-slate-800">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all"
                      style={{ width: `${(count / m) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Strongest referrers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topReferrers.length === 0 ? (
                <p className="text-xs text-slate-500">No contacts yet.</p>
              ) : (
                topReferrers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5"
                  >
                    <User className="size-3.5 text-slate-400" />
                    <div className="min-w-0 text-xs">
                      <p className="truncate font-medium text-slate-800">
                        {c.full_name}
                      </p>
                      <p className="truncate text-slate-500">
                        {c.company ?? "—"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="size-4 text-cyan-600" />
                Upcoming touchpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 text-[0.7rem] text-slate-600">
              <span className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                Schedule follow-ups from job pages
              </span>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 space-y-4">
          <NetworkGraphViz contacts={contacts} />
          <p className="text-center text-[0.7rem] text-slate-500">
            Build meaningful connections — lines highlight possible referral
            paths between people and targets.
          </p>
        </main>

        <aside className="flex flex-col gap-4">
          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Network growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-24 items-end justify-between gap-1">
                {[40, 52, 48, 61, 55, 70, 68, 78, 85, 92].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-2 text-center text-[0.65rem] text-slate-500">
                Last 30 days (illustrative)
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Suggested actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contacts.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-2 py-2"
                >
                  <span className="min-w-0 truncate text-xs text-slate-700">
                    {c.full_name}
                  </span>
                  <Button type="button" size="xs" className="shrink-0 text-[0.65rem]">
                    Send note
                  </Button>
                </div>
              ))}
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-500">Add people to see nudges.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Top companies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {companies.length === 0 ? (
                <p className="text-xs text-slate-500">No company data yet.</p>
              ) : (
                companies.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 truncate text-slate-600">
                      {name}
                    </span>
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                        style={{ width: `${(count / maxCo) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 tabular-nums text-slate-500">
                      {count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card className="border-slate-200/90 shadow-md">
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
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">
          Your connections ({contacts.length})
        </h2>
        {contacts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No contacts yet. Ingest a profile or add one manually.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {contacts.map((c) => (
              <li key={c.id} id={`c-${c.id}`}>
                <Card className="h-full border-slate-200/90 shadow-sm">
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-start gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                        <User className="size-4 text-slate-500" aria-hidden />
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
                          <Badge
                            key={k}
                            variant="secondary"
                            className="text-[0.65rem]"
                          >
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

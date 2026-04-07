"use client";

import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  Globe,
  GraduationCap,
  Languages,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MarketGapRow } from "@/lib/market-gaps";
import type {
  CertificationRow,
  EducationRow,
  ExperienceResumeRow,
  LanguageRow,
  ProfileResumeRow,
  ProjectResumeRow,
  SkillResumeRow,
  SuperResumeBundle,
} from "@/lib/queries/super-resume";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";

type BioVaultJobOption = {
  id: string;
  title: string;
  company: string;
  status: string;
  jdText: string | null;
};

function bulletsToText(b: unknown): string {
  if (!Array.isArray(b)) return "";
  return b.filter((x): x is string => typeof x === "string").join("\n");
}

function textToBullets(t: string): string[] {
  return t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function dateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

function SectionShell({
  icon: Icon,
  title,
  description,
  children,
  action,
}: {
  icon: ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-primary" aria-hidden />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export function SuperResumeEditor({
  userId,
  userEmail,
  bundle,
  marketGaps,
  jobs,
  assistantResumeDraft,
  dataLoadWarning,
}: {
  userId: string;
  userEmail: string;
  bundle: SuperResumeBundle;
  marketGaps: MarketGapRow[];
  jobs: BioVaultJobOption[];
  assistantResumeDraft: string | null;
  /** Shown when some Supabase sections failed (e.g. schema not migrated). */
  dataLoadWarning?: string | null;
}) {
  const router = useRouter();
  const { triggerManualPulse } = useOrchestrator();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    triggerManualPulse("bio");
    router.refresh();
  }

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    try {
      const r = await fn();
      await refresh();
      return r;
    } finally {
      setBusy(false);
    }
  }

  const p = bundle.profile;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="space-y-2">
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-cyan-600">
          Bio-Vault
        </p>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-900 md:text-4xl">
          Skills · evidence
        </h1>
        <p className="max-w-2xl text-slate-600">
          The verified portfolio for your career narrative — structured roles,
          skills, proof, and credentials in one vault. Paste résumés into the
          Assistant and it fills what it can here.
        </p>
      </header>

      <div className="rounded-2xl border border-cyan-100/80 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.1)] backdrop-blur-sm md:p-8">
      {dataLoadWarning ? (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {dataLoadWarning}
        </div>
      ) : null}

      {busy ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Saving…
        </div>
      ) : null}

      <ProfileHeaderCard profile={p} userId={userId} userEmail={userEmail} run={run} />

      <TailoredResumeBuilder jobs={jobs} />

      <SectionShell
        icon={Briefcase}
        title="Experience"
        description="Roles and achievements — stack as many as you need for different career paths."
        action={
          <ExperienceDialog
            userId={userId}
            onDone={run}
            trigger={<AddTrigger label="Add role" />}
          />
        }
      >
        {bundle.experiences.length === 0 ? (
          <EmptyHint text="No roles yet. Add one or paste a résumé into the Assistant." />
        ) : (
          <ul className="space-y-3">
            {bundle.experiences.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-border/70 bg-card/50 px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{e.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {[e.organization, e.location].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.is_current
                        ? `${dateInputValue(e.start_date) || "Start ?"} – Present`
                        : [dateInputValue(e.start_date), dateInputValue(e.end_date)]
                            .filter(Boolean)
                            .join(" – ") || "Dates not set"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <ExperienceDialog
                      userId={userId}
                      initial={e}
                      onDone={run}
                      trigger={
                        <Button type="button" variant="ghost" size="icon-xs">
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (!confirm("Remove this experience?")) return;
                        void run(async () => {
                          const sb = createClient();
                          const { error } = await sb
                            .from("experience_blocks")
                            .delete()
                            .eq("id", e.id);
                          if (error) throw error;
                        });
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                {bulletsToText(e.bullets) ? (
                  <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                    {textToBullets(bulletsToText(e.bullets)).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionShell>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionShell
          icon={Wrench}
          title="Skills"
          description="Tools and capabilities you want employers to see."
          action={
            <SkillDialog
              userId={userId}
              onDone={run}
              trigger={<AddTrigger label="Add skill" />}
            />
          }
        >
          {bundle.skills.length === 0 ? (
            <EmptyHint text="Add skills manually or describe them to the Assistant." />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {bundle.skills.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 pl-2.5 pr-1 py-0.5 text-sm"
                >
                  <span>{s.name}</span>
                  {s.proficiency != null ? (
                    <span className="text-xs text-muted-foreground">
                      · {s.proficiency}/5
                    </span>
                  ) : null}
                  <SkillDialog
                    userId={userId}
                    initial={s}
                    onDone={run}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="size-6"
                      >
                        <Pencil className="size-3" aria-hidden />
                      </Button>
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 text-destructive"
                    onClick={() => {
                      if (!confirm(`Remove “${s.name}”?`)) return;
                      void run(async () => {
                        const sb = createClient();
                        const { error } = await sb
                          .from("master_skills")
                          .delete()
                          .eq("id", s.id);
                        if (error) throw error;
                      });
                    }}
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>

        <SectionShell
          icon={Globe}
          title="Projects"
          description="Highlights that don’t fit a single job title."
          action={
            <ProjectDialog
              userId={userId}
              onDone={run}
              trigger={<AddTrigger label="Add project" />}
            />
          }
        >
          {bundle.projects.length === 0 ? (
            <EmptyHint text="Add a project or mention one to the Assistant." />
          ) : (
            <ul className="space-y-2">
              {bundle.projects.map((pr) => (
                <li
                  key={pr.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-border/70 px-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{pr.name}</p>
                    {pr.summary ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pr.summary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <ProjectDialog
                      userId={userId}
                      initial={pr}
                      onDone={run}
                      trigger={
                        <Button type="button" variant="ghost" size="icon-xs">
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive"
                      onClick={() => {
                        if (!confirm("Remove this project?")) return;
                        void run(async () => {
                          const sb = createClient();
                          const { error } = await sb
                            .from("projects")
                            .delete()
                            .eq("id", pr.id);
                          if (error) throw error;
                        });
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>
      </div>

      <SectionShell
        icon={GraduationCap}
        title="Education"
        description="Degrees and programs — include everything you might cite."
        action={
          <EducationDialog
            userId={userId}
            onDone={run}
            trigger={<AddTrigger label="Add education" />}
          />
        }
      >
        {bundle.education.length === 0 ? (
          <EmptyHint text="Add schools you’ve attended." />
        ) : (
          <ul className="space-y-2">
            {bundle.education.map((ed) => (
              <EducationRowActions key={ed.id} ed={ed} userId={userId} run={run} />
            ))}
          </ul>
        )}
      </SectionShell>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionShell
          icon={Award}
          title="Certificates"
          description="Licenses, cloud certs, courses with credentials."
          action={
            <CertDialog
              userId={userId}
              onDone={run}
              trigger={<AddTrigger label="Add certificate" />}
            />
          }
        >
          {bundle.certifications.length === 0 ? (
            <EmptyHint text="No certificates yet." />
          ) : (
            <ul className="space-y-2">
              {bundle.certifications.map((c) => (
                <CertRowActions key={c.id} c={c} userId={userId} run={run} />
              ))}
            </ul>
          )}
        </SectionShell>

        <SectionShell
          icon={Languages}
          title="Languages"
          description="How comfortable you are in each language."
          action={
            <LangDialog
              userId={userId}
              onDone={run}
              trigger={<AddTrigger label="Add language" />}
            />
          }
        >
          {bundle.languages.length === 0 ? (
            <EmptyHint text="Add languages you speak or write." />
          ) : (
            <ul className="space-y-2">
              {bundle.languages.map((l) => (
                <LangRowActions key={l.id} l={l} userId={userId} run={run} />
              ))}
            </ul>
          )}
        </SectionShell>
      </div>

      <Card className="border-primary/25 bg-primary/5 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">What employers are asking for</CardTitle>
          <CardDescription>
            Pulled from job postings you’ve saved. Use it to decide what to
            learn or emphasize next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marketGaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Save a job in Apply Hub (or paste a posting to the Assistant) to
              see market signals here.
            </p>
          ) : (
            <ul className="space-y-2">
              {marketGaps.map((g, i) => (
                <li
                  key={`${g.skill}-${i}`}
                  className="rounded-lg border border-primary/15 bg-background/80 px-3 py-2"
                >
                  <p className="font-medium text-foreground">{g.skill}</p>
                  <p className="text-xs text-muted-foreground">
                    Role type: {g.jobFamily}
                    {g.priority ? ` · ${g.priority}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    From {g.sourceJob}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {assistantResumeDraft ? (
        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4" aria-hidden />
              Latest assistant résumé draft
            </CardTitle>
            <CardDescription>
              Markdown snapshot from the Assistant — copy or refine elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border/70 bg-muted/30 p-4 text-xs leading-relaxed">
              {assistantResumeDraft}
            </pre>
          </CardContent>
        </Card>
      ) : null}
      </div>
    </div>
  );
}

function TailoredResumeBuilder({ jobs }: { jobs: BioVaultJobOption[] }) {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? "");
  const [extraFocus, setExtraFocus] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  return (
    <Card className="border-cyan-200/80 bg-cyan-50/40 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Targeted resume builder</CardTitle>
        <CardDescription>
          Choose a job card and generate a tailored resume draft from your
          Bio-Vault skills and experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add at least one job in Apply Hub to generate a targeted resume.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Target job card" id="target-job">
                <select
                  id="target-job"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.company} ({job.status})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Extra focus (optional)" id="extra-focus">
                <Input
                  id="extra-focus"
                  value={extraFocus}
                  onChange={(e) => setExtraFocus(e.target.value)}
                  placeholder="e.g. Emphasize leadership + B2B SaaS impact"
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={busy || !selectedJobId}
                onClick={async () => {
                  if (!selectedJobId) return;
                  setBusy(true);
                  setErr(null);
                  try {
                    const res = await fetch("/api/bio-vault/generate-resume", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        jobId: selectedJobId,
                        extraFocus: extraFocus.trim() || null,
                      }),
                    });
                    const json = (await res.json()) as {
                      error?: string;
                      resumeMarkdown?: string;
                    };
                    if (!res.ok || !json.resumeMarkdown) {
                      throw new Error(json.error || "Failed to generate resume");
                    }
                    setDraft(json.resumeMarkdown);
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : "Generation failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Generating tailored resume…
                  </>
                ) : (
                  "Generate for selected job"
                )}
              </Button>
              {selectedJob ? (
                <p className="text-xs text-muted-foreground">
                  Target: <span className="font-medium">{selectedJob.title}</span>{" "}
                  at {selectedJob.company}
                </p>
              ) : null}
            </div>

            {err ? <p className="text-xs text-destructive">{err}</p> : null}

            {draft ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border/70 bg-background p-4 text-xs leading-relaxed">
                {draft}
              </pre>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function AddTrigger({ label }: { label: string }) {
  return (
    <Button type="button" size="sm" variant="secondary" className="gap-1">
      <Plus className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}

function ProfileHeaderCard({
  profile,
  userId,
  userEmail,
  run,
}: {
  profile: ProfileResumeRow | null;
  userId: string;
  userEmail: string;
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}) {
  return (
    <Card className="border-border/80 bg-gradient-to-br from-card to-muted/20 shadow-md">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {profile?.display_name?.trim() || userEmail.split("@")[0]}
          </h2>
          {profile?.headline ? (
            <p className="text-sm text-primary">{profile.headline}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Add a professional headline</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {profile?.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden />
                {profile.location}
              </span>
            ) : null}
            {profile?.public_email ? (
              <span>{profile.public_email}</span>
            ) : (
              <span className="opacity-70">Contact fields editable</span>
            )}
          </div>
        </div>
        <ProfileEditDialog profile={profile} userId={userId} userEmail={userEmail} run={run} />
      </CardContent>
      {profile?.summary ? (
        <CardContent className="border-t border-border/60 pt-0">
          <p className="pt-4 text-sm leading-relaxed text-muted-foreground">
            {profile.summary}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function ProfileEditDialog({
  profile,
  userId,
  userEmail,
  run,
}: {
  profile: ProfileResumeRow | null;
  userId: string;
  userEmail: string;
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [summary, setSummary] = useState(profile?.summary ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [publicEmail, setPublicEmail] = useState(
    profile?.public_email ?? userEmail,
  );
  const [err, setErr] = useState<string | null>(null);

  function syncFromProps() {
    setDisplayName(profile?.display_name ?? "");
    setHeadline(profile?.headline ?? "");
    setSummary(profile?.summary ?? "");
    setPhone(profile?.phone ?? "");
    setLocation(profile?.location ?? "");
    setWebsite(profile?.website ?? "");
    setPublicEmail(profile?.public_email ?? userEmail);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) syncFromProps();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-3.5" aria-hidden />
        Edit profile
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Profile & contact</DialogTitle>
          <DialogDescription>
            Shown at the top of your super-resume. Your sign-in email stays
            private unless you put a different address in public email.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            void run(async () => {
              const sb = createClient();
              const row = {
                id: userId,
                display_name: displayName.trim() || null,
                headline: headline.trim() || null,
                summary: summary.trim() || null,
                phone: phone.trim() || null,
                location: location.trim() || null,
                website: website.trim() || null,
                public_email: publicEmail.trim() || null,
              };
              const { error } = await sb.from("profiles").upsert(row);
              if (error) {
                setErr(error.message);
                throw error;
              }
              setOpen(false);
            });
          }}
        >
          <Field label="Name" id="pf-name">
            <Input
              id="pf-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Headline" id="pf-head">
            <Input
              id="pf-head"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Product designer · AI tools"
            />
          </Field>
          <Field label="About" id="pf-sum">
            <textarea
              id="pf-sum"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Short summary of your strengths and focus…"
            />
          </Field>
          <Field label="Public email" id="pf-em">
            <Input
              id="pf-em"
              type="email"
              value={publicEmail}
              onChange={(e) => setPublicEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone" id="pf-ph">
            <Input
              id="pf-ph"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Location" id="pf-loc">
            <Input
              id="pf-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, country"
            />
          </Field>
          <Field label="Website / portfolio" id="pf-web">
            <Input
              id="pf-web"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </Field>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" className="w-full">
            Save profile
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ExperienceDialog({
  userId,
  initial,
  onDone,
  trigger,
}: {
  userId: string;
  initial?: ExperienceResumeRow;
  onDone: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [org, setOrg] = useState(initial?.organization ?? "");
  const [loc, setLoc] = useState(initial?.location ?? "");
  const [start, setStart] = useState(dateInputValue(initial?.start_date));
  const [end, setEnd] = useState(dateInputValue(initial?.end_date));
  const [current, setCurrent] = useState(initial?.is_current ?? false);
  const [bullets, setBullets] = useState(bulletsToText(initial?.bullets));
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && initial) {
          setTitle(initial.title);
          setOrg(initial.organization ?? "");
          setLoc(initial.location ?? "");
          setStart(dateInputValue(initial.start_date));
          setEnd(dateInputValue(initial.end_date));
          setCurrent(initial.is_current);
          setBullets(bulletsToText(initial.bullets));
        }
        if (o && !initial) {
          setTitle("");
          setOrg("");
          setLoc("");
          setStart("");
          setEnd("");
          setCurrent(false);
          setBullets("");
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit role" : "Add role"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) {
              setErr("Title is required.");
              return;
            }
            setErr(null);
            void onDone(async () => {
              const sb = createClient();
              const body = {
                title: title.trim(),
                organization: org.trim() || null,
                location: loc.trim() || null,
                start_date: start || null,
                end_date: current ? null : end || null,
                is_current: current,
                bullets: textToBullets(bullets),
              };
              if (initial) {
                const { error } = await sb
                  .from("experience_blocks")
                  .update(body)
                  .eq("id", initial.id);
                if (error) throw error;
              } else {
                const { error } = await sb
                  .from("experience_blocks")
                  .insert({ user_id: userId, ...body });
                if (error) throw error;
              }
              setOpen(false);
            });
          }}
        >
          <Field label="Title" id="ex-title">
            <Input
              id="ex-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>
          <Field label="Company" id="ex-org">
            <Input id="ex-org" value={org} onChange={(e) => setOrg(e.target.value)} />
          </Field>
          <Field label="Location" id="ex-loc">
            <Input id="ex-loc" value={loc} onChange={(e) => setLoc(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start" id="ex-s">
              <Input
                id="ex-s"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="End" id="ex-e">
              <Input
                id="ex-e"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={current}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={current}
              onChange={(e) => setCurrent(e.target.checked)}
            />
            I currently work here
          </label>
          <Field label="Highlights (one per line)" id="ex-b">
            <textarea
              id="ex-b"
              value={bullets}
              onChange={(e) => setBullets(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SkillDialog({
  userId,
  initial,
  onDone,
  trigger,
}: {
  userId: string;
  initial?: SkillResumeRow;
  onDone: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [prof, setProf] = useState(initial?.proficiency?.toString() ?? "");
  const [evidence, setEvidence] = useState(initial?.evidence ?? "");
  const [tools, setTools] = useState((initial?.tools ?? []).join(", "));
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && initial) {
          setName(initial.name);
          setCategory(initial.category ?? "");
          setProf(initial.proficiency?.toString() ?? "");
          setEvidence(initial.evidence ?? "");
          setTools((initial.tools ?? []).join(", "));
        }
        if (o && !initial) {
          setName("");
          setCategory("");
          setProf("");
          setEvidence("");
          setTools("");
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit skill" : "Add skill"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setErr("Name is required.");
              return;
            }
            setErr(null);
            void onDone(async () => {
              const sb = createClient();
              const p = prof ? Number.parseInt(prof, 10) : null;
              const toolList = tools
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              const meta = {
                origin: "acquired",
                source: initial ? "manual_edit" : "manual_form",
                updated_at: new Date().toISOString(),
              };
              const base = {
                name: name.trim(),
                category: category.trim() || null,
                proficiency: p != null && p >= 1 && p <= 5 ? p : null,
                evidence: evidence.trim() || null,
                tools: toolList,
                metadata: meta,
              };
              if (initial) {
                const { error } = await sb
                  .from("master_skills")
                  .update(base)
                  .eq("id", initial.id);
                if (error) throw error;
              } else {
                const { error } = await sb.from("master_skills").insert({
                  user_id: userId,
                  ...base,
                });
                if (error) throw error;
              }
              setOpen(false);
            });
          }}
        >
          <Field label="Skill" id="sk-n">
            <Input
              id="sk-n"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Category" id="sk-c">
            <Input id="sk-c" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Proficiency 1–5" id="sk-p">
            <Input
              id="sk-p"
              type="number"
              min={1}
              max={5}
              value={prof}
              onChange={(e) => setProf(e.target.value)}
            />
          </Field>
          <Field label="Tools (comma-separated)" id="sk-t">
            <Input id="sk-t" value={tools} onChange={(e) => setTools(e.target.value)} />
          </Field>
          <Field label="Evidence / notes" id="sk-e">
            <textarea
              id="sk-e"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDialog({
  userId,
  initial,
  onDone,
  trigger,
}: {
  userId: string;
  initial?: ProjectResumeRow;
  onDone: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [stack, setStack] = useState((initial?.tech_stack ?? []).join(", "));
  const [url, setUrl] = useState(initial?.url ?? "");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && initial) {
          setName(initial.name);
          setSummary(initial.summary ?? "");
          setStack((initial.tech_stack ?? []).join(", "));
          setUrl(initial.url ?? "");
        }
        if (o && !initial) {
          setName("");
          setSummary("");
          setStack("");
          setUrl("");
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit project" : "Add project"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setErr("Name is required.");
              return;
            }
            setErr(null);
            void onDone(async () => {
              const sb = createClient();
              const tech = stack
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              const payload = {
                name: name.trim(),
                summary: summary.trim() || null,
                tech_stack: tech,
                url: url.trim() || null,
              };
              if (initial) {
                const { error } = await sb
                  .from("projects")
                  .update(payload)
                  .eq("id", initial.id);
                if (error) throw error;
              } else {
                const { error } = await sb.from("projects").insert({
                  user_id: userId,
                  ...payload,
                });
                if (error) throw error;
              }
              setOpen(false);
            });
          }}
        >
          <Field label="Name" id="pr-n">
            <Input id="pr-n" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Summary" id="pr-s">
            <textarea
              id="pr-s"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <Field label="Tech stack (comma-separated)" id="pr-t">
            <Input id="pr-t" value={stack} onChange={(e) => setStack(e.target.value)} />
          </Field>
          <Field label="Link" id="pr-u">
            <Input id="pr-u" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EducationDialog({
  userId,
  initial,
  onDone,
  trigger,
}: {
  userId: string;
  initial?: EducationRow;
  onDone: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [school, setSchool] = useState(initial?.school ?? "");
  const [degree, setDegree] = useState(initial?.degree ?? "");
  const [field, setField] = useState(initial?.field_of_study ?? "");
  const [start, setStart] = useState(dateInputValue(initial?.start_date));
  const [end, setEnd] = useState(dateInputValue(initial?.end_date));
  const [current, setCurrent] = useState(initial?.is_current ?? false);
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && initial) {
          setSchool(initial.school);
          setDegree(initial.degree ?? "");
          setField(initial.field_of_study ?? "");
          setStart(dateInputValue(initial.start_date));
          setEnd(dateInputValue(initial.end_date));
          setCurrent(initial.is_current);
          setDesc(initial.description ?? "");
        }
        if (o && !initial) {
          setSchool("");
          setDegree("");
          setField("");
          setStart("");
          setEnd("");
          setCurrent(false);
          setDesc("");
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit education" : "Add education"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!school.trim()) {
              setErr("School is required.");
              return;
            }
            setErr(null);
            void onDone(async () => {
              const sb = createClient();
              const body = {
                school: school.trim(),
                degree: degree.trim() || null,
                field_of_study: field.trim() || null,
                start_date: start || null,
                end_date: current ? null : end || null,
                is_current: current,
                description: desc.trim() || null,
              };
              if (initial) {
                const { error } = await sb
                  .from("education_entries")
                  .update(body)
                  .eq("id", initial.id);
                if (error) throw error;
              } else {
                const { error } = await sb
                  .from("education_entries")
                  .insert({ user_id: userId, ...body });
                if (error) throw error;
              }
              setOpen(false);
            });
          }}
        >
          <Field label="School" id="ed-s">
            <Input id="ed-s" value={school} onChange={(e) => setSchool(e.target.value)} required />
          </Field>
          <Field label="Degree" id="ed-d">
            <Input id="ed-d" value={degree} onChange={(e) => setDegree(e.target.value)} />
          </Field>
          <Field label="Field of study" id="ed-f">
            <Input id="ed-f" value={field} onChange={(e) => setField(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start" id="ed-st">
              <Input
                id="ed-st"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="End" id="ed-en">
              <Input
                id="ed-en"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={current}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={current}
              onChange={(e) => setCurrent(e.target.checked)}
            />
            Currently enrolled
          </label>
          <Field label="Description" id="ed-de">
            <textarea
              id="ed-de"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EducationRowActions({
  ed,
  userId,
  run,
}: {
  ed: EducationRow;
  userId: string;
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}) {
  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border border-border/70 px-2 py-2">
      <div>
        <p className="font-medium">{ed.school}</p>
        <p className="text-sm text-muted-foreground">
          {[ed.degree, ed.field_of_study].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex gap-1">
        <EducationDialog
          userId={userId}
          initial={ed}
          onDone={run}
          trigger={
            <Button type="button" variant="ghost" size="icon-xs">
              <Pencil className="size-4" aria-hidden />
            </Button>
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-destructive"
          onClick={() => {
            if (!confirm("Remove this entry?")) return;
            void run(async () => {
              const sb = createClient();
              const { error } = await sb.from("education_entries").delete().eq("id", ed.id);
              if (error) throw error;
            });
          }}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}

function CertDialog({
  userId,
  initial,
  onDone,
  trigger,
}: {
  userId: string;
  initial?: CertificationRow;
  onDone: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [org, setOrg] = useState(initial?.issuing_org ?? "");
  const [issue, setIssue] = useState(dateInputValue(initial?.issue_date));
  const [exp, setExp] = useState(dateInputValue(initial?.expiration_date));
  const [url, setUrl] = useState(initial?.credential_url ?? "");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && initial) {
          setName(initial.name);
          setOrg(initial.issuing_org ?? "");
          setIssue(dateInputValue(initial.issue_date));
          setExp(dateInputValue(initial.expiration_date));
          setUrl(initial.credential_url ?? "");
        }
        if (o && !initial) {
          setName("");
          setOrg("");
          setIssue("");
          setExp("");
          setUrl("");
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit certificate" : "Add certificate"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setErr("Name is required.");
              return;
            }
            setErr(null);
            void onDone(async () => {
              const sb = createClient();
              const body = {
                name: name.trim(),
                issuing_org: org.trim() || null,
                issue_date: issue || null,
                expiration_date: exp || null,
                credential_url: url.trim() || null,
              };
              if (initial) {
                const { error } = await sb
                  .from("certification_entries")
                  .update(body)
                  .eq("id", initial.id);
                if (error) throw error;
              } else {
                const { error } = await sb
                  .from("certification_entries")
                  .insert({ user_id: userId, ...body });
                if (error) throw error;
              }
              setOpen(false);
            });
          }}
        >
          <Field label="Name" id="ce-n">
            <Input id="ce-n" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Issuing organization" id="ce-o">
            <Input id="ce-o" value={org} onChange={(e) => setOrg(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Issue date" id="ce-i">
              <Input id="ce-i" type="date" value={issue} onChange={(e) => setIssue(e.target.value)} />
            </Field>
            <Field label="Expiration" id="ce-x">
              <Input id="ce-x" type="date" value={exp} onChange={(e) => setExp(e.target.value)} />
            </Field>
          </div>
          <Field label="Credential URL" id="ce-u">
            <Input id="ce-u" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CertRowActions({
  c,
  userId,
  run,
}: {
  c: CertificationRow;
  userId: string;
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}) {
  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border border-border/70 px-2 py-2">
      <div>
        <p className="font-medium">{c.name}</p>
        {c.issuing_org ? (
          <p className="text-xs text-muted-foreground">{c.issuing_org}</p>
        ) : null}
      </div>
      <div className="flex gap-1">
        <CertDialog
          userId={userId}
          initial={c}
          onDone={run}
          trigger={
            <Button type="button" variant="ghost" size="icon-xs">
              <Pencil className="size-4" aria-hidden />
            </Button>
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-destructive"
          onClick={() => {
            if (!confirm("Remove this certificate?")) return;
            void run(async () => {
              const sb = createClient();
              const { error } = await sb.from("certification_entries").delete().eq("id", c.id);
              if (error) throw error;
            });
          }}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}

function LangDialog({
  userId,
  initial,
  onDone,
  trigger,
}: {
  userId: string;
  initial?: LanguageRow;
  onDone: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [prof, setProf] = useState(initial?.proficiency ?? "");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && initial) {
          setName(initial.name);
          setProf(initial.proficiency ?? "");
        }
        if (o && !initial) {
          setName("");
          setProf("");
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit language" : "Add language"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setErr("Language is required.");
              return;
            }
            setErr(null);
            void onDone(async () => {
              const sb = createClient();
              const body = {
                name: name.trim(),
                proficiency: prof.trim() || null,
              };
              if (initial) {
                const { error } = await sb
                  .from("language_entries")
                  .update(body)
                  .eq("id", initial.id);
                if (error) throw error;
              } else {
                const { error } = await sb
                  .from("language_entries")
                  .insert({ user_id: userId, ...body });
                if (error) throw error;
              }
              setOpen(false);
            });
          }}
        >
          <Field label="Language" id="lg-n">
            <Input id="lg-n" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Proficiency" id="lg-p">
            <Input
              id="lg-p"
              value={prof}
              onChange={(e) => setProf(e.target.value)}
              placeholder="e.g. Native, Professional, Basic"
            />
          </Field>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LangRowActions({
  l,
  userId,
  run,
}: {
  l: LanguageRow;
  userId: string;
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-2 py-2">
      <span className="text-sm">
        <span className="font-medium">{l.name}</span>
        {l.proficiency ? (
          <span className="text-muted-foreground"> — {l.proficiency}</span>
        ) : null}
      </span>
      <div className="flex gap-1">
        <LangDialog
          userId={userId}
          initial={l}
          onDone={run}
          trigger={
            <Button type="button" variant="ghost" size="icon-xs">
              <Pencil className="size-4" aria-hidden />
            </Button>
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-destructive"
          onClick={() => {
            if (!confirm("Remove this language?")) return;
            void run(async () => {
              const sb = createClient();
              const { error } = await sb.from("language_entries").delete().eq("id", l.id);
              if (error) throw error;
            });
          }}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}

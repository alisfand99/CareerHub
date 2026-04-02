"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import { Button } from "@/components/ui/button";
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

function triggerBtn(disabled?: boolean) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-8 gap-1 text-xs"
      disabled={disabled}
    />
  );
}

function hubIconTrigger(disabled: boolean | undefined, ariaLabel: string) {
  return (
    <button
      type="button"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-cyan-200/65 opacity-0 shadow-none transition-all duration-200 group-hover/card:opacity-100 hover:bg-white/[0.08] hover:text-cyan-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45 disabled:pointer-events-none disabled:opacity-0"
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );
}

export function AddJobDialog({
  disabled,
  compactTrigger,
}: {
  disabled?: boolean;
  /** Icon-only trigger, visible on card hover (dashboard neural hub). */
  compactTrigger?: boolean;
}) {
  const router = useRouter();
  const { triggerManualPulse } = useOrchestrator();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim() || !company.trim()) {
      setErr("Title and company are required.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("Sign in to add a job.");
        return;
      }
      const { error } = await supabase.from("jobs").insert({
        user_id: user.id,
        title: title.trim(),
        company: company.trim(),
        status: "wishlist",
        jd_text: jd.trim() || null,
      });
      if (error) {
        setErr(error.message);
        return;
      }
      triggerManualPulse("apply");
      setOpen(false);
      setTitle("");
      setCompany("");
      setJd("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          compactTrigger ? hubIconTrigger(disabled, "Add job manually") : triggerBtn(disabled)
        }
      >
        <Plus className={compactTrigger ? "size-4" : "size-3.5"} />
        {compactTrigger ? null : "Add job"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add job manually</DialogTitle>
          <DialogDescription>
            Adds the role to your wishlist right away. Use the career assistant
            if you want the posting parsed and compared to your skills.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="mj-title">Title</Label>
            <Input
              id="mj-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Product Manager"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mj-co">Company</Label>
            <Input
              id="mj-co"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mj-jd">Job posting (optional)</Label>
            <textarea
              id="mj-jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={4}
              className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Paste posting text…"
            />
          </div>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save to pipeline"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddSkillDialog({
  disabled,
  compactTrigger,
}: {
  disabled?: boolean;
  compactTrigger?: boolean;
}) {
  const router = useRouter();
  const { triggerManualPulse } = useOrchestrator();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr("Skill name is required.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("Sign in to add a skill.");
        return;
      }
      const p = proficiency ? Number.parseInt(proficiency, 10) : null;
      const { error } = await supabase.from("master_skills").insert({
        user_id: user.id,
        name: name.trim(),
        category: category.trim() || null,
        proficiency: p != null && p >= 1 && p <= 5 ? p : null,
        metadata: {
          origin: "acquired",
          source: "manual_form",
          updated_at: new Date().toISOString(),
        },
      });
      if (error) {
        setErr(error.message);
        return;
      }
      triggerManualPulse("bio");
      setOpen(false);
      setName("");
      setCategory("");
      setProficiency("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          compactTrigger ? hubIconTrigger(disabled, "Add skill manually") : triggerBtn(disabled)
        }
      >
        <Plus className={compactTrigger ? "size-4" : "size-3.5"} />
        {compactTrigger ? null : "Add skill"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add skill manually</DialogTitle>
          <DialogDescription>
            Saves straight into your Bio-Vault skill list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="sk-name">Skill</Label>
            <Input
              id="sk-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PostgreSQL"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sk-cat">Category (optional)</Label>
            <Input
              id="sk-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Engineering"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sk-p">Proficiency 1–5 (optional)</Label>
            <Input
              id="sk-p"
              type="number"
              min={1}
              max={5}
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
            />
          </div>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save skill"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddContactDialog({
  disabled,
  compactTrigger,
}: {
  disabled?: boolean;
  compactTrigger?: boolean;
}) {
  const router = useRouter();
  const { triggerManualPulse } = useOrchestrator();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!fullName.trim()) {
      setErr("Name is required.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("Sign in to add a contact.");
        return;
      }
      const { error } = await supabase.from("contacts").insert({
        user_id: user.id,
        full_name: fullName.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        ai_expertise: { source: "manual_form" },
      });
      if (error) {
        setErr(error.message);
        return;
      }
      triggerManualPulse("network");
      setOpen(false);
      setFullName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setLinkedinUrl("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          compactTrigger
            ? hubIconTrigger(disabled, "Add contact manually")
            : triggerBtn(disabled)
        }
      >
        <Plus className={compactTrigger ? "size-4" : "size-3.5"} />
        {compactTrigger ? null : "Add contact"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add contact manually</DialogTitle>
          <DialogDescription>
            Keep track of someone in your network. You can ask the assistant
            later to help draft a message.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ct-name">Full name</Label>
            <Input
              id="ct-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ct-co">Company (optional)</Label>
            <Input
              id="ct-co"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ct-em">Email (optional)</Label>
            <Input
              id="ct-em"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ct-ph">Phone (optional)</Label>
            <Input
              id="ct-ph"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 …"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ct-li">LinkedIn URL (optional)</Label>
            <Input
              id="ct-li"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/…"
            />
          </div>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save contact"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageSquare, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import { DeltaReport } from "@/components/orchestrator/delta-report";

const QUICK_ACTIONS = [
  {
    id: "job",
    label: "➕ Found a Job",
    fill: (cur: string) =>
      cur.trim()
        ? `${cur}\n\nI found a new job at [Company]. Here is the posting:\n\n`
        : "I found a new job at [Company]. Here is the posting:\n\n",
  },
  {
    id: "ingest",
    label: "📄 Import résumé",
    fill: (cur: string) => {
      const head =
        "Please extract everything from this résumé or profile into my Bio-Vault: all roles, skills, education, certifications, languages, and projects, plus headline and summary if present.\n\n";
      return cur.trim() ? `${head}${cur}` : head;
    },
  },
  {
    id: "resume",
    label: "🚀 Refactor Resume",
    fill: () =>
      "Analyze my latest Bio-Vault entries and update my résumé draft.",
  },
  {
    id: "outreach",
    label: "✉️ Outreach Script",
    fill: () =>
      "Draft a personalized networking message for my top-priority job.",
  },
] as const;

export function OrchestratorChatPanel() {
  const pathname = usePathname();
  const {
    open,
    setOpen,
    busy,
    messages,
    send,
    clearMessages,
    lastOutreach,
  } = useOrchestrator();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const t = input;
    setInput("");
    await send(t);
  }

  const contextHint =
    pathname.startsWith("/apply-hub") ? (
      <p className="rounded-lg border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-white/80">
        <span className="text-cyan-400/90">Tip:</span> Found a role? Click{" "}
        <strong className="text-white">Found a Job</strong>, then paste the
        posting below.
      </p>
    ) : pathname.startsWith("/network") ? (
      <p className="rounded-lg border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-white/80">
        <span className="text-cyan-400/90">Tip:</span> Ready to connect? Try{" "}
        <strong className="text-white">Outreach Script</strong> for a tailored
        draft.
      </p>
    ) : pathname.startsWith("/bio-vault") ? (
      <p className="rounded-lg border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-white/80">
        <span className="text-cyan-400/90">Tip:</span> Pasting a full CV? Click{" "}
        <strong className="text-white">Import résumé</strong>, then paste your
        text — or paste directly; long profile text is treated as a Bio-Vault
        import.
      </p>
    ) : null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-dvh max-h-dvh w-full max-w-md min-w-0 flex-col border-l border-white/10 bg-[#080808]/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
              <MessageSquare className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-sm font-medium tracking-tight text-white">
                Career assistant
              </p>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-cyan-500/70">
                Jobs · Bio · Network
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/15 bg-white/[0.04] text-xs text-white/80 hover:bg-white/[0.08] hover:text-white"
              onClick={() => clearMessages()}
            >
              <Trash2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
              Clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close panel"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1 px-3 py-3">
          {messages.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 font-serif text-sm font-light leading-relaxed text-white/60">
              <p className="font-medium text-white/90">How to use it</p>
              <p>
                Pick a shortcut or type freely. The assistant updates your
                pipeline, skills, and contacts when it recognizes a request, and
                shows a short summary of what changed.
              </p>
              <p className="font-mono text-[0.65rem] text-white/45">
                Smart replies need the AI service enabled for this deployment.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm leading-relaxed transition-colors duration-500",
                    m.role === "user"
                      ? "ml-4 border border-cyan-500/20 bg-cyan-500/10 font-serif text-white/90"
                      : "mr-4 border border-white/10 bg-white/[0.05] font-serif font-light text-white/70",
                  )}
                >
                  {m.content}
                  {m.role === "assistant" && m.delta ? (
                    <DeltaReport delta={m.delta} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div ref={bottomRef} />
        </ScrollArea>

        {lastOutreach ? (
          <div className="shrink-0 border-t border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wider text-cyan-500/80">
              Latest outreach draft
            </p>
            <p className="mt-1 max-h-24 overflow-y-auto font-mono text-xs text-white/55">
              {lastOutreach}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={() =>
                void navigator.clipboard.writeText(lastOutreach)
              }
            >
              Copy to clipboard
            </Button>
          </div>
        ) : null}

        <div className="shrink-0 space-y-3 border-t border-white/[0.08] bg-[#060606]/90 px-3 py-3">
          {contextHint}
          <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/40">
            Quick actions
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((a) => (
              <Button
                key={a.id}
                type="button"
                variant="secondary"
                size="multiline"
                className="w-full border-white/12 bg-white/[0.07] text-white/90 hover:border-cyan-500/25 hover:bg-white/[0.1]"
                disabled={busy}
                onClick={() => {
                  setInput((cur) => a.fill(cur));
                  requestAnimationFrame(() =>
                    textareaRef.current?.focus(),
                  );
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="flex shrink-0 flex-col gap-2 border-t border-border bg-[#060606]/95 p-3"
        >
          <label className="sr-only" htmlFor="orch-input">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id="orch-input"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a job posting, add skills, or ask for outreach…"
            disabled={busy}
            className="min-h-[6.5rem] w-full resize-y rounded-lg border border-white/12 bg-[#0c0c0c] px-3 py-2.5 text-sm leading-relaxed text-white outline-none ring-offset-[#050505] placeholder:text-white/40 focus-visible:border-cyan-500/35 focus-visible:ring-2 focus-visible:ring-cyan-500/30 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-10 w-full shrink-0 gap-2 bg-brand-action hover:bg-brand-action-hover"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send
              </>
            )}
          </Button>
        </form>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close overlay"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:bg-black/20"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

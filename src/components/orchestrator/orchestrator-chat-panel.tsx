"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageSquare, Send, X } from "lucide-react";
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
      <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
        <span className="font-medium">Tip:</span> Found a role? Click{" "}
        <strong>Found a Job</strong>, then paste the posting below.
      </p>
    ) : pathname.startsWith("/network") ? (
      <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
        <span className="font-medium">Tip:</span> Ready to connect? Try{" "}
        <strong>Outreach Script</strong> for a tailored draft.
      </p>
    ) : pathname.startsWith("/bio-vault") ? (
      <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
        <span className="font-medium">Tip:</span> Pasting a full CV? Click{" "}
        <strong>Import résumé</strong>, then paste your text — or paste
        directly; long profile text is treated as a Bio-Vault import.
      </p>
    ) : null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background/98 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <MessageSquare className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Career assistant
              </p>
              <p className="text-xs text-muted-foreground">
                Jobs · Bio-Vault · Network
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => clearMessages()}
            >
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
            <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How to use it</p>
              <p>
                Pick a shortcut or type freely. The assistant updates your
                pipeline, skills, and contacts when it recognizes a request, and
                shows a short summary of what changed.
              </p>
              <p className="text-xs">
                Smart replies need the AI service enabled for this deployment.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-4 bg-primary/10 text-foreground"
                      : "mr-4 border border-border/60 bg-card/80 text-muted-foreground",
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
          <div className="shrink-0 border-t border-border bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-foreground">
              Latest outreach draft
            </p>
            <p className="mt-1 max-h-24 overflow-y-auto text-xs text-muted-foreground">
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

        <div className="shrink-0 space-y-2 border-t border-border bg-muted/10 px-3 py-2">
          {contextHint}
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <Button
                key={a.id}
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto min-h-8 whitespace-normal px-2 py-1.5 text-left text-[0.7rem] leading-tight"
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
          className="shrink-0 border-t border-border p-3"
        >
          <label className="sr-only" htmlFor="orch-input">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id="orch-input"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a job posting, add skills, or ask for outreach…"
            disabled={busy}
            className="mb-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            className="w-full gap-2 bg-brand-action hover:bg-brand-action-hover"
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

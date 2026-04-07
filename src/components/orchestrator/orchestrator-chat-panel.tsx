"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import { DeltaReport } from "@/components/orchestrator/delta-report";

const QUICK_ACTIONS = [
  {
    id: "job",
    label: "🔍 Found a Job",
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
    label: "✨ Refactor Resume",
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
      <p className="rounded-lg border border-cyan-200/90 bg-cyan-50/90 px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-slate-700">
        <span className="text-cyan-700">Tip:</span> Found a role? Click{" "}
        <strong className="text-slate-900">Found a Job</strong>, then paste the
        posting below.
      </p>
    ) : pathname.startsWith("/network") ? (
      <p className="rounded-lg border border-cyan-200/90 bg-cyan-50/90 px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-slate-700">
        <span className="text-cyan-700">Tip:</span> Ready to connect? Try{" "}
        <strong className="text-slate-900">Outreach Script</strong> for a tailored
        draft.
      </p>
    ) : pathname.startsWith("/bio-vault") ? (
      <p className="rounded-lg border border-cyan-200/90 bg-cyan-50/90 px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-slate-700">
        <span className="text-cyan-700">Tip:</span> Pasting a full CV? Click{" "}
        <strong className="text-slate-900">Import résumé</strong>, then paste your
        text — or paste directly; long profile text is treated as a Bio-Vault
        import.
      </p>
    ) : null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-dvh max-h-dvh w-full max-w-md min-w-0 flex-col border-l border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm font-semibold tracking-tight text-slate-900">
                Career assistant
              </p>
              <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-slate-500">
                Jobs · Bio · Network
              </p>
            </div>
            <div
              className="flex size-10 shrink-0 flex-col items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[0.65rem] font-bold leading-none text-slate-700"
              aria-hidden
            >
              CH
              <span className="text-[0.45rem] font-normal text-slate-500">AI</span>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
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
            <div className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-600">
              <p className="font-medium text-slate-900">How to use it</p>
              <p>
                Pick a shortcut or type freely. The assistant updates your
                pipeline, skills, and contacts when it recognizes a request, and
                shows a short summary of what changed.
              </p>
              <p className="font-mono text-[0.65rem] text-slate-500">
                Smart replies need the AI service enabled for this deployment.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm transition-colors duration-500",
                    m.role === "user"
                      ? "ml-5 border border-slate-200 bg-white text-slate-900"
                      : "mr-5 bg-cyan-600 text-white",
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
          <div className="shrink-0 border-t border-slate-200/90 bg-slate-50/90 px-3 py-2">
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wider text-cyan-800">
              Latest outreach draft
            </p>
            <p className="mt-1 max-h-24 overflow-y-auto font-mono text-xs text-slate-600">
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

        <div className="shrink-0 space-y-3 border-t border-slate-200/90 bg-slate-50/80 px-3 py-3">
          {contextHint}
          <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Quick actions
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((a) => (
              <Button
                key={a.id}
                type="button"
                variant="outline"
                size="multiline"
                className="w-full border-cyan-300/80 bg-white text-slate-800 hover:border-cyan-500 hover:bg-cyan-50"
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
          className="flex shrink-0 flex-col gap-2 border-t border-slate-200/90 bg-white p-3"
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
            placeholder="Type a message…"
            disabled={busy}
            className="min-h-[6.5rem] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm leading-relaxed text-slate-900 outline-none ring-offset-white placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-10 w-full shrink-0 gap-2 rounded-full bg-cyan-600 hover:bg-cyan-700"
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
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

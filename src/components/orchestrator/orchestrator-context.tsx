"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  guessFlowTargetFromMessage,
  intentToFlowTarget,
  orchestratorDeltaNeedsRscRefresh,
  type FlowTarget,
  type OrchestratorDelta,
} from "@/types/orchestrator";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  delta?: OrchestratorDelta;
};

type OrchestrateResponse = {
  error?: string;
  ok?: boolean;
  intent?: string;
  assistant_message?: string;
  outreach?: { message: string };
  delta?: OrchestratorDelta;
};

function toSafeAssistantError(input?: string): string {
  const msg = (input ?? "").trim();
  if (!msg) return "We hit an internal issue. Please try again.";
  const lower = msg.toLowerCase();
  if (lower.includes("unauthorized")) {
    return "Your session expired. Please sign in again.";
  }
  if (lower.includes("career assistant isn")) {
    return msg;
  }
  if (lower.includes("network")) {
    return "Network issue while contacting the assistant. Please retry.";
  }
  return "Something went wrong while processing your request. Please try again.";
}

type OrchestratorContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  busy: boolean;
  /** True while API runs or during a short manual-indexing pulse */
  isPulsing: boolean;
  /** Which pillar should highlight in the circular hub / connectors */
  flowTarget: FlowTarget | null;
  triggerManualPulse: (target: FlowTarget) => void;
  messages: ChatMessage[];
  clearMessages: () => void;
  send: (text: string) => Promise<void>;
  lastOutreach: string | null;
};

const OrchestratorContext = createContext<OrchestratorContextValue | null>(
  null,
);

export function OrchestratorProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manualPulse, setManualPulse] = useState(false);
  const [flowTarget, setFlowTarget] = useState<FlowTarget | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastOutreach, setLastOutreach] = useState<string | null>(null);
  const flowClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFlowLater = useCallback((target: FlowTarget | null) => {
    if (flowClearRef.current) {
      clearTimeout(flowClearRef.current);
      flowClearRef.current = null;
    }
    setFlowTarget(target);
    if (target) {
      flowClearRef.current = setTimeout(() => {
        setFlowTarget(null);
        flowClearRef.current = null;
      }, 1600);
    }
  }, []);

  const triggerManualPulse = useCallback((target: FlowTarget) => {
    if (manualClearRef.current) clearTimeout(manualClearRef.current);
    setManualPulse(true);
    setFlowTarget(target);
    manualClearRef.current = setTimeout(() => {
      setManualPulse(false);
      setFlowTarget((cur) => (cur === target ? null : cur));
      manualClearRef.current = null;
    }, 900);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastOutreach(null);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (flowClearRef.current) {
        clearTimeout(flowClearRef.current);
        flowClearRef.current = null;
      }

      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "user", content: trimmed },
      ]);
      setBusy(true);
      setFlowTarget(null);
      const guess = guessFlowTargetFromMessage(trimmed);
      if (guess) setFlowTarget(guess);

      try {
        const res = await fetch("/api/chat/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });
        const data = (await res.json()) as OrchestrateResponse;

        if (!res.ok) {
          setMessages((m) => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: toSafeAssistantError(data.error),
            },
          ]);
          clearFlowLater(null);
          return;
        }

        const resolvedFlow =
          intentToFlowTarget(data.intent ?? "general") ?? guess;
        clearFlowLater(resolvedFlow);

        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              data.assistant_message ??
              (data.ok ? "Processed." : "No assistant summary returned."),
            delta: data.delta,
          },
        ]);

        if (data.outreach?.message) {
          setLastOutreach(data.outreach.message);
        }

        if (orchestratorDeltaNeedsRscRefresh(data.delta)) {
          startTransition(() => {
            router.refresh();
          });
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Network error. Check your connection and try again.",
          },
        ]);
        clearFlowLater(null);
      } finally {
        setBusy(false);
      }
    },
    [router, clearFlowLater],
  );

  const value = useMemo(() => {
    const isPulsing = busy || manualPulse;
    return {
      open,
      setOpen,
      busy,
      isPulsing,
      flowTarget,
      triggerManualPulse,
      messages,
      clearMessages,
      send,
      lastOutreach,
    };
  }, [
    open,
    busy,
    manualPulse,
    flowTarget,
    triggerManualPulse,
    messages,
    clearMessages,
    send,
    lastOutreach,
  ]);

  return (
    <OrchestratorContext.Provider value={value}>
      {children}
    </OrchestratorContext.Provider>
  );
}

export function useOrchestrator(): OrchestratorContextValue {
  const ctx = useContext(OrchestratorContext);
  if (!ctx) {
    throw new Error("useOrchestrator must be used within OrchestratorProvider");
  }
  return ctx;
}

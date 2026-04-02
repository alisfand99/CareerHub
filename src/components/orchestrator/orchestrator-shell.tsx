"use client";

import type { ReactNode } from "react";
import { OrchestratorProvider } from "@/components/orchestrator/orchestrator-context";
import { OrchestratorChatPanel } from "@/components/orchestrator/orchestrator-chat-panel";
import { OrchestratorFloatingCore } from "@/components/orchestrator/orchestrator-floating-core";

export function OrchestratorShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OrchestratorProvider>
      {children}
      <OrchestratorFloatingCore />
      <OrchestratorChatPanel />
    </OrchestratorProvider>
  );
}

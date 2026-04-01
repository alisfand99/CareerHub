"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DashboardTourDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="shrink-0" />}
      >
        Three pillars
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Career-Hub AI pillars</DialogTitle>
          <DialogDescription>
            One workspace that connects applications, evidence, and people.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Apply Hub</span> —
            Kanban pipeline, JD capture, and AI gap analysis vs your vault.
          </li>
          <li>
            <span className="font-medium text-foreground">Bio-Vault</span> —
            Structured skills, projects, and experience parsed from natural
            input; powers tailored resumes.
          </li>
          <li>
            <span className="font-medium text-foreground">Network CRM</span> —
            Strength-weighted contacts, influence indexing, and referral path
            suggestions per target role.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}

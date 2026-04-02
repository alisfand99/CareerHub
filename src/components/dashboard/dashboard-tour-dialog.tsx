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
import { cn } from "@/lib/utils";

export function DashboardTourDialog({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("shrink-0", triggerClassName)}
          />
        }
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
            Track applications from wishlist to offer, capture postings, and see
            how you compare to what employers ask for.
          </li>
          <li>
            <span className="font-medium text-foreground">Bio-Vault</span> —
            Structured skills, projects, and experience parsed from natural
            input; powers tailored resumes.
          </li>
          <li>
            <span className="font-medium text-foreground">Network CRM</span> —
            Save people you know, note how strong the relationship is, and plan
            warm intros toward roles you want.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Network,
  Sparkles,
  Vault,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserMenu } from "@/components/layout/user-menu";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apply-hub", label: "Apply Hub", icon: Briefcase },
  { href: "/bio-vault", label: "Bio-Vault", icon: Vault },
  { href: "/network", label: "Network CRM", icon: Network },
];

function pageHeading(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const hit = nav.find(
    (n) => n.href !== "/" && (pathname === n.href || pathname.startsWith(`${n.href}/`)),
  );
  return hit?.label ?? "Workspace";
}

function NavItems({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium tracking-[-0.02em] transition-all duration-200",
      mobile
        ? active
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/60"
        : active
          ? "bg-white/[0.08] text-sidebar-foreground shadow-[0_0_24px_-6px_rgba(0,86,210,0.35)]"
          : "text-sidebar-foreground/65 hover:bg-white/[0.05] hover:text-sidebar-foreground",
    );

  return (
    <nav className="flex flex-col gap-1 px-2">
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);

        const className = linkClass(active);
        return mobile ? (
          <SheetClose
            key={href}
            render={<Link href={href} className={className} />}
          >
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {label}
          </SheetClose>
        ) : (
          <Link key={href} href={href} className={className}>
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopTopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-0.5 md:flex"
      aria-label="Primary"
    >
      {nav.map(({ href, label }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const title = pageHeading(pathname);
  const year = new Date().getFullYear();
  const { setOpen, isPulsing: orchestratorPulsing } = useOrchestrator();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-[15.5rem] shrink-0 border-r border-white/[0.06] bg-sidebar/30 backdrop-blur-2xl backdrop-saturate-150 md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/12 text-sidebar-primary shadow-[0_0_20px_-4px_rgba(0,86,210,0.45)]">
            <Sparkles className="size-4 drop-shadow-[0_0_8px_rgba(91,156,255,0.6)]" aria-hidden />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold tracking-[-0.02em] text-sidebar-foreground/95">
              Career-Hub AI
            </p>
            <p className="truncate text-[0.65rem] text-sidebar-foreground/45">
              Neural workspace
            </p>
          </div>
        </div>
        <ScrollArea className="flex-1 py-3">
          <NavItems />
        </ScrollArea>
        <Separator className="bg-white/[0.06]" />
        <div className="p-2.5">
          <UserMenu email={userEmail} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Open menu" />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-border p-4 text-left">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-5 text-primary" aria-hidden />
                  Career-Hub AI
                </SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <NavItems mobile />
              </div>
              <Separator />
              <div className="p-3">
                <UserMenu email={userEmail} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-primary">
              {title}
            </p>
            <span className="truncate text-sm font-semibold tracking-tight">
              Career-Hub AI
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "shrink-0 border-primary/25 transition-shadow",
              orchestratorPulsing &&
                "shadow-[0_0_16px_rgba(0,86,210,0.35)] ring-2 ring-primary/40",
            )}
            aria-label="Open AI orchestrator"
            onClick={() => setOpen(true)}
          >
            <MessageSquare
              className={cn(
                "size-4 text-primary",
                orchestratorPulsing && "animate-pulse",
              )}
            />
          </Button>
        </header>

        <header className="sticky top-0 z-30 hidden h-[3.25rem] shrink-0 items-center gap-6 border-b border-border/80 bg-background/95 px-6 backdrop-blur-md md:flex lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <Sparkles className="size-5 text-primary" aria-hidden />
            Career-Hub AI
          </Link>
          <DesktopTopNav />
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "hidden shrink-0 gap-1.5 border-primary/25 transition-shadow md:inline-flex",
                orchestratorPulsing &&
                  "shadow-[0_0_14px_rgba(0,86,210,0.3)] ring-2 ring-primary/35",
              )}
              onClick={() => setOpen(true)}
            >
              <Sparkles
                className={cn(
                  "size-3.5 text-primary",
                  orchestratorPulsing && "animate-pulse",
                )}
              />
              Orchestrator
            </Button>
            <span className="hidden text-xs text-muted-foreground lg:inline">
              Row-level security enabled
            </span>
            {userEmail ? (
              <span
                className="max-w-[220px] truncate text-xs text-muted-foreground"
                title={userEmail}
              >
                {userEmail}
              </span>
            ) : (
              <Link
                href="/login"
                className="text-xs font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="relative flex-1 bg-gradient-to-b from-background via-background to-brand-navy/[0.06] p-4 md:p-8">
          {children}
        </main>

        <footer className="border-t border-white/10 bg-brand-navy text-white/80">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3 md:px-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Sparkles className="size-5 text-[#5b9cff]" aria-hidden />
                Career-Hub AI
              </div>
              <p className="text-sm leading-relaxed text-white/65">
                One workspace for applications, your evidence vault, and
                relationship intelligence—built for serious career operators.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Product
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {nav.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-white/75 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Legal
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-white/75 transition-colors hover:text-white"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/75 transition-colors hover:text-white"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4 text-xs text-white/45 md:flex-row md:items-center md:justify-between md:px-8">
              <span>© {year} Career-Hub AI. All rights reserved.</span>
              <span className="text-white/35">
                Dashboard data is sourced from your Supabase project.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

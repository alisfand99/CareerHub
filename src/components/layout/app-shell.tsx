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
  { href: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/apply-hub", label: "Apply Hub", short: "Apply", icon: Briefcase },
  { href: "/bio-vault", label: "Bio-Vault", short: "Vault", icon: Vault },
  { href: "/network", label: "Network CRM", short: "Net", icon: Network },
];

function pageHeading(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const hit = nav.find(
    (n) =>
      n.href !== "/" &&
      (pathname === n.href || pathname.startsWith(`${n.href}/`)),
  );
  return hit?.label ?? "Workspace";
}

function NavItems({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.2em] transition-all duration-500",
      mobile
        ? active
          ? "border border-cyan-500/35 bg-cyan-500/10 text-cyan-700"
          : "border border-transparent text-slate-600 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-slate-900"
        : active
          ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-800 shadow-[0_0_28px_-8px_rgba(6,182,212,0.28)]"
          : "border border-transparent text-slate-600 hover:border-slate-900/10 hover:bg-white/70 hover:text-slate-900",
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
            <Icon className="size-4 shrink-0 text-cyan-500/80" aria-hidden />
            {label}
          </SheetClose>
        ) : (
          <Link key={href} href={href} className={className}>
            <Icon className="size-4 shrink-0 text-cyan-500/70" aria-hidden />
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
      className="hidden items-center gap-1 md:flex"
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
              "rounded-md px-3 py-2 font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] transition-all duration-500",
              active
                ? "text-cyan-700"
                : "text-slate-600 hover:text-slate-900",
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
    <div className="ch-shell-bg flex min-h-screen w-full">
      <div className="ch-blob-cyan" aria-hidden />
      <div className="ch-blob-amber" aria-hidden />

      <aside className="relative z-[1] hidden w-[17rem] shrink-0 flex-col border-r border-slate-900/10 bg-white/[0.7] backdrop-blur-xl md:flex">
        <div className="flex h-[3.75rem] items-center gap-3 border-b border-slate-900/10 px-5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-cyan-500/25 bg-cyan-500/10 text-cyan-300 shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)]">
            <Sparkles className="size-[1.15rem]" aria-hidden />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-serif text-sm font-medium tracking-tight text-[var(--text)]">
              Career-Hub AI
            </p>
            <p className="ch-eyebrow mt-0.5 !text-[0.55rem] !tracking-[0.32em] text-cyan-500/90">
              Command center
            </p>
          </div>
        </div>
        <ScrollArea className="flex-1 py-6">
          <NavItems />
        </ScrollArea>
        <Separator className="bg-slate-900/10" />
        <div className="p-4">
          <UserMenu email={userEmail} />
        </div>
      </aside>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-900/10 px-4 md:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(247,250,252,0.92) 0%, rgba(247,250,252,0.65) 55%, rgba(247,250,252,0) 100%)",
          }}
        >
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Open menu" />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent
              side="left"
          className="w-80 border-slate-900/10 bg-white/85 p-0 backdrop-blur-xl"
            >
              <SheetHeader className="border-b border-slate-900/10 p-5 text-left">
                <SheetTitle className="flex items-center gap-2 font-serif text-lg font-normal text-[var(--text)]">
                  <Sparkles className="size-5 text-cyan-400" aria-hidden />
                  Career-Hub AI
                </SheetTitle>
                <p className="ch-eyebrow pt-1 !text-[0.55rem]">Navigation</p>
              </SheetHeader>
              <div className="py-5">
                <NavItems mobile />
              </div>
              <Separator className="bg-slate-900/10" />
              <div className="p-4">
                <UserMenu email={userEmail} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="ch-eyebrow">{title}</p>
            <span className="mt-0.5 block truncate font-serif text-base font-medium text-slate-900">
              Career-Hub AI
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "shrink-0 border-cyan-500/30 transition-all duration-500",
              orchestratorPulsing &&
                "shadow-[0_0_20px_-4px_rgba(34,211,238,0.45)] ring-1 ring-cyan-400/40",
            )}
            aria-label="Open career assistant"
            onClick={() => setOpen(true)}
          >
            <MessageSquare
              className={cn(
                "size-4 text-cyan-400",
                orchestratorPulsing && "animate-pulse",
              )}
            />
          </Button>
        </header>

        <header
          className="sticky top-0 z-30 hidden h-[3.5rem] shrink-0 items-center gap-8 border-b border-slate-900/10 px-8 lg:px-12 md:flex"
          style={{
            background:
              "linear-gradient(to bottom, rgba(247,250,252,0.92) 0%, rgba(247,250,252,0.78) 70%, rgba(247,250,252,0) 100%)",
          }}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-serif text-base font-medium tracking-tight text-[var(--text)]"
          >
            <Sparkles className="size-5 text-cyan-400" aria-hidden />
            Career-Hub AI
          </Link>
          <DesktopTopNav />
          <div className="ml-auto flex min-w-0 items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "hidden shrink-0 gap-2 border-cyan-500/35 transition-all duration-500 md:inline-flex",
                orchestratorPulsing &&
                  "shadow-[0_0_18px_-4px_rgba(34,211,238,0.4)] ring-1 ring-cyan-400/35",
              )}
              onClick={() => setOpen(true)}
            >
              <Sparkles
                className={cn(
                  "size-3.5 text-cyan-400",
                  orchestratorPulsing && "animate-pulse",
                )}
              />
              Assistant
            </Button>
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.2em] text-slate-600/35 lg:inline">
              Private
            </span>
            {userEmail ? (
              <span
                className="hidden max-w-[200px] truncate font-mono text-[0.7rem] text-slate-600/50 lg:inline"
                title={userEmail}
              >
                {userEmail}
              </span>
            ) : (
              <Link
                href="/login"
                className="font-mono text-xs text-cyan-400/90 hover:text-cyan-300"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="relative flex-1 pb-28 md:pb-16">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20 lg:px-16">
            {children}
          </div>
        </main>

        {/* Mobile glass dock — cyber minimal */}
        <div
          className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
          style={{
            boxShadow:
              "0 -1px 0 0 rgba(6, 182, 212, 0.35), 0 25px 50px -12px rgba(2, 6, 23, 0.14)",
          }}
        >
          <div className="flex items-center justify-between gap-1 rounded-2xl border border-slate-900/10 bg-white/[0.72] px-2 py-2 backdrop-blur-xl">
            {nav.map(({ href, short, icon: Icon }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 font-mono text-[0.55rem] font-medium uppercase tracking-wider transition-all duration-500",
                    active
                      ? "text-cyan-300"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="truncate">{short}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 font-mono text-[0.55rem] font-medium uppercase tracking-wider transition-all duration-500",
                orchestratorPulsing ? "text-cyan-700" : "text-slate-600",
              )}
            >
              <MessageSquare className="size-4" aria-hidden />
              <span>AI</span>
            </button>
          </div>
        </div>

        <footer className="relative z-[1] border-t border-slate-900/10 bg-slate-50/80 text-slate-600">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3 md:gap-10 md:px-10 lg:px-16">
            <div className="ch-section-rail space-y-4 border-cyan-500/25">
              <div className="flex items-center gap-2 font-serif text-lg font-medium text-slate-900">
                <Sparkles className="size-5 text-cyan-400" aria-hidden />
                Career-Hub AI
              </div>
              <p className="ch-body max-w-md text-slate-700/60">
                One workspace for applications, your evidence vault, and
                relationship intelligence — built for operators who treat their
                career like a system.
              </p>
            </div>
            <div>
              <p className="ch-eyebrow text-slate-600/50">Product</p>
              <ul className="mt-6 space-y-3 font-mono text-xs uppercase tracking-wider">
                {nav.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-slate-600/55 transition-colors duration-500 hover:text-cyan-700/90"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="ch-eyebrow text-slate-600/50">Legal</p>
              <ul className="mt-6 space-y-3 font-mono text-xs uppercase tracking-wider text-slate-600/55">
                <li>
                  <a href="#" className="hover:text-cyan-700/90">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-700/90">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900/10">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 font-mono text-[0.65rem] uppercase tracking-wider text-slate-600/35 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
              <span>© {year} Career-Hub AI</span>
              <span className="text-slate-600/25">
                Your data stays in your workspace.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

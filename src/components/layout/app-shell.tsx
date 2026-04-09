"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Network,
  Sparkles,
  Vault,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  { href: "/interview-guide", label: "Interview Guide", short: "Guide", icon: ClipboardList },
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
          ? "border border-cyan-200 bg-cyan-50 text-cyan-800"
          : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
        : active
          ? "border border-cyan-200/80 bg-cyan-50/90 text-cyan-800 shadow-sm"
          : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-white/80 hover:text-slate-800",
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
            <Icon className="size-4 shrink-0 text-cyan-600" aria-hidden />
            {label}
          </SheetClose>
        ) : (
          <Link key={href} href={href} className={className}>
            <Icon className="size-4 shrink-0 text-cyan-600" aria-hidden />
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
                ? "text-cyan-700 underline decoration-cyan-500 decoration-2 underline-offset-8"
                : "text-slate-500 hover:text-slate-800",
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
    <div className="ch-shell-bg flex min-h-screen w-full max-w-[100vw] overflow-x-hidden">
      <div className="ch-blob-cyan" aria-hidden />
      <div className="ch-blob-amber" aria-hidden />

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200/90 bg-white/90 px-4 backdrop-blur-md md:hidden"
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
              className="w-80 border-slate-200/90 bg-white/95 p-0 backdrop-blur-xl"
            >
              <SheetHeader className="border-b border-slate-200/90 p-5 text-left">
                <SheetTitle className="flex items-center gap-2 font-serif text-lg font-normal text-slate-900">
                  <Image
                    src="/careerhub-logo.png"
                    alt="Career-Hub AI logo"
                    width={20}
                    height={20}
                    className="size-5"
                  />
                  Career-Hub AI
                </SheetTitle>
                <p className="ch-eyebrow pt-1 !text-[0.55rem]">Navigation</p>
              </SheetHeader>
              <div className="py-5">
                <NavItems mobile />
              </div>
              <Separator className="bg-slate-200/80" />
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
              "shrink-0 border-cyan-300/80 bg-white transition-all duration-500",
              orchestratorPulsing &&
                "shadow-[0_0_20px_-4px_rgba(34,211,238,0.45)] ring-2 ring-cyan-400/35",
            )}
            aria-label="Open career assistant"
            onClick={() => setOpen(true)}
          >
            <MessageSquare
              className={cn(
                "size-4 text-cyan-600",
                orchestratorPulsing && "animate-pulse",
              )}
            />
          </Button>
        </header>

        <header className="sticky top-0 z-30 hidden h-[3.5rem] shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white/85 px-4 backdrop-blur-md md:flex md:min-w-0 md:px-6 lg:gap-5 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-serif text-base font-medium tracking-tight text-slate-900"
          >
            <Image
              src="/careerhub-logo.png"
              alt="Career-Hub AI logo"
              width={20}
              height={20}
              className="size-5"
            />
            Career-Hub AI
          </Link>
          <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden">
            <DesktopTopNav />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "hidden shrink-0 gap-2 border-cyan-300/80 bg-white transition-all duration-500 sm:inline-flex",
                orchestratorPulsing &&
                  "shadow-[0_0_18px_-4px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/30",
              )}
              onClick={() => setOpen(true)}
            >
              <Sparkles
                className={cn(
                  "size-3.5 text-cyan-600",
                  orchestratorPulsing && "animate-pulse",
                )}
              />
              Assistant
            </Button>
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.2em] text-slate-400 xl:inline">
              Private
            </span>
            {userEmail ? (
              <>
                <span
                  className="hidden max-w-[min(12rem,28vw)] truncate font-mono text-[0.65rem] text-slate-600 md:inline xl:max-w-[220px]"
                  title={userEmail}
                >
                  {userEmail}
                </span>
                <UserMenu email={userEmail} variant="header" />
              </>
            ) : (
              <UserMenu email={null} variant="header" />
            )}
          </div>
        </header>

        <main className="relative min-w-0 flex-1 overflow-x-hidden pb-28 md:pb-16">
          <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 md:py-16 lg:px-10 lg:py-20">
            {children}
          </div>
        </main>

        {/* Mobile glass dock — cyber minimal */}
        <div
          className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
          style={{
            boxShadow:
              "0 -1px 0 0 rgba(34, 211, 238, 0.35), 0 25px 50px -12px rgba(15, 23, 42, 0.12)",
          }}
        >
          <div className="flex items-center justify-between gap-1 rounded-2xl border border-slate-200/90 bg-white/90 px-2 py-2 shadow-lg backdrop-blur-xl">
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
                      ? "text-cyan-700"
                      : "text-slate-500 hover:text-slate-800",
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
                orchestratorPulsing ? "text-cyan-700" : "text-slate-500",
              )}
            >
              <MessageSquare className="size-4" aria-hidden />
              <span>AI</span>
            </button>
          </div>
        </div>

        <footer className="relative z-[1] border-t border-slate-200/90 bg-white/80 text-slate-600 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 md:gap-10 md:px-10 lg:px-16">
            <div className="ch-section-rail space-y-4 border-cyan-500/30">
              <div className="flex items-center gap-2 font-serif text-lg font-medium text-slate-900">
                <Image
                  src="/careerhub-logo.png"
                  alt="Career-Hub AI logo"
                  width={20}
                  height={20}
                  className="size-5"
                />
                Career-Hub AI
              </div>
              <p className="ch-body max-w-md">
                One workspace for applications, your evidence vault, and
                relationship intelligence — built for operators who treat their
                career like a system.
              </p>
            </div>
            <div>
              <p className="ch-eyebrow text-slate-500">Product</p>
              <ul className="mt-6 space-y-3 font-mono text-xs uppercase tracking-wider">
                {nav.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-slate-600 transition-colors duration-500 hover:text-cyan-700"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="ch-eyebrow text-slate-500">Legal</p>
              <ul className="mt-6 space-y-3 font-mono text-xs uppercase tracking-wider text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200/80">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 font-mono text-[0.65rem] uppercase tracking-wider text-slate-400 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
              <span>© {year} Career-Hub AI</span>
              <span className="text-slate-400">
                Your data stays in your workspace.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

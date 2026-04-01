"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  Menu,
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

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apply-hub", label: "Apply Hub", icon: Briefcase },
  { href: "/bio-vault", label: "Bio-Vault", icon: Vault },
  { href: "/network", label: "Network CRM", icon: Network },
];

function NavItems({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      mobile
        ? active
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/60"
        : active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
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

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Career-Hub AI
            </p>
            <p className="text-xs text-muted-foreground">Career intelligence</p>
          </div>
        </div>
        <ScrollArea className="flex-1 py-4">
          <NavItems />
        </ScrollArea>
        <Separator className="bg-sidebar-border" />
        <div className="p-3">
          <UserMenu email={userEmail} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:hidden">
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
          <span className="text-sm font-semibold tracking-tight">
            Career-Hub AI
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

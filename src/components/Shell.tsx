"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Boxes,
  CalendarRange,
  CircleHelp,
  FileSignature,
  HardHat,
  Landmark,
  LayoutGrid,
  LibraryBig,
  Mail,
  Plus,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/format";
import { MODULES } from "@/lib/modules";
import { useStore } from "@/lib/store";
import { Avatar } from "./ui";

const MODULE_ICONS = [FileSignature, CalendarRange, HardHat, ShoppingCart, Boxes, Truck, Users, Landmark];

const TOP_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, match: (p: string) => p === "/" },
  { href: "/tenders", label: "Tenders", icon: FileSignature, match: (p: string) => p.startsWith("/tenders") && p !== "/tenders/new" },
  { href: "/tenders/new", label: "New tender", icon: Plus, match: (p: string) => p === "/tenders/new" },
  { href: "/rates", label: "Rate library", icon: LibraryBig, match: (p: string) => p.startsWith("/rates") },
  { href: "/modules", label: "Modules", icon: Layers, match: (p: string) => p.startsWith("/modules") },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, tenders } = useStore();
  const reviewCount = tenders.filter((t) => t.status === "review").length;

  return (
    <div className="flex min-h-screen">
      {/* Icon rail */}
      <aside className="sticky top-0 hidden h-screen w-[84px] shrink-0 flex-col items-center gap-3 py-6 md:flex">
        <Link href="/" aria-label="BuildCore home" className="mb-4 grid size-11 place-items-center rounded-2xl bg-lime shadow-[0_0_28px_rgba(196,242,74,0.35)]">
          <span className="text-sm font-black tracking-tighter text-ink">BC</span>
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-2.5">
          {MODULES.map((m, i) => {
            const Icon = MODULE_ICONS[i];
            const active = m.live ? pathname.startsWith("/tenders") || pathname.startsWith("/rates") : pathname === m.href;
            return (
              <Link
                key={m.slug}
                href={m.href}
                title={`${m.name}${m.live ? "" : " — coming soon"}`}
                className={cn(
                  "group relative grid size-11 place-items-center rounded-full border transition",
                  active ? "border-lime/50 bg-lime/15 text-lime" : "border-white/[0.07] bg-panel/80 text-soft hover:text-white",
                  !m.live && !active && "opacity-60",
                )}
              >
                <Icon className="size-[18px]" />
                <span className="pointer-events-none absolute left-14 z-40 whitespace-nowrap rounded-xl bg-panel2 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {m.no} · {m.name}
                  {!m.live && <span className="ml-1.5 text-muted">soon</span>}
                </span>
              </Link>
            );
          })}
        </nav>
        <Link href="/modules" title="Help" className="grid size-10 place-items-center rounded-full text-muted hover:text-white">
          <CircleHelp className="size-5" />
        </Link>
      </aside>

      <div className="min-w-0 flex-1 px-4 pb-16 pt-5 md:pl-2 md:pr-8 md:pt-6">
        {/* Top bar */}
        <header className="mb-7 flex items-center gap-3">
          <Link href="/" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-lime md:hidden" aria-label="BuildCore home">
            <span className="text-xs font-black text-ink">BC</span>
          </Link>
          <nav className="no-scrollbar -my-2 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2">
            {TOP_NAV.map((n) => {
              const active = n.match(pathname);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition",
                    active
                      ? "bg-lime text-ink shadow-[0_0_24px_rgba(196,242,74,0.25)]"
                      : "border border-white/[0.07] bg-panel/80 text-soft hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  {n.label}
                  {n.href === "/tenders" && reviewCount > 0 && (
                    <span className={cn("grid size-5 place-items-center rounded-full text-[10px] font-bold", active ? "bg-ink text-lime" : "bg-c-orange text-white")}>
                      {reviewCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <button className="hidden h-11 items-center gap-2 2xl:inline-flex rounded-full border border-white/[0.07] bg-panel/80 px-4 text-sm font-semibold text-soft hover:text-white">
              <UserPlus className="size-4" /> Invite user
            </button>
            <button aria-label="Messages" className="grid size-11 place-items-center rounded-full border border-white/[0.07] bg-panel/80 text-soft hover:text-white">
              <Mail className="size-4" />
            </button>
            <button aria-label="Notifications" className="relative grid size-11 place-items-center rounded-full border border-white/[0.07] bg-panel/80 text-soft hover:text-white">
              <Bell className="size-4" />
              {reviewCount > 0 && <span className="absolute right-3 top-3 size-2 rounded-full bg-c-red" />}
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden text-right xl:block">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-xs text-muted">{user.role}</p>
            </div>
            <Avatar name={user.name} className="size-11 text-sm" />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

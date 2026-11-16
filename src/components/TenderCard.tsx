"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { allItems, tenderValue } from "@/lib/calc";
import { CURRENCY, cn, daysUntil, num, tenderHref } from "@/lib/format";
import type { Sector, Tender } from "@/lib/types";
import { Avatar } from "./ui";

export const SECTOR_BG: Record<Sector, string> = {
  Commercial: "bg-c-blue",
  Residential: "bg-c-orange",
  Industrial: "bg-c-magenta",
  Infrastructure: "bg-c-cyan",
  Healthcare: "bg-c-green",
  Education: "bg-c-red",
  "Fit-out": "bg-c-magenta",
};

export const SECTOR_BORDER: Record<Sector, string> = {
  Commercial: "border-c-blue",
  Residential: "border-c-orange",
  Industrial: "border-c-magenta",
  Infrastructure: "border-c-cyan",
  Healthcare: "border-c-green",
  Education: "border-c-red",
  "Fit-out": "border-c-magenta",
};

export function TenderCard({ t, className }: { t: Tender; className?: string }) {
  const value = tenderValue(t);
  const d = daysUntil(t.submissionDate);
  const due =
    t.status === "submitted" ? "Awaiting result" : d < 0 ? `Closed ${-d}d ago` : d === 0 ? "Due today" : `Due in ${d} days`;
  return (
    <Link
      href={tenderHref(t.id)}
      className={cn(
        "group relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-[24px] p-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5",
        SECTOR_BG[t.sector],
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/80">#{t.sector}</p>
          <p className="mt-0.5 line-clamp-2 text-lg font-bold leading-snug">{t.title}</p>
          <p className="mt-1 text-xs text-white/80">
            BOQ items: {allItems(t).length} · {due}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 transition group-hover:bg-white/30">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-2">
        <p className="text-2xl font-extrabold tracking-tight">
          <span className="mr-1 text-sm font-semibold text-white/80">{CURRENCY}</span>
          {value > 0 ? num(value) : "—"}
        </p>
        <div className="flex -space-x-2">
          <Avatar name={t.estimator} />
          <Avatar name={t.tenderEngineer} />
        </div>
      </div>
    </Link>
  );
}

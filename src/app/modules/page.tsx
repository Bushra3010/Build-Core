import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/format";
import { MODULES } from "@/lib/modules";

export default function ModulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-muted">BuildCore ERP</p>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Modules<sup className="ml-1 text-base font-medium text-muted">{`{${MODULES.length}}`}</sup>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">One connected system from tender to final accounts. Tender & Estimation is live; the other modules follow in order.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => (
          <Link key={m.slug} href={m.live ? m.href : `/modules/${m.slug}`} className="group flex min-h-[220px] flex-col justify-between rounded-[28px] border border-white/[0.06] bg-panel/85 p-5 transition hover:-translate-y-0.5 hover:border-white/15">
            <div>
              <div className="flex items-center justify-between">
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold text-ink", m.color)}>{m.no}</span>
                <span className="grid size-9 place-items-center rounded-full bg-panel2 transition group-hover:bg-lime group-hover:text-ink">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <h2 className="mt-4 text-lg font-bold">{m.name}</h2>
              <p className="mt-1 text-sm text-muted">{m.tagline}</p>
            </div>
            <p className={cn("mt-4 text-xs font-bold uppercase tracking-widest", m.live ? "text-lime" : "text-muted")}>{m.live ? "Live" : "Coming soon"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

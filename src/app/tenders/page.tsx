"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { allItems, tenderValue } from "@/lib/calc";
import { cn, daysUntil, fmtDate, money, tenderHref } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { TenderStatus } from "@/lib/types";
import { SECTOR_BG } from "@/components/TenderCard";
import { Avatar, Empty, LinkButton, Loading, Panel, STATUS_META, StatusBadge, inputCls } from "@/components/ui";

const FILTERS: ("all" | TenderStatus)[] = ["all", "enquiry", "estimating", "review", "submitted", "won", "lost", "declined"];

export default function TendersPage() {
  const { ready, tenders } = useStore();
  const [filter, setFilter] = useState<"all" | TenderStatus>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"deadline" | "value" | "recent">("deadline");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = tenders.filter(
      (t) =>
        (filter === "all" || t.status === filter) &&
        (!term || [t.title, t.code, t.client.name, t.location, t.sector].some((s) => s.toLowerCase().includes(term))),
    );
    return [...list].sort((a, b) =>
      sort === "value" ? tenderValue(b) - tenderValue(a) : sort === "recent" ? b.receivedDate.localeCompare(a.receivedDate) : a.submissionDate.localeCompare(b.submissionDate),
    );
  }, [tenders, filter, q, sort]);

  if (!ready) return <Loading />;

  const count = (f: "all" | TenderStatus) => (f === "all" ? tenders.length : tenders.filter((t) => t.status === f).length);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">Tender & Estimation</p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Tender register<sup className="ml-1 text-base font-medium text-muted">{`{${tenders.length}}`}</sup>
          </h1>
        </div>
        <LinkButton href="/tenders/new" variant="lime">
          <Plus className="size-4" /> New tender
        </LinkButton>
      </div>

      <Panel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
                  filter === f ? "bg-lime text-ink" : "bg-panel2 text-soft hover:text-white",
                )}
              >
                {f === "all" ? "All" : STATUS_META[f].label}
                <span className={cn("text-xs", filter === f ? "text-ink/70" : "text-muted")}>{count(f)}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 xl:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input className={cn(inputCls, "pl-10")} placeholder="Search title, client, code…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className={cn(inputCls, "w-auto")} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
              <option value="deadline">By deadline</option>
              <option value="value">By value</option>
              <option value="recent">Recently received</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          {rows.length === 0 ? (
            <Empty title="No tenders match" text="Try another status filter or search term." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th className="pb-3 pl-3 font-semibold">Tender</th>
                      <th className="pb-3 font-semibold">Client</th>
                      <th className="pb-3 font-semibold">Submission</th>
                      <th className="pb-3 text-right font-semibold">Bid value</th>
                      <th className="pb-3 pl-6 font-semibold">Status</th>
                      <th className="pb-3 pr-3 font-semibold">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => {
                      const d = daysUntil(t.submissionDate);
                      const open = ["enquiry", "estimating", "review"].includes(t.status);
                      return (
                        <tr key={t.id} className="group border-t border-white/[0.05]">
                          <td className="py-3 pl-3 pr-4">
                            <Link href={tenderHref(t.id)} className="flex items-center gap-3">
                              <span className={cn("h-10 w-1.5 shrink-0 rounded-full", SECTOR_BG[t.sector])} />
                              <span className="min-w-0">
                                <span className="block max-w-[300px] truncate font-semibold group-hover:text-lime">{t.title}</span>
                                <span className="text-xs text-muted">
                                  {t.code} · {t.sector} · {allItems(t).length} BOQ items
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="py-3">
                            <span className="block max-w-[180px] truncate">{t.client.name}</span>
                            <span className="text-xs text-muted">{t.location}</span>
                          </td>
                          <td className="py-3">
                            <span className="block whitespace-nowrap">{fmtDate(t.submissionDate)}</span>
                            {open && (
                              <span className={cn("text-xs font-semibold", d < 0 ? "text-[#ff8a8d]" : d <= 7 ? "text-c-orange" : "text-muted")}>
                                {d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : `${d} days left`}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap py-3 text-right font-semibold tabular-nums">{tenderValue(t) > 0 ? money(tenderValue(t)) : "—"}</td>
                          <td className="py-3 pl-6">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex -space-x-2">
                              <Avatar name={t.estimator} />
                              <Avatar name={t.tenderEngineer} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="flex flex-col gap-3 lg:hidden">
                {rows.map((t) => (
                  <li key={t.id}>
                    <Link href={tenderHref(t.id)} className="flex gap-3 rounded-2xl bg-panel2/70 p-4">
                      <span className={cn("w-1.5 shrink-0 rounded-full", SECTOR_BG[t.sector])} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-snug">{t.title}</p>
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {t.code} · {t.client.name}
                        </p>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-soft">Due {fmtDate(t.submissionDate)}</span>
                          <span className="font-semibold">{tenderValue(t) > 0 ? money(tenderValue(t)) : "—"}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}

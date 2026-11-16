"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Briefcase, ChevronLeft, ChevronRight, ClipboardCheck, Plus, Trophy } from "lucide-react";
import { tenderValue } from "@/lib/calc";
import { CURRENCY, cn, daysUntil, fmtDate, initials, num, parseISO, short, toISO, todayISO, tenderHref } from "@/lib/format";
import { MODULES } from "@/lib/modules";
import { useStore } from "@/lib/store";
import type { Tender } from "@/lib/types";
import { SECTOR_BORDER, TenderCard } from "@/components/TenderCard";
import { ArrowLink, Chip, IconCircle, Loading, Panel, PanelTitle, StatusBadge } from "@/components/ui";

const OPEN = ["enquiry", "estimating", "review"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Dashboard() {
  const { ready, tenders, projects } = useStore();
  if (!ready) return <Loading />;
  return <DashboardView tenders={tenders} projectsCount={projects.length} />;
}

function DashboardView({ tenders, projectsCount }: { tenders: Tender[]; projectsCount: number }) {
  const { resetDemo } = useStore();
  const open = tenders.filter((t) => (OPEN as readonly string[]).includes(t.status));
  const pipeline = open.reduce((a, t) => a + tenderValue(t), 0);
  const decided = tenders.filter((t) => t.status === "won" || t.status === "lost");
  const won = tenders.filter((t) => t.status === "won");
  const winRate = decided.length ? Math.round((won.length / decided.length) * 100) : 0;
  const submittedAll = tenders.filter((t) => t.submittedValue);
  const avgBid = submittedAll.length ? submittedAll.reduce((a, t) => a + (t.submittedValue ?? 0), 0) / submittedAll.length : 0;
  const wonValue = won.reduce((a, t) => a + (t.submittedValue ?? 0), 0);

  const attention = tenders
    .filter((t) => (OPEN as readonly string[]).includes(t.status))
    .map((t) => ({ t, d: daysUntil(t.submissionDate) }))
    .filter(({ t, d }) => d <= 7 || t.status === "review")
    .sort((a, b) => a.d - b.d);

  return (
    <div className="flex flex-col gap-6">
      {/* Heading + KPIs */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Dashboard</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            Tender & Estimation overview · {fmtDate(todayISO())}
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs">Demo data</span>
            <button onClick={() => confirm("Reset all demo data to its original state?") && resetDemo()} className="text-xs font-semibold text-lime hover:underline">
              Reset
            </button>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:flex xl:gap-8">
          <Kpi icon={<Briefcase className="size-5" />} value={`${CURRENCY} ${short(pipeline)}`} chip={`${open.length} open`} label="Pipeline value of open tenders" />
          <Kpi icon={<Trophy className="size-5" />} value={`${winRate}%`} chip={`${won.length} won`} label="Win rate on decided bids" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Open tenders */}
        <Panel className="xl:col-span-8">
          <PanelTitle title="Tenders" count={open.length}>
            <ArrowLink href="/tenders" className="bg-panel2 hover:bg-line" />
          </PanelTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/tenders/new"
              className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-white/15 bg-panel2/60 text-muted transition hover:border-lime/50 hover:text-lime"
            >
              <Plus className="size-7" />
              <span className="text-sm font-semibold">New tender enquiry</span>
            </Link>
            {open.slice(0, 5).map((t) => (
              <TenderCard key={t.id} t={t} />
            ))}
          </div>
        </Panel>

        {/* Deadline calendar */}
        <Panel className="xl:col-span-4">
          <DeadlineCalendar tenders={tenders} />
        </Panel>

        {/* This year */}
        <Panel className="xl:col-span-5">
          <PanelTitle title="Tenders this year">
            <ArrowLink href="/tenders" className="bg-panel2 hover:bg-line" />
          </PanelTitle>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-soft">Average bid value</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-lime">
                <span className="mr-1 text-lg">{CURRENCY}</span>
                {num(avgBid)}
              </p>
              <p className="mt-1 text-xs text-muted">{submittedAll.length} bids submitted</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-soft">Value won</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-lime">
                <span className="mr-1 text-lg">{CURRENCY}</span>
                {short(wonValue)}
              </p>
              <p className="mt-1 text-xs text-muted">{projectsCount} project(s) handed to planning</p>
            </div>
          </div>
          <StatusSplit tenders={tenders} />
        </Panel>

        {/* Bid value by month */}
        <Panel className="xl:col-span-7">
          <BidValueByMonth tenders={tenders} />
        </Panel>

        {/* Needs attention */}
        <Panel className="xl:col-span-7">
          <PanelTitle title="Needs attention" count={attention.length} />
          {attention.length === 0 ? (
            <p className="text-sm text-muted">Nothing urgent. No open tender is due within 7 days.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attention.map(({ t, d }) => (
                <li key={t.id}>
                  <Link href={tenderHref(t.id)} className="flex items-center gap-3 rounded-2xl bg-panel2/70 p-3 transition hover:bg-panel2">
                    <IconCircle className={cn("size-10", t.status === "review" ? "text-c-orange" : "text-c-red")}>
                      {t.status === "review" ? <ClipboardCheck className="size-4" /> : <AlertTriangle className="size-4" />}
                    </IconCircle>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className="text-xs text-muted">
                        {t.code} · {t.status === "review" ? `Awaiting ${t.approvals.find((a) => a.status !== "approved")?.role ?? "submission"}` : "Submission"} ·{" "}
                        {d < 0 ? `${-d} days overdue` : d === 0 ? "due today" : `due in ${d} days`}
                      </p>
                    </div>
                    <StatusBadge status={t.status} className="hidden sm:inline-flex" />
                    <ArrowUpRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Module roadmap */}
        <Panel className="xl:col-span-5">
          <PanelTitle title="ERP modules" count={MODULES.length}>
            <ArrowLink href="/modules" className="bg-panel2 hover:bg-line" />
          </PanelTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {MODULES.map((m) => (
              <li key={m.slug}>
                <Link href={m.href} className="flex items-center gap-3 rounded-2xl bg-panel2/70 px-3 py-2.5 transition hover:bg-panel2">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-ink", m.color)}>{m.no}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.name}</span>
                  {m.live ? <Chip className="px-2 py-0.5 text-[10px]">Live</Chip> : <span className="text-[10px] font-semibold uppercase text-muted">Soon</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ icon, value, chip, label }: { icon: React.ReactNode; value: string; chip: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <IconCircle className="size-12">{icon}</IconCircle>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl font-extrabold tracking-tight">{value}</span>
          <Chip>{chip}</Chip>
        </div>
        <p className="mt-0.5 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

function StatusSplit({ tenders }: { tenders: Tender[] }) {
  const groups = [
    { label: "Open", n: tenders.filter((t) => (OPEN as readonly string[]).includes(t.status)).length, cls: "bg-c-blue" },
    { label: "Submitted", n: tenders.filter((t) => t.status === "submitted").length, cls: "bg-c-magenta" },
    { label: "Won", n: tenders.filter((t) => t.status === "won").length, cls: "bg-lime" },
    { label: "Lost / no-bid", n: tenders.filter((t) => t.status === "lost" || t.status === "declined").length, cls: "bg-c-red" },
  ];
  const total = Math.max(1, tenders.length);
  return (
    <div className="mt-6">
      <div className="flex h-3 overflow-hidden rounded-full bg-ink/60">
        {groups.map((g) => (
          <div key={g.label} className={g.cls} style={{ width: `${(g.n / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {groups.map((g) => (
          <span key={g.label} className="flex items-center gap-2 text-xs text-soft">
            <span className={cn("size-2 rounded-full", g.cls)} />
            {g.label} <b className="text-white">{g.n}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function BidValueByMonth({ tenders }: { tenders: Tender[] }) {
  const now = new Date();
  const months = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const data = months.map(({ y, m }) => {
    const inMonth = tenders.filter((t) => {
      const d = parseISO(t.submittedOn ?? t.submissionDate);
      return d.getFullYear() === y && d.getMonth() === m && t.status !== "declined";
    });
    return { y, m, value: inMonth.reduce((a, t) => a + tenderValue(t), 0), count: inMonth.length };
  });
  const max = Math.max(1, ...data.map((d) => d.value));
  const currentIdx = 5;
  const [sel, setSel] = useState(currentIdx);
  const s = data[sel];

  return (
    <>
      <PanelTitle title="Bid value by month" count={`${s.count} bids`} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {data.map((d, i) => (
          <button
            key={`${d.y}-${d.m}`}
            onClick={() => setSel(i)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition",
              i === sel ? "bg-lime text-ink" : "bg-panel2 text-soft hover:text-white",
            )}
          >
            {MONTHS[d.m]}
          </button>
        ))}
      </div>
      <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
        {data.map((d, i) => (
          <button key={`${d.y}-${d.m}-bar`} onClick={() => setSel(i)} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" aria-label={`${MONTHS[d.m]} ${d.y}`}>
            {i === sel && d.value > 0 && <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-ink">{short(d.value)}</span>}
            <div
              className={cn("w-full max-w-12 rounded-t-xl rounded-b-md transition", i === sel ? "bg-lime" : "bg-panel2 group-hover:bg-line", i > currentIdx && i !== sel && "bg-panel2/50")}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Submitted value for past months; live bid price for tenders still due. Selected: {MONTHS[s.m]} {s.y} · {CURRENCY} {num(s.value)}</p>
    </>
  );
}

function DeadlineCalendar({ tenders }: { tenders: Tender[] }) {
  const [offset, setOffset] = useState(0);
  const { year, month, cells } = useMemo(() => {
    const base = new Date();
    const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const y = first.getFullYear();
    const m = first.getMonth();
    const startPad = (first.getDay() + 6) % 7; // Monday-first
    const days = new Date(y, m + 1, 0).getDate();
    const list: { iso: string; day: number; inMonth: boolean }[] = [];
    for (let i = -startPad; i < Math.ceil((startPad + days) / 7) * 7 - startPad; i++) {
      const d = new Date(y, m, i + 1);
      list.push({ iso: toISO(d), day: d.getDate(), inMonth: d.getMonth() === m });
    }
    return { year: y, month: m, cells: list };
  }, [offset]);

  const byDate = new Map<string, Tender[]>();
  for (const t of tenders) {
    if (t.status === "declined") continue;
    const arr = byDate.get(t.submissionDate) ?? [];
    arr.push(t);
    byDate.set(t.submissionDate, arr);
  }
  const today = todayISO();

  return (
    <>
      <PanelTitle title="Calendar" count={`${MONTHS[month]} ${year}`}>
        <button onClick={() => setOffset((o) => o - 1)} className="grid size-9 place-items-center rounded-full bg-panel2 hover:bg-line" aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </button>
        <button onClick={() => setOffset((o) => o + 1)} className="grid size-9 place-items-center rounded-full bg-panel2 hover:bg-line" aria-label="Next month">
          <ChevronRight className="size-4" />
        </button>
      </PanelTitle>
      <div className="mx-auto w-full max-w-md">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {cells.map((c) => {
          const due = byDate.get(c.iso) ?? [];
          const first = due[0];
          return (
            <Link
              key={c.iso}
              href={first ? tenderHref(first.id) : "#"}
              title={due.map((t) => `${t.code} — ${t.title}`).join("\n") || undefined}
              className={cn(
                "relative flex aspect-square flex-col justify-between rounded-2xl border-2 p-1.5 text-left text-xs font-semibold transition",
                first ? cn(SECTOR_BORDER[first.sector], "bg-panel2 hover:bg-line") : "border-transparent bg-panel2/50 pointer-events-none",
                !c.inMonth && "opacity-35",
                c.iso === today && "ring-2 ring-lime ring-offset-2 ring-offset-panel",
              )}
            >
              <span>{c.day}</span>
              {first && (
                <span className="flex -space-x-1.5 self-end">
                  {due.slice(0, 2).map((t) => (
                    <span key={t.id} className="grid size-4 place-items-center rounded-full bg-soft text-[7px] font-bold text-ink sm:size-5 sm:text-[8px]">
                      {initials(t.estimator)}
                    </span>
                  ))}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      </div>
      <p className="mt-4 text-xs text-muted">Bordered days are tender submission deadlines, coloured by sector.</p>
    </>
  );
}

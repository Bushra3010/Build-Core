"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FolderKanban, ThumbsDown, Trophy } from "lucide-react";
import { allItems, pricing } from "@/lib/calc";
import { CURRENCY, cn, fmtDate, num, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Tender } from "@/lib/types";
import { Button, Empty, Field, NumInput, Panel, PanelTitle, inputCls } from "@/components/ui";

type Update = (mutate: (t: Tender) => void, log?: string) => void;

export function OutcomePanel({ t, update }: { t: Tender; update: Update }) {
  const { createProject, projects } = useStore();
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [winning, setWinning] = useState(0);
  const value = t.submittedValue ?? pricing(t).bidPrice;

  if (t.status === "submitted") {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle title="Record outcome" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Result date">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Winning price, if lost (AED)">
              <NumInput className={inputCls} value={winning} min={0} onChange={setWinning} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea className={cn(inputCls, "h-24 py-3")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Award letter ref, negotiation outcome, reason lost…" />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="lime"
              onClick={() =>
                update((x) => {
                  x.status = "won";
                  x.outcome = { date, note: note.trim() };
                }, "Tender won")
              }
            >
              <Trophy className="size-4" /> Mark as won
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                update((x) => {
                  x.status = "lost";
                  x.outcome = { date, note: note.trim(), winningPrice: winning || undefined };
                }, "Tender lost")
              }
            >
              <ThumbsDown className="size-4" /> Mark as lost
            </Button>
          </div>
        </Panel>
        <Panel>
          <PanelTitle title="Submitted bid" />
          <p className="text-4xl font-extrabold text-lime">
            {CURRENCY} {num(value)}
          </p>
          <p className="mt-2 text-sm text-muted">Submitted {fmtDate(t.submittedOn)} to {t.client.name}.</p>
        </Panel>
      </div>
    );
  }

  if (t.status === "won") {
    const project = projects.find((p) => p.code === t.projectCode);
    const items = allItems(t);
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle title={project ? "Project created" : "Hand off to planning"} />
          {project ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-3xl bg-lime p-5 text-ink">
                <FolderKanban className="size-8" />
                <div>
                  <p className="text-sm font-semibold">Project code</p>
                  <p className="text-3xl font-extrabold">{project.code}</p>
                </div>
              </div>
              <p className="text-sm text-soft">
                Created {fmtDate(project.createdOn)} · Stage: <b className="text-white">{project.stage}</b>
              </p>
              <Link href="/modules/budgeting-scheduling" className="inline-flex items-center gap-2 text-sm font-semibold text-lime hover:underline">
                Next: Budgeting & Scheduling (module 02) <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-soft">Creating the project transfers the won BOQ, rates and client details to Budgeting & Scheduling, where the planning team builds the WBS and baseline.</p>
              <Button variant="lime" className="self-start" onClick={() => createProject(t.id)}>
                <FolderKanban className="size-4" /> Create project
              </Button>
            </div>
          )}
        </Panel>
        <Panel>
          <PanelTitle title="What transfers" />
          <ul className="flex flex-col gap-2 text-sm">
            {[
              ["Contract value", `${CURRENCY} ${num(value)}`],
              ["Client", t.client.name],
              ["BOQ", `${items.length} items in ${t.boq.length} sections`],
              ["Rate build-up", "Material · labour · equipment · subcontract"],
              ["Accepted quotes", `${t.quotes.filter((q) => q.selected).length} vendor quote(s)`],
              ["Awarded", fmtDate(t.outcome?.date)],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between gap-4 rounded-2xl bg-panel2/60 px-4 py-3">
                <span className="text-muted">{k}</span>
                <span className="flex items-center gap-2 text-right font-semibold">
                  {project && <CheckCircle2 className="size-4 text-lime" />}
                  {v}
                </span>
              </li>
            ))}
          </ul>
          {t.outcome?.note && <p className="mt-4 text-sm text-soft">“{t.outcome.note}”</p>}
        </Panel>
      </div>
    );
  }

  if (t.status === "lost") {
    const w = t.outcome?.winningPrice;
    const gap = w ? ((value - w) / w) * 100 : null;
    return (
      <Panel>
        <PanelTitle title="Lost — price comparison" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Our bid" value={`${CURRENCY} ${num(value)}`} />
          <Stat label="Winning price" value={w ? `${CURRENCY} ${num(w)}` : "Not known"} />
          <Stat label="Gap" value={gap !== null ? `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%` : "—"} accent={gap !== null && gap > 0} />
        </div>
        {t.outcome?.note && <p className="mt-5 text-sm text-soft">“{t.outcome.note}” · {fmtDate(t.outcome.date)}</p>}
      </Panel>
    );
  }

  if (t.status === "declined") {
    return (
      <Panel>
        <PanelTitle title="No-bid decision" />
        <p className="text-sm text-soft">{t.noBidReason || "No reason recorded."}</p>
      </Panel>
    );
  }

  return (
    <Panel>
      <Empty title="No outcome yet" text="The result is recorded once the bid has been approved and submitted to the client." />
    </Panel>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-3xl bg-panel2/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-2 text-2xl font-extrabold", accent ? "text-[#ff8a8d]" : "text-white")}>{value}</p>
    </div>
  );
}

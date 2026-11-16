"use client";

import { COST_LABEL, COST_TYPES, costBreakdown, pricing, sectionTotal } from "@/lib/calc";
import { CURRENCY, cn, num } from "@/lib/format";
import type { Markup, Tender } from "@/lib/types";
import { Field, NumInput, Panel, PanelTitle, inputCls } from "@/components/ui";

type Update = (mutate: (t: Tender) => void, log?: string) => void;

const BAR = { material: "bg-c-blue", labour: "bg-c-orange", equipment: "bg-c-cyan", subcontract: "bg-c-magenta" } as const;

const MARKUPS: { key: keyof Markup; label: string; hint: string }[] = [
  { key: "overheadPct", label: "Overheads %", hint: "On direct cost" },
  { key: "contingencyPct", label: "Contingency %", hint: "On direct cost" },
  { key: "profitPct", label: "Profit %", hint: "On cost incl. overheads" },
  { key: "taxPct", label: "VAT %", hint: "Added to bid price" },
];

export function PricingPanel({ t, editable, update }: { t: Tender; editable: boolean; update: Update }) {
  const cost = costBreakdown(t);
  const p = pricing(t);
  const budgetGap = t.clientBudget ? ((p.bidPrice - t.clientBudget) / t.clientBudget) * 100 : null;

  const rows = [
    { label: "Direct cost", value: p.direct },
    { label: `Overheads (${t.markup.overheadPct}%)`, value: p.overhead },
    { label: `Contingency (${t.markup.contingencyPct}%)`, value: p.contingency },
    { label: `Profit (${t.markup.profitPct}%)`, value: p.profit },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="flex flex-col gap-6 xl:col-span-7">
        <Panel>
          <PanelTitle title="Overheads & profit" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MARKUPS.map((m) => (
              <Field key={m.key} label={m.label} hint={m.hint}>
                <NumInput
                  className={inputCls}
                  value={t.markup[m.key]}
                  min={0}
                  max={100}
                  disabled={!editable}
                  onChange={(n) => update((x) => void (x.markup[m.key] = Math.max(0, Math.min(100, n))))}
                />
              </Field>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="Cost breakdown" />
          <div className="flex h-4 overflow-hidden rounded-full bg-ink/60">
            {COST_TYPES.map((c) => (
              <div key={c} className={BAR[c]} style={{ width: `${cost.direct ? (cost[c] / cost.direct) * 100 : 0}%` }} />
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COST_TYPES.map((c) => (
              <div key={c} className="rounded-2xl bg-panel2/60 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span className={cn("size-2 rounded-full", BAR[c])} />
                  {COST_LABEL[c]}
                </p>
                <p className="mt-2 text-lg font-bold tabular-nums">{num(cost[c])}</p>
                <p className="text-xs text-muted">{cost.direct ? ((cost[c] / cost.direct) * 100).toFixed(1) : 0}% of direct</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="By section" />
          <ul className="flex flex-col gap-3">
            {t.boq.map((s) => {
              const v = sectionTotal(s);
              const pct = cost.direct ? (v / cost.direct) * 100 : 0;
              return (
                <li key={s.id}>
                  <div className="flex justify-between text-sm">
                    <span>
                      <b className="mr-2 text-lime">{s.code}</b>
                      {s.name}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {num(v)} <span className="text-xs text-muted">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-ink/60">
                    <div className="h-2 rounded-full bg-lime/80" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
            {t.boq.length === 0 && <p className="text-sm text-muted">No BOQ sections yet.</p>}
          </ul>
        </Panel>
      </div>

      <Panel className="h-fit xl:sticky xl:top-6 xl:col-span-5">
        <PanelTitle title="Bid summary" />
        <ul className="flex flex-col divide-y divide-white/[0.05]">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between py-3 text-sm">
              <span className="text-soft">{r.label}</span>
              <span className="font-semibold tabular-nums">{num(r.value)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-3xl bg-lime p-5 text-ink">
          <p className="text-sm font-semibold">Bid price (excl. VAT)</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">
            <span className="mr-1 text-lg">{CURRENCY}</span>
            {num(p.bidPrice)}
          </p>
          <p className="mt-1 text-sm font-medium">Margin {p.marginPct.toFixed(1)}% · Profit {CURRENCY} {num(p.profit)}</p>
        </div>
        <ul className="mt-3 flex flex-col divide-y divide-white/[0.05]">
          <li className="flex justify-between py-3 text-sm">
            <span className="text-soft">VAT ({t.markup.taxPct}%)</span>
            <span className="font-semibold tabular-nums">{num(p.tax)}</span>
          </li>
          <li className="flex justify-between py-3 text-sm">
            <span className="font-semibold">Total incl. VAT</span>
            <span className="text-lg font-bold tabular-nums">
              {CURRENCY} {num(p.total)}
            </span>
          </li>
          {t.clientBudget ? (
            <li className="flex justify-between py-3 text-sm">
              <span className="text-soft">vs client budget {CURRENCY} {num(t.clientBudget)}</span>
              <span className={cn("font-bold", budgetGap! > 0 ? "text-[#ff8a8d]" : "text-lime")}>
                {budgetGap! > 0 ? "+" : ""}
                {budgetGap!.toFixed(1)}%
              </span>
            </li>
          ) : null}
        </ul>
        {t.submittedValue !== undefined && (
          <p className="mt-3 rounded-2xl bg-c-magenta/15 px-4 py-3 text-sm text-[#e59af5]">
            Submitted value frozen at {CURRENCY} {num(t.submittedValue)}.
          </p>
        )}
      </Panel>
    </div>
  );
}

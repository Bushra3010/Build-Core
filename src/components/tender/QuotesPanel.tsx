"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { COST_LABEL, COST_TYPES, allItems } from "@/lib/calc";
import { cn, daysUntil, fmtDate, num2, uid } from "@/lib/format";
import { emptyQuote } from "@/lib/seed";
import type { CostType, Quote, Tender } from "@/lib/types";
import { Button, Empty, Field, NumInput, Panel, PanelTitle, inputCls } from "@/components/ui";

type Update = (mutate: (t: Tender) => void, log?: string) => void;

export function QuotesPanel({ t, editable, update }: { t: Tender; editable: boolean; update: Update }) {
  const items = allItems(t);
  const [form, setForm] = useState<Omit<Quote, "id">>(() => emptyQuote(items[0]?.id ?? ""));
  const [error, setError] = useState("");
  const itemId = form.itemId || items[0]?.id || "";

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId) return setError("Add BOQ items first");
    if (!form.vendor.trim()) return setError("Enter the vendor name");
    if (form.unitRate <= 0) return setError("Enter the quoted unit rate");
    setError("");
    const item = items.find((i) => i.id === itemId);
    update((x) => {
      x.quotes.push({ ...form, itemId, vendor: form.vendor.trim(), id: uid(), selected: false });
    }, `Quote from ${form.vendor.trim()} added for ${item?.code}`);
    setForm((f) => ({ ...emptyQuote(itemId), costType: f.costType }));
  }

  function apply(q: Quote) {
    update((x) => {
      const item = x.boq.flatMap((s) => s.items).find((i) => i.id === q.itemId);
      if (!item) return;
      item.rates[q.costType] = q.unitRate;
      for (const o of x.quotes) if (o.itemId === q.itemId && o.costType === q.costType) o.selected = o.id === q.id;
    }, `Applied ${q.vendor} ${COST_LABEL[q.costType].toLowerCase()} rate ${num2(q.unitRate)}`);
  }

  const grouped = items
    .map((i) => ({ item: i, quotes: t.quotes.filter((q) => q.itemId === i.id).sort((a, b) => a.unitRate - b.unitRate) }))
    .filter((g) => g.quotes.length);

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      {editable && (
        <Panel className="xl:col-span-4">
          <PanelTitle title="Record a quote" />
          {items.length === 0 ? (
            <p className="text-sm text-muted">Add BOQ items first, then record supplier and subcontractor quotations against them.</p>
          ) : (
            <form onSubmit={add} className="flex flex-col gap-4" noValidate>
              <Field label="BOQ item">
                <select className={inputCls} value={itemId} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}>
                  {t.boq.map((s) => (
                    <optgroup key={s.id} label={`${s.code} · ${s.name}`}>
                      {s.items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.code} — {i.description || "(no description)"}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Vendor / subcontractor">
                <input className={inputCls} value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} placeholder="Company name" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Applies to">
                  <select className={inputCls} value={form.costType} onChange={(e) => setForm((f) => ({ ...f, costType: e.target.value as CostType }))}>
                    {COST_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {COST_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={`Unit rate / ${items.find((i) => i.id === itemId)?.unit ?? "unit"}`}>
                  <NumInput className={inputCls} value={form.unitRate} min={0} onChange={(n) => setForm((f) => ({ ...f, unitRate: n }))} />
                </Field>
                <Field label="Valid until">
                  <input type="date" className={inputCls} value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
                </Field>
                <Field label="Lead time (days)">
                  <NumInput className={inputCls} value={form.leadTimeDays} min={0} onChange={(n) => setForm((f) => ({ ...f, leadTimeDays: n }))} />
                </Field>
              </div>
              <Field label="Notes">
                <input className={inputCls} value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Exclusions, payment terms…" />
              </Field>
              {error && <p className="text-sm text-[#ff8a8d]">{error}</p>}
              <Button type="submit" variant="lime">
                <Plus className="size-4" /> Add quote
              </Button>
            </form>
          )}
        </Panel>
      )}

      <Panel className={editable ? "xl:col-span-8" : "xl:col-span-12"}>
        <PanelTitle title="Quote comparison" count={t.quotes.length} />
        {grouped.length === 0 ? (
          <Empty title="No quotes yet" text="Quotes you record are compared per BOQ item. Apply the chosen one to update the item rate." />
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map(({ item, quotes }) => (
              <div key={item.id} className="rounded-3xl bg-panel2/60 p-4">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    <span className="mr-2 text-lime">{item.code}</span>
                    {item.description}
                  </p>
                  <p className="text-xs text-muted">
                    Qty {item.qty} {item.unit}
                  </p>
                </div>
                <ul className="flex flex-col gap-2">
                  {quotes.map((q) => {
                    const lowest = quotes.filter((o) => o.costType === q.costType)[0]?.id === q.id;
                    const expired = daysUntil(q.validUntil) < 0;
                    const current = item.rates[q.costType];
                    return (
                      <li key={q.id} className={cn("flex flex-wrap items-center gap-3 rounded-2xl bg-panel px-4 py-3", q.selected && "ring-1 ring-lime/50")}>
                        <div className="min-w-[160px] flex-1">
                          <p className="text-sm font-semibold">
                            {q.vendor}
                            {lowest && <span className="ml-2 rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-bold text-lime">Lowest</span>}
                            {expired && <span className="ml-2 rounded-full bg-c-red/15 px-2 py-0.5 text-[10px] font-bold text-[#ff8a8d]">Expired</span>}
                          </p>
                          <p className="text-xs text-muted">
                            {COST_LABEL[q.costType]} · valid to {fmtDate(q.validUntil)} · {q.leadTimeDays} days lead time{q.notes ? ` · ${q.notes}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold tabular-nums">{num2(q.unitRate)}</p>
                          <p className="text-[11px] text-muted">BOQ rate {num2(current)}</p>
                        </div>
                        {q.selected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-lime">
                            <CheckCircle2 className="size-4" /> Applied
                          </span>
                        ) : (
                          editable && (
                            <Button size="sm" variant="lime" onClick={() => apply(q)}>
                              Apply rate
                            </Button>
                          )
                        )}
                        {editable && (
                          <button
                            onClick={() => update((x) => void (x.quotes = x.quotes.filter((o) => o.id !== q.id)), `Removed quote from ${q.vendor}`)}
                            className="grid size-8 place-items-center rounded-full text-muted hover:bg-c-red/15 hover:text-[#ff8a8d]"
                            aria-label="Delete quote"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

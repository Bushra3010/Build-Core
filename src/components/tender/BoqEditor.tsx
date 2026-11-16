"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, LibraryBig, Plus, Search, Trash2, FileText } from "lucide-react";
import { COST_LABEL, COST_TYPES, costBreakdown, itemAmount, sectionTotal, unitRate } from "@/lib/calc";
import { CURRENCY, cn, num, num2, uid } from "@/lib/format";
import { UNITS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { BoqSection, CostType, RateItem, Tender } from "@/lib/types";
import { Button, Empty, Modal, NumInput, Panel, cellInputCls, inputCls } from "@/components/ui";

type Update = (mutate: (t: Tender) => void, log?: string) => void;

const STARTER = ["Preliminaries", "Substructure", "Superstructure", "Finishes", "MEP Services"];
const letter = (i: number) => String.fromCharCode(65 + (i % 26));

/** Next free item code in a section, e.g. B.4 — never reuses a code after deletions. */
function nextCode(s: BoqSection) {
  const used = s.items.map((i) => Number(i.code.split(".").pop()) || 0);
  return `${s.code}.${Math.max(0, ...used) + 1}`;
}

export function BoqEditor({ t, editable, update }: { t: Tender; editable: boolean; update: Update }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [libOpen, setLibOpen] = useState(false);
  const cost = costBreakdown(t);
  const quoteCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of t.quotes) m.set(q.itemId, (m.get(q.itemId) ?? 0) + 1);
    return m;
  }, [t.quotes]);

  const addSection = (name = "New section") =>
    update((x) => {
      x.boq.push({ id: uid(), code: letter(x.boq.length), name, items: [] });
    });

  const addItem = (sid: string) =>
    update((x) => {
      const s = x.boq.find((s) => s.id === sid)!;
      s.items.push({ id: uid(), code: nextCode(s), description: "", unit: "m3", qty: 0, rates: { material: 0, labour: 0, equipment: 0, subcontract: 0 } });
    });

  const setSection = (sid: string, patch: Partial<BoqSection>) =>
    update((x) => {
      Object.assign(x.boq.find((s) => s.id === sid)!, patch);
    });

  const setItem = (sid: string, iid: string, fn: (i: BoqSection["items"][number]) => void) =>
    update((x) => {
      const i = x.boq.find((s) => s.id === sid)!.items.find((i) => i.id === iid)!;
      fn(i);
    });

  const removeItem = (sid: string, iid: string) =>
    update((x) => {
      const s = x.boq.find((s) => s.id === sid)!;
      s.items = s.items.filter((i) => i.id !== iid);
      x.quotes = x.quotes.filter((q) => q.itemId !== iid);
    });

  const removeSection = (s: BoqSection) => {
    if (s.items.length && !confirm(`Delete section "${s.name}" and its ${s.items.length} item(s)?`)) return;
    update((x) => {
      const ids = new Set(s.items.map((i) => i.id));
      x.boq = x.boq.filter((b) => b.id !== s.id);
      x.quotes = x.quotes.filter((q) => !ids.has(q.itemId));
    }, `Deleted BOQ section ${s.code} ${s.name}`);
  };

  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ["Code", "Description", "Unit", "Qty", "Material", "Labour", "Equipment", "Subcontract", "Unit rate", "Amount"];
    const lines = [head.map(esc).join(",")];
    for (const s of t.boq) {
      lines.push([s.code, s.name.toUpperCase(), "", "", "", "", "", "", "", sectionTotal(s).toFixed(2)].map(esc).join(","));
      for (const i of s.items) {
        lines.push([i.code, i.description, i.unit, i.qty, i.rates.material, i.rates.labour, i.rates.equipment, i.rates.subcontract, unitRate(i.rates).toFixed(2), itemAmount(i).toFixed(2)].map(esc).join(","));
      }
    }
    lines.push(["", "TOTAL DIRECT COST", "", "", "", "", "", "", "", cost.direct.toFixed(2)].map(esc).join(","));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.code}-BOQ.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (t.boq.length === 0) {
    return (
      <Panel>
        <Empty title="No bill of quantities yet" text="Start with the standard trade sections, or add your own. Rates can be typed in, picked from the rate library, or applied from vendor quotes.">
          {editable && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="lime"
                onClick={() =>
                  update((x) => {
                    x.boq = STARTER.map((name, i) => ({ id: uid(), code: letter(i), name, items: [] }));
                  }, "BOQ created from standard sections")
                }
              >
                <FileText className="size-4" /> Use standard sections
              </Button>
              <Button onClick={() => addSection()}>
                <Plus className="size-4" /> Add a section
              </Button>
            </div>
          )}
        </Empty>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {editable && (
            <>
              <Button variant="lime" onClick={() => addSection()}>
                <Plus className="size-4" /> Section
              </Button>
              <Button onClick={() => setLibOpen(true)}>
                <LibraryBig className="size-4" /> Add from rate library
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
        <p className="text-sm text-muted">
          Direct cost <span className="ml-1 text-lg font-bold text-white">{CURRENCY} {num(cost.direct)}</span>
        </p>
      </div>

      {t.boq.map((s) => {
        const isCollapsed = collapsed[s.id];
        return (
          <Panel key={s.id} className="p-0 sm:p-0" testId={`boq-section-${s.code}`}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))}
                className="grid size-8 place-items-center rounded-full bg-panel2 hover:bg-line"
                aria-label={isCollapsed ? "Expand section" : "Collapse section"}
              >
                <ChevronDown className={cn("size-4 transition", isCollapsed && "-rotate-90")} />
              </button>
              <input
                className={cn(cellInputCls, "w-14! shrink-0 text-center font-bold text-lime")}
                value={s.code}
                disabled={!editable}
                onChange={(e) => setSection(s.id, { code: e.target.value })}
                aria-label="Section code"
              />
              <input
                className={cn(cellInputCls, "w-auto! min-w-[160px] flex-1 text-base font-bold")}
                value={s.name}
                disabled={!editable}
                onChange={(e) => setSection(s.id, { name: e.target.value })}
                aria-label="Section name"
              />
              <span className="text-sm text-muted">{s.items.length} items</span>
              <span className="min-w-[130px] text-right font-bold tabular-nums">
                {CURRENCY} {num(sectionTotal(s))}
              </span>
              {editable && (
                <button onClick={() => removeSection(s)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-c-red/15 hover:text-[#ff8a8d]" aria-label="Delete section">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div className="border-t border-white/[0.05] px-2 pb-4 sm:px-3">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="w-16 px-2 py-3 text-left font-semibold">Code</th>
                        <th className="min-w-[280px] px-2 py-3 text-left font-semibold">Description</th>
                        <th className="w-20 px-2 py-3 text-left font-semibold">Unit</th>
                        <th className="w-24 px-2 py-3 text-right font-semibold">Qty</th>
                        {COST_TYPES.map((c) => (
                          <th key={c} className="w-24 px-2 py-3 text-right font-semibold">
                            {c === "equipment" ? "Equip." : c === "subcontract" ? "Subcon." : COST_LABEL[c]}
                          </th>
                        ))}
                        <th className="w-24 px-2 py-3 text-right font-semibold">Rate</th>
                        <th className="w-32 px-2 py-3 text-right font-semibold">Amount</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((i) => {
                        const unpriced = unitRate(i.rates) <= 0 || i.qty <= 0;
                        return (
                          <tr key={i.id} data-testid={`boq-row-${i.code}`} className="border-t border-white/[0.04]">
                            <td className="px-1 py-1">
                              <input className={cellInputCls} value={i.code} disabled={!editable} onChange={(e) => setItem(s.id, i.id, (x) => void (x.code = e.target.value))} aria-label="Item code" />
                            </td>
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-2">
                                <input
                                  className={cn(cellInputCls, "flex-1")}
                                  value={i.description}
                                  placeholder="Describe the work item"
                                  disabled={!editable}
                                  onChange={(e) => setItem(s.id, i.id, (x) => void (x.description = e.target.value))}
                                  aria-label="Description"
                                />
                                {quoteCount.get(i.id) ? (
                                  <span className="shrink-0 rounded-full bg-c-magenta/20 px-2 py-0.5 text-[10px] font-bold text-[#e59af5]" title="Vendor quotes received">
                                    {quoteCount.get(i.id)} quote{quoteCount.get(i.id)! > 1 ? "s" : ""}
                                  </span>
                                ) : null}
                                {unpriced && <span className="size-2 shrink-0 rounded-full bg-c-orange" title="Needs quantity and rate" />}
                              </div>
                            </td>
                            <td className="px-1 py-1">
                              <select className={cellInputCls} value={i.unit} disabled={!editable} onChange={(e) => setItem(s.id, i.id, (x) => void (x.unit = e.target.value))} aria-label="Unit">
                                {[...new Set([i.unit, ...UNITS])].map((u) => (
                                  <option key={u}>{u}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-1 py-1">
                              <NumInput className={cn(cellInputCls, "text-right tabular-nums")} value={i.qty} disabled={!editable} min={0} onChange={(n) => setItem(s.id, i.id, (x) => void (x.qty = n))} aria-label="Quantity" />
                            </td>
                            {COST_TYPES.map((c: CostType) => (
                              <td key={c} className="px-1 py-1">
                                <NumInput
                                  className={cn(cellInputCls, "text-right tabular-nums", i.rates[c] === 0 && "text-muted")}
                                  value={i.rates[c]}
                                  disabled={!editable}
                                  min={0}
                                  onChange={(n) => setItem(s.id, i.id, (x) => void (x.rates[c] = n))}
                                  aria-label={`${COST_LABEL[c]} rate`}
                                />
                              </td>
                            ))}
                            <td className="px-2 py-1 text-right font-semibold tabular-nums">{num2(unitRate(i.rates))}</td>
                            <td className="px-2 py-1 text-right font-bold tabular-nums">{num(itemAmount(i))}</td>
                            <td className="px-1 py-1">
                              {editable && (
                                <button onClick={() => removeItem(s.id, i.id)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-c-red/15 hover:text-[#ff8a8d]" aria-label="Delete item">
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {s.items.length === 0 && <p className="px-3 py-3 text-sm text-muted">No items in this section yet.</p>}
                {editable && (
                  <button onClick={() => addItem(s.id)} className="ml-2 mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-lime hover:bg-lime/10">
                    <Plus className="size-4" /> Add item
                  </button>
                )}
              </div>
            )}
          </Panel>
        );
      })}

      <Panel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COST_TYPES.map((c) => (
            <div key={c}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{COST_LABEL[c]}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{num(cost[c])}</p>
            </div>
          ))}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total direct cost</p>
            <p className="mt-1 text-2xl font-extrabold text-lime tabular-nums">
              {CURRENCY} {num(cost.direct)}
            </p>
          </div>
        </div>
      </Panel>

      {/* Mounted only while open, so search and selection start fresh each time. */}
      {libOpen && (
        <LibraryPicker
          open
          onClose={() => setLibOpen(false)}
          sections={t.boq}
          onAdd={(sid, rates) => {
            update((x) => {
              const s = x.boq.find((b) => b.id === sid)!;
              for (const r of rates) {
                s.items.push({ id: uid(), code: nextCode(s), description: r.description, unit: r.unit, qty: 0, rates: { ...r.rates } });
              }
            }, `Added ${rates.length} item(s) from rate library`);
            setLibOpen(false);
          }}
        />
      )}
    </div>
  );
}

function LibraryPicker({
  open,
  onClose,
  sections,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  sections: BoqSection[];
  onAdd: (sectionId: string, rates: RateItem[]) => void;
}) {
  const { rates } = useStore();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sid, setSid] = useState("");
  const target = sid || sections[0]?.id || "";
  const term = q.toLowerCase();
  const list = rates.filter((r) => !term || `${r.code} ${r.description} ${r.category}`.toLowerCase().includes(term));

  return (
    <Modal open={open} title="Add from rate library" onClose={onClose} wide>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input className={cn(inputCls, "pl-10")} placeholder="Search rates…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
        <select className={cn(inputCls, "sm:w-60")} value={target} onChange={(e) => setSid(e.target.value)} aria-label="Target section">
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              Into {s.code} · {s.name}
            </option>
          ))}
        </select>
      </div>
      <ul className="mt-4 flex max-h-[46vh] flex-col gap-1.5 overflow-y-auto pr-1">
        {list.map((r) => {
          const on = picked.has(r.id);
          return (
            <li key={r.id}>
              <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition", on ? "bg-lime/10 ring-1 ring-lime/40" : "bg-panel2/60 hover:bg-panel2")}>
                <input
                  type="checkbox"
                  className="size-4 accent-[#c4f24a]"
                  checked={on}
                  onChange={() =>
                    setPicked((p) => {
                      const n = new Set(p);
                      if (n.has(r.id)) n.delete(r.id);
                      else n.add(r.id);
                      return n;
                    })
                  }
                />
                <span className="w-14 shrink-0 text-xs font-bold text-muted">{r.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{r.description}</span>
                <span className="text-xs text-muted">{r.unit}</span>
                <span className="w-24 text-right text-sm font-semibold tabular-nums">{num2(unitRate(r.rates))}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="lime"
          disabled={!picked.size || !target}
          onClick={() => {
            onAdd(target, rates.filter((r) => picked.has(r.id)));
            setPicked(new Set());
          }}
        >
          Add {picked.size || ""} item{picked.size === 1 ? "" : "s"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">Items are added with quantity 0 — enter quantities from your take-off.</p>
    </Modal>
  );
}

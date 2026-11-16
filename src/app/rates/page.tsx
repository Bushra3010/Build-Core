"use client";

import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { COST_LABEL, COST_TYPES, unitRate } from "@/lib/calc";
import { cn, num2, uid } from "@/lib/format";
import { UNITS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { Button, Loading, NumInput, Panel, cellInputCls, inputCls } from "@/components/ui";

export default function RatesPage() {
  const { ready, rates, upsertRate, deleteRate, resetDemo } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  if (!ready) return <Loading />;

  const cats = ["All", ...new Set(rates.map((r) => r.category))];
  const term = q.toLowerCase();
  const list = rates.filter((r) => (cat === "All" || r.category === cat) && (!term || `${r.code} ${r.description}`.toLowerCase().includes(term)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">Tender & Estimation</p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Rate library<sup className="ml-1 text-base font-medium text-muted">{`{${rates.length}}`}</sup>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">Standard unit rates by cost type. Estimators pull these into a BOQ, then adjust per tender. Changes here don&apos;t alter existing BOQs.</p>
        </div>
        <Button
          variant="lime"
          onClick={() => {
            upsertRate({ id: uid(), code: `NEW-${rates.length + 1}`, category: cat === "All" ? "General" : cat, description: "New rate", unit: "m2", rates: { material: 0, labour: 0, equipment: 0, subcontract: 0 } });
            setQ("");
          }}
        >
          <Plus className="size-4" /> Add rate
        </Button>
      </div>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-semibold", cat === c ? "bg-lime text-ink" : "bg-panel2 text-soft hover:text-white")}>
                {c}
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input className={cn(inputCls, "pl-10")} placeholder="Search rates…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="w-24 px-2 py-3 text-left font-semibold">Code</th>
                <th className="w-36 px-2 py-3 text-left font-semibold">Category</th>
                <th className="px-2 py-3 text-left font-semibold">Description</th>
                <th className="w-20 px-2 py-3 text-left font-semibold">Unit</th>
                {COST_TYPES.map((c) => (
                  <th key={c} className="w-24 px-2 py-3 text-right font-semibold">
                    {COST_LABEL[c]}
                  </th>
                ))}
                <th className="w-24 px-2 py-3 text-right font-semibold">Rate</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.04]">
                  <td className="px-1 py-1">
                    <input className={cn(cellInputCls, "font-bold text-lime")} value={r.code} onChange={(e) => upsertRate({ ...r, code: e.target.value })} aria-label="Code" />
                  </td>
                  <td className="px-1 py-1">
                    <input className={cellInputCls} value={r.category} onChange={(e) => upsertRate({ ...r, category: e.target.value })} aria-label="Category" />
                  </td>
                  <td className="px-1 py-1">
                    <input className={cellInputCls} value={r.description} onChange={(e) => upsertRate({ ...r, description: e.target.value })} aria-label="Description" />
                  </td>
                  <td className="px-1 py-1">
                    <select className={cellInputCls} value={r.unit} onChange={(e) => upsertRate({ ...r, unit: e.target.value })} aria-label="Unit">
                      {[...new Set([r.unit, ...UNITS])].map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  {COST_TYPES.map((c) => (
                    <td key={c} className="px-1 py-1">
                      <NumInput className={cn(cellInputCls, "text-right tabular-nums", r.rates[c] === 0 && "text-muted")} value={r.rates[c]} min={0} onChange={(n) => upsertRate({ ...r, rates: { ...r.rates, [c]: n } })} aria-label={COST_LABEL[c]} />
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right font-bold tabular-nums">{num2(unitRate(r.rates))}</td>
                  <td className="px-1 py-1">
                    <button onClick={() => confirm(`Delete rate ${r.code}?`) && deleteRate(r.id)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-c-red/15 hover:text-[#ff8a8d]" aria-label="Delete rate">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="px-3 py-6 text-sm text-muted">No rates match.</p>}
        </div>
      </Panel>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => confirm("Reset all demo data (tenders, rates, projects)?") && resetDemo()}>
          Reset demo data
        </Button>
      </div>
    </div>
  );
}

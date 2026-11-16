import type { BoqItem, BoqSection, CostType, RateBreakdown, Tender } from "./types";

export const COST_TYPES: CostType[] = ["material", "labour", "equipment", "subcontract"];

export const COST_LABEL: Record<CostType, string> = {
  material: "Material",
  labour: "Labour",
  equipment: "Equipment",
  subcontract: "Subcontract",
};

export const unitRate = (r: RateBreakdown) => r.material + r.labour + r.equipment + r.subcontract;

export const itemAmount = (i: BoqItem) => i.qty * unitRate(i.rates);

export const sectionTotal = (s: BoqSection) => s.items.reduce((a, i) => a + itemAmount(i), 0);

export const allItems = (t: Tender) => t.boq.flatMap((s) => s.items);

export function costBreakdown(t: Tender) {
  const out: Record<CostType, number> = { material: 0, labour: 0, equipment: 0, subcontract: 0 };
  for (const i of allItems(t)) {
    for (const k of COST_TYPES) out[k] += i.qty * i.rates[k];
  }
  return { ...out, direct: out.material + out.labour + out.equipment + out.subcontract };
}

export function pricing(t: Tender) {
  const { direct } = costBreakdown(t);
  const m = t.markup;
  const overhead = (direct * m.overheadPct) / 100;
  const contingency = (direct * m.contingencyPct) / 100;
  const cost = direct + overhead + contingency;
  const profit = (cost * m.profitPct) / 100;
  const bidPrice = cost + profit;
  const tax = (bidPrice * m.taxPct) / 100;
  const total = bidPrice + tax;
  const marginPct = bidPrice > 0 ? (profit / bidPrice) * 100 : 0;
  return { direct, overhead, contingency, cost, profit, bidPrice, tax, total, marginPct };
}

/** The headline value of a tender: submitted value once frozen, otherwise live bid price. */
export const tenderValue = (t: Tender) => t.submittedValue ?? pricing(t).bidPrice;

export function readiness(t: Tender) {
  const items = allItems(t);
  const unpriced = items.filter((i) => unitRate(i.rates) <= 0 || i.qty <= 0);
  return [
    { label: "BOQ has at least one item", ok: items.length > 0 },
    { label: "Every BOQ item has a quantity and rate", ok: items.length > 0 && unpriced.length === 0, detail: unpriced.length ? `${unpriced.length} item(s) unpriced` : undefined },
    { label: "Overheads and profit applied", ok: t.markup.overheadPct > 0 && t.markup.profitPct > 0 },
    { label: "Client and submission details complete", ok: !!t.client.name && !!t.submissionDate },
  ];
}

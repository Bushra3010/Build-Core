export const CURRENCY = "AED";

const full = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const two = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const num = (n: number) => full.format(Math.round(n));
export const num2 = (n: number) => two.format(n);
export const short = (n: number) => compact.format(n);
export const money = (n: number) => `${CURRENCY} ${num(n)}`;
export const moneyShort = (n: number) => `${CURRENCY} ${short(n)}`;

export const todayISO = () => toISO(new Date());

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export const parseISO = (iso: string) => new Date(`${iso}T00:00:00`);

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  return parseISO(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function daysUntil(iso: string) {
  const ms = parseISO(iso).getTime() - parseISO(todayISO()).getTime();
  return Math.round(ms / 86_400_000);
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const uid = () => Math.random().toString(36).slice(2, 10);

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Tender detail URL. Uses a query string so the site works as a fully static export. */
export const tenderHref = (id: string) => `/tenders/view?id=${encodeURIComponent(id)}`;

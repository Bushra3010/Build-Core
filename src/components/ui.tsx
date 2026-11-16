"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { cn, initials } from "@/lib/format";
import type { TenderStatus } from "@/lib/types";

export function Panel({ className, children, testId }: { className?: string; children: React.ReactNode; testId?: string }) {
  return (
    <section data-testid={testId} className={cn("min-w-0 rounded-[28px] border border-white/[0.06] bg-panel/85 p-5 sm:p-6 backdrop-blur", className)}>
      {children}
    </section>
  );
}

export function PanelTitle({ title, count, children }: { title: string; count?: string | number; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
        {title}
        {count !== undefined && <sup className="ml-1 align-super text-sm font-medium text-muted">{`{${count}}`}</sup>}
      </h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

type Variant = "lime" | "dark" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  lime: "bg-lime text-ink hover:bg-lime-deep font-semibold",
  dark: "bg-panel2 text-white hover:bg-line border border-white/[0.06]",
  ghost: "text-soft hover:bg-white/[0.06]",
  danger: "bg-c-red/15 text-[#ff8a8d] hover:bg-c-red/25 border border-c-red/30",
};

export function Button({
  variant = "dark",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "h-8 px-3.5 text-xs" : "h-10 px-5 text-sm",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function LinkButton({
  href,
  variant = "dark",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm transition", VARIANTS[variant], className)}
    >
      {children}
    </Link>
  );
}

export function IconCircle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-panel2 text-soft", className)}>
      {children}
    </span>
  );
}

export function ArrowLink({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Open"
      className={cn("grid size-9 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25", className)}
    >
      <ArrowUpRight className="size-4" />
    </Link>
  );
}

export const STATUS_META: Record<TenderStatus, { label: string; cls: string; dot: string }> = {
  enquiry: { label: "Enquiry", cls: "bg-c-cyan/15 text-[#5fd3ee] border-c-cyan/30", dot: "bg-c-cyan" },
  estimating: { label: "Estimating", cls: "bg-c-blue/20 text-[#93a8ff] border-c-blue/40", dot: "bg-c-blue" },
  review: { label: "In review", cls: "bg-c-orange/15 text-[#ffa36b] border-c-orange/35", dot: "bg-c-orange" },
  submitted: { label: "Submitted", cls: "bg-c-magenta/15 text-[#e59af5] border-c-magenta/35", dot: "bg-c-magenta" },
  won: { label: "Won", cls: "bg-lime/15 text-lime border-lime/35", dot: "bg-lime" },
  lost: { label: "Lost", cls: "bg-c-red/15 text-[#ff8a8d] border-c-red/35", dot: "bg-c-red" },
  declined: { label: "No-bid", cls: "bg-white/5 text-muted border-white/10", dot: "bg-muted" },
};

export function StatusBadge({ status, className }: { status: TenderStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", m.cls, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-lime/90 px-3 py-1 text-xs font-bold text-ink", className)}>
      {children}
    </span>
  );
}

const AVATAR_BG = ["bg-[#f4c9a8]", "bg-[#b9d7f5]", "bg-[#d8c3f5]", "bg-[#c6efb4]", "bg-[#f6d27a]", "bg-[#f5b5c0]"];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length;
  return (
    <span
      title={name}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border-2 border-black/25 text-[11px] font-bold text-ink",
        AVATAR_BG[idx],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-2xl border border-line bg-ink/70 px-3.5 text-sm text-white placeholder:text-muted/70 outline-none transition focus:border-lime/60 focus:ring-2 focus:ring-lime/15 disabled:opacity-60";

export const cellInputCls =
  "h-9 w-full rounded-xl border border-transparent bg-transparent px-2 text-sm text-white outline-none transition hover:border-line focus:border-lime/60 focus:bg-ink/70 disabled:hover:border-transparent";

/** Number input that keeps the typed text (so "12." or "" don't jump around). */
export function NumInput({
  value,
  onChange,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value ?? 0));
  useEffect(() => {
    if ((parseFloat(text) || 0) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      className={className}
    />
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn("max-h-[88vh] w-full overflow-y-auto rounded-[28px] border border-white/[0.08] bg-panel p-6 shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-panel2 hover:bg-line" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <p className="text-base font-semibold">{title}</p>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="size-10 animate-spin rounded-full border-2 border-line border-t-lime" />
    </div>
  );
}

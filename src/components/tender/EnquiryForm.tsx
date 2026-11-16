"use client";

import { useState } from "react";
import { PEOPLE } from "@/lib/seed";
import { cn, todayISO, isoFromNow } from "@/lib/format";
import type { NewTenderInput, Procurement, Sector } from "@/lib/types";
import { Button, Field, NumInput, inputCls } from "@/components/ui";

export const SECTORS: Sector[] = ["Commercial", "Residential", "Industrial", "Infrastructure", "Healthcare", "Education", "Fit-out"];
export const PROCUREMENTS: Procurement[] = ["Open tender", "Invited", "Negotiated", "Design & build"];

export function blankEnquiry(): NewTenderInput {
  return {
    title: "",
    client: { name: "", contact: "", email: "", phone: "" },
    location: "",
    sector: "Commercial",
    procurement: "Invited",
    receivedDate: todayISO(),
    siteVisitDate: "",
    clarificationDate: "",
    submissionDate: isoFromNow(21),
    clientBudget: 0,
    bidBond: 0,
    estimator: PEOPLE.estimators[0],
    tenderEngineer: PEOPLE.engineers[0],
    director: PEOPLE.directors[0],
    notes: "",
  };
}

export function EnquiryForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  disabled,
}: {
  initial: NewTenderInput;
  submitLabel: string;
  onSubmit: (v: NewTenderInput) => void;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  const [v, setV] = useState<NewTenderInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof NewTenderInput>(k: K, val: NewTenderInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const setClient = (k: keyof NewTenderInput["client"], val: string) => setV((p) => ({ ...p, client: { ...p.client, [k]: val } }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!v.title.trim()) err.title = "Enter the tender title";
    if (!v.client.name.trim()) err.client = "Enter the client name";
    if (!v.submissionDate) err.submissionDate = "Set the submission deadline";
    else if (v.submissionDate < v.receivedDate) err.submissionDate = "Submission must be after the date received";
    if (v.client.email && !/^\S+@\S+\.\S+$/.test(v.client.email)) err.email = "Enter a valid email";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSubmit({ ...v, title: v.title.trim(), siteVisitDate: v.siteVisitDate || undefined, clarificationDate: v.clarificationDate || undefined });
  }

  const err = (k: string) => errors[k] && <span className="text-xs text-[#ff8a8d]">{errors[k]}</span>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-8" noValidate>
      <fieldset disabled={disabled} className="grid gap-5 md:grid-cols-2">
        <legend className="mb-4 text-sm font-bold uppercase tracking-widest text-lime">Opportunity</legend>
        <Field label="Tender title *" className="md:col-span-2">
          <input className={cn(inputCls, errors.title && "border-c-red")} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Marina Office Tower — Main Works" />
          {err("title")}
        </Field>
        <Field label="Sector">
          <select className={inputCls} value={v.sector} onChange={(e) => set("sector", e.target.value as Sector)}>
            {SECTORS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Procurement route">
          <select className={inputCls} value={v.procurement} onChange={(e) => set("procurement", e.target.value as Procurement)}>
            {PROCUREMENTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Project location">
          <input className={inputCls} value={v.location} onChange={(e) => set("location", e.target.value)} placeholder="City / area" />
        </Field>
        <Field label="Client budget / estimate (AED)" hint="If the client disclosed one">
          <NumInput className={inputCls} value={v.clientBudget ?? 0} onChange={(n) => set("clientBudget", n)} min={0} />
        </Field>
      </fieldset>

      <fieldset disabled={disabled} className="grid gap-5 md:grid-cols-2">
        <legend className="mb-4 text-sm font-bold uppercase tracking-widest text-lime">Client</legend>
        <Field label="Client name *">
          <input className={cn(inputCls, errors.client && "border-c-red")} value={v.client.name} onChange={(e) => setClient("name", e.target.value)} placeholder="Company name" />
          {err("client")}
        </Field>
        <Field label="Contact person">
          <input className={inputCls} value={v.client.contact} onChange={(e) => setClient("contact", e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className={cn(inputCls, errors.email && "border-c-red")} value={v.client.email} onChange={(e) => setClient("email", e.target.value)} />
          {err("email")}
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={v.client.phone} onChange={(e) => setClient("phone", e.target.value)} />
        </Field>
      </fieldset>

      <fieldset disabled={disabled} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <legend className="mb-4 text-sm font-bold uppercase tracking-widest text-lime">Key dates</legend>
        <Field label="Date received">
          <input type="date" className={inputCls} value={v.receivedDate} onChange={(e) => set("receivedDate", e.target.value)} />
        </Field>
        <Field label="Site visit">
          <input type="date" className={inputCls} value={v.siteVisitDate ?? ""} onChange={(e) => set("siteVisitDate", e.target.value)} />
        </Field>
        <Field label="Clarification deadline">
          <input type="date" className={inputCls} value={v.clarificationDate ?? ""} onChange={(e) => set("clarificationDate", e.target.value)} />
        </Field>
        <Field label="Submission deadline *">
          <input type="date" className={cn(inputCls, errors.submissionDate && "border-c-red")} value={v.submissionDate} onChange={(e) => set("submissionDate", e.target.value)} />
          {err("submissionDate")}
        </Field>
        <Field label="Bid bond (AED)">
          <NumInput className={inputCls} value={v.bidBond ?? 0} onChange={(n) => set("bidBond", n)} min={0} />
        </Field>
      </fieldset>

      <fieldset disabled={disabled} className="grid gap-5 md:grid-cols-3">
        <legend className="mb-4 text-sm font-bold uppercase tracking-widest text-lime">Team</legend>
        <Field label="Estimator">
          <select className={inputCls} value={v.estimator} onChange={(e) => set("estimator", e.target.value)}>
            {PEOPLE.estimators.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Tender engineer (reviewer)">
          <select className={inputCls} value={v.tenderEngineer} onChange={(e) => set("tenderEngineer", e.target.value)}>
            {PEOPLE.engineers.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Director (final approval)">
          <select className={inputCls} value={v.director} onChange={(e) => set("director", e.target.value)}>
            {PEOPLE.directors.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Notes / scope summary" className="md:col-span-3">
          <textarea className={cn(inputCls, "h-28 py-3")} value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Scope, documents received, special conditions…" />
        </Field>
      </fieldset>

      {!disabled && (
        <div className="flex flex-wrap justify-end gap-3">
          {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" variant="lime">{submitLabel}</Button>
        </div>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";
import { Check, CheckCircle2, Circle, Send, X, XCircle } from "lucide-react";
import { pricing, readiness } from "@/lib/calc";
import { CURRENCY, cn, fmtDate, num, todayISO } from "@/lib/format";
import type { Tender } from "@/lib/types";
import { Avatar, Button, Panel, PanelTitle, inputCls } from "@/components/ui";

type Update = (mutate: (t: Tender) => void, log?: string, by?: string) => void;

export function ReviewPanel({ t, update, onSubmitBid }: { t: Tender; update: Update; onSubmitBid: () => void }) {
  const checks = readiness(t);
  const [comment, setComment] = useState("");
  const p = pricing(t);
  const prepared = !["enquiry", "estimating", "declined"].includes(t.status);
  const nextIdx = t.approvals.findIndex((a) => a.status !== "approved");
  const allApproved = nextIdx === -1;

  function decide(approve: boolean) {
    const a = t.approvals[nextIdx];
    if (!approve && !comment.trim()) return alert("Add a comment explaining what needs to change.");
    update(
      (x) => {
        const target = x.approvals[nextIdx];
        target.status = approve ? "approved" : "rejected";
        target.comment = comment.trim() || undefined;
        target.date = todayISO();
        if (!approve) x.status = "estimating";
      },
      approve ? `Approved by ${a.role}` : `Returned to estimating by ${a.role}: ${comment.trim()}`,
      a.name,
    );
    setComment("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <Panel className="xl:col-span-5">
        <PanelTitle title="Submission readiness" />
        <ul className="flex flex-col gap-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-3 rounded-2xl bg-panel2/60 px-4 py-3">
              {c.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-lime" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-c-orange" />}
              <span className="text-sm">
                {c.label}
                {c.detail && <span className="block text-xs text-muted">{c.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-3xl bg-panel2/60 p-5">
          <p className="text-sm text-muted">Bid price for approval</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-lime">
            {CURRENCY} {num(t.submittedValue ?? p.bidPrice)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Margin {p.marginPct.toFixed(1)}% · Overheads {t.markup.overheadPct}% · Profit {t.markup.profitPct}%
          </p>
        </div>
      </Panel>

      <Panel className="xl:col-span-7">
        <PanelTitle title="Approval chain" />
        <ol className="relative flex flex-col gap-4">
          <Stage
            name={t.estimator}
            role="Estimator · prepared the bid"
            state={prepared ? "approved" : "pending"}
            note={prepared ? "Sent for review" : "Send the tender for review when the BOQ is priced."}
          />
          {t.approvals.map((a, i) => {
            const active = t.status === "review" && i === nextIdx;
            return (
              <Stage
                key={a.role}
                name={a.name}
                role={a.role}
                state={a.status}
                date={a.date}
                note={a.comment}
                active={active}
              >
                {active && (
                  <div className="mt-3 flex flex-col gap-3">
                    <textarea
                      className={cn(inputCls, "h-20 py-2.5")}
                      placeholder="Comment (required when returning)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="lime" size="sm" onClick={() => decide(true)}>
                        <Check className="size-4" /> Approve as {a.name.split(" ")[0]}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => decide(false)}>
                        <X className="size-4" /> Return for changes
                      </Button>
                    </div>
                    <p className="text-xs text-muted">Demo: you can act for any reviewer. Role-based sign-in will restrict this.</p>
                  </div>
                )}
              </Stage>
            );
          })}
          <Stage
            name="Client"
            role="Bid submission"
            state={t.submittedOn ? "approved" : "pending"}
            date={t.submittedOn}
            note={t.submittedOn ? `Submitted at ${CURRENCY} ${num(t.submittedValue ?? 0)}` : undefined}
          >
            {t.status === "review" && allApproved && (
              <Button variant="lime" className="mt-3" onClick={onSubmitBid}>
                <Send className="size-4" /> Submit bid · {CURRENCY} {num(p.bidPrice)}
              </Button>
            )}
          </Stage>
        </ol>
      </Panel>
    </div>
  );
}

function Stage({
  name,
  role,
  state,
  date,
  note,
  active,
  children,
}: {
  name: string;
  role: string;
  state: "pending" | "approved" | "rejected";
  date?: string;
  note?: string;
  active?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className={cn("flex gap-4 rounded-3xl p-4", active ? "bg-lime/[0.07] ring-1 ring-lime/40" : "bg-panel2/60")}>
      <div className="relative">
        {name === "Client" ? (
          <span className="grid size-8 place-items-center rounded-full bg-panel text-xs font-bold text-soft">
            <Send className="size-3.5" />
          </span>
        ) : (
          <Avatar name={name} />
        )}
        <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-panel">
          {state === "approved" ? <CheckCircle2 className="size-4 text-lime" /> : state === "rejected" ? <XCircle className="size-4 text-c-red" /> : <Circle className="size-3.5 text-muted" />}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">
            {name} <span className="ml-1 text-xs font-medium text-muted">{role}</span>
          </p>
          <span className={cn("text-xs font-semibold", state === "approved" ? "text-lime" : state === "rejected" ? "text-[#ff8a8d]" : "text-muted")}>
            {state === "approved" ? "Approved" : state === "rejected" ? "Returned" : active ? "Awaiting decision" : "Pending"}
            {date ? ` · ${fmtDate(date)}` : ""}
          </span>
        </div>
        {note && <p className="mt-1 text-sm text-soft">{note}</p>}
        {children}
      </div>
    </li>
  );
}

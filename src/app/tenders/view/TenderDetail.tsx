"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Ban, CalendarClock, ClipboardCheck, FolderKanban, Lock, Play, RotateCcw, Send, Trash2, Trophy } from "lucide-react";
import { allItems, pricing, readiness } from "@/lib/calc";
import { CURRENCY, cn, daysUntil, fmtDate, fmtDateTime, num, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Tender } from "@/lib/types";
import { Avatar, Button, Empty, Field, Loading, Modal, Panel, PanelTitle, StatusBadge, inputCls } from "@/components/ui";
import { SECTOR_BG } from "@/components/TenderCard";
import { StepTracker } from "@/components/tender/StepTracker";
import { EnquiryForm } from "@/components/tender/EnquiryForm";
import { BoqEditor } from "@/components/tender/BoqEditor";
import { QuotesPanel } from "@/components/tender/QuotesPanel";
import { PricingPanel } from "@/components/tender/PricingPanel";
import { ReviewPanel } from "@/components/tender/ReviewPanel";
import { OutcomePanel } from "@/components/tender/OutcomePanel";

const TABS = [
  { key: "overview", label: "Enquiry" },
  { key: "boq", label: "BOQ & rates" },
  { key: "quotes", label: "Quotes" },
  { key: "pricing", label: "Pricing" },
  { key: "review", label: "Review & submit" },
  { key: "outcome", label: "Outcome" },
  { key: "activity", label: "Activity" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function defaultTab(t: Tender): Tab {
  switch (t.status) {
    case "enquiry":
      return "overview";
    case "estimating":
      return "boq";
    case "review":
      return "review";
    default:
      return "outcome";
  }
}

export function TenderPage({ id }: { id: string }) {
  const { ready, getTender } = useStore();
  if (!ready) return <Loading />;
  const t = getTender(id);
  if (!t)
    return (
      <Empty title="Tender not found" text="It may have been deleted.">
        <Link href="/tenders" className="text-sm font-semibold text-lime">
          Back to tender register
        </Link>
      </Empty>
    );
  return <TenderView key={t.id} t={t} />;
}

function TenderView({ t }: { t: Tender }) {
  const router = useRouter();
  const { updateTender, deleteTender, createProject } = useStore();
  const [tab, setTab] = useState<Tab>(() => defaultTab(t));
  const [noBid, setNoBid] = useState(false);
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  const update = (mutate: (x: Tender) => void, log?: string, by?: string) => updateTender(t.id, mutate, log, by);
  const editable = t.status === "enquiry" || t.status === "estimating";
  const p = pricing(t);
  const value = t.submittedValue ?? p.bidPrice;
  const d = daysUntil(t.submissionDate);
  const ready = readiness(t).every((c) => c.ok);
  const open = editable || t.status === "review";

  const submitBid = () => {
    if (!confirm(`Submit bid of ${CURRENCY} ${num(p.bidPrice)} to ${t.client.name}? Pricing will be locked.`)) return;
    update((x) => {
      x.status = "submitted";
      x.submittedOn = todayISO();
      x.submittedValue = Math.round(pricing(x).bidPrice);
    }, "Bid submitted to client");
    setTab("outcome");
  };

  const actions = (() => {
    switch (t.status) {
      case "enquiry":
        return (
          <>
            <Button variant="ghost" onClick={() => setNoBid(true)}>
              <Ban className="size-4" /> No-bid
            </Button>
            <Button
              variant="lime"
              onClick={() => {
                update((x) => void (x.status = "estimating"), "Estimation started");
                setTab("boq");
              }}
            >
              <Play className="size-4" /> Start estimation
            </Button>
          </>
        );
      case "estimating":
        return (
          <>
            <Button variant="ghost" onClick={() => setNoBid(true)}>
              <Ban className="size-4" /> No-bid
            </Button>
            <Button
              variant="lime"
              disabled={!ready}
              title={ready ? undefined : "Complete the readiness checks on the Review tab first"}
              onClick={() => {
                update((x) => {
                  x.status = "review";
                  x.approvals = x.approvals.map((a) => ({ role: a.role, name: a.name, status: "pending" }));
                }, "Sent for review");
                setTab("review");
              }}
            >
              <ClipboardCheck className="size-4" /> Send for review
            </Button>
          </>
        );
      case "review": {
        const allApproved = t.approvals.every((a) => a.status === "approved");
        return (
          <>
            <Button
              variant="ghost"
              onClick={() => update((x) => void (x.status = "estimating"), "Recalled to estimating")}
            >
              <RotateCcw className="size-4" /> Recall
            </Button>
            <Button variant="lime" disabled={!allApproved} title={allApproved ? undefined : "Waiting for approvals"} onClick={submitBid}>
              <Send className="size-4" /> Submit bid
            </Button>
          </>
        );
      }
      case "submitted":
        return (
          <Button variant="lime" onClick={() => setTab("outcome")}>
            <Trophy className="size-4" /> Record outcome
          </Button>
        );
      case "won":
        return t.projectCode ? (
          <Button onClick={() => setTab("outcome")}>
            <FolderKanban className="size-4" /> {t.projectCode}
          </Button>
        ) : (
          <Button
            variant="lime"
            onClick={() => {
              createProject(t.id);
              setTab("outcome");
            }}
          >
            <FolderKanban className="size-4" /> Create project
          </Button>
        );
      case "declined":
        return (
          <Button onClick={() => update((x) => void (x.status = "enquiry"), "Re-opened after no-bid")}>
            <RotateCcw className="size-4" /> Re-open
          </Button>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <Link href="/tenders" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeft className="size-4" /> Tender register
        </Link>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className={cn("hidden w-2 shrink-0 rounded-full sm:block", SECTOR_BG[t.sector])} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="font-bold text-soft">{t.code}</span>
                <span>·</span>
                <span>#{t.sector}</span>
                <StatusBadge status={t.status} />
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.title}</h1>
              <p className="mt-1 text-sm text-soft">
                {t.client.name} · {t.location || "Location TBC"} · {t.procurement}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <HeadStat label={t.submittedValue ? "Submitted value" : "Current bid price"} value={value > 0 ? `${CURRENCY} ${num(value)}` : "Not priced"} lime />
          <HeadStat
            label="Submission deadline"
            value={fmtDate(t.submissionDate)}
            sub={open ? (d < 0 ? `${-d} days overdue` : d === 0 ? "Due today" : `${d} days left`) : undefined}
            warn={open && d <= 7}
            icon={<CalendarClock className="size-4" />}
          />
          <HeadStat label="BOQ" value={`${allItems(t).length} items`} sub={`${t.boq.length} sections · ${t.quotes.length} quotes`} />
          <div className="flex items-center gap-3 rounded-3xl border border-white/[0.06] bg-panel/85 p-4">
            <div className="flex -space-x-2">
              <Avatar name={t.estimator} />
              <Avatar name={t.tenderEngineer} />
              <Avatar name={t.director} />
            </div>
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold text-white">{t.estimator}</p>
              <p className="truncate text-muted">+ {t.tenderEngineer}, {t.director}</p>
            </div>
          </div>
        </div>

        <StepTracker status={t.status} hasProject={!!t.projectCode} />
      </div>

      {/* Tabs */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {TABS.map((x) => (
          <button
            key={x.key}
            onClick={() => setTab(x.key)}
            className={cn(
              "h-10 shrink-0 rounded-full px-5 text-sm font-semibold transition",
              tab === x.key ? "bg-lime text-ink" : "border border-white/[0.07] bg-panel/80 text-soft hover:text-white",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      {!editable && ["boq", "quotes", "pricing", "overview"].includes(tab) && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-panel/70 px-4 py-3 text-sm text-soft">
          <Lock className="size-4 text-muted" />
          {t.status === "review"
            ? "Locked while in review. Recall the tender to make changes."
            : "Pricing is locked because this tender has moved past estimation."}
        </div>
      )}

      {tab === "overview" && (
        <Panel>
          <PanelTitle title="Enquiry details">
            {saved && <span className="text-sm font-semibold text-lime">Saved</span>}
          </PanelTitle>
          <EnquiryForm
            initial={{
              title: t.title,
              client: t.client,
              location: t.location,
              sector: t.sector,
              procurement: t.procurement,
              receivedDate: t.receivedDate,
              siteVisitDate: t.siteVisitDate,
              clarificationDate: t.clarificationDate,
              submissionDate: t.submissionDate,
              clientBudget: t.clientBudget,
              bidBond: t.bidBond,
              estimator: t.estimator,
              tenderEngineer: t.tenderEngineer,
              director: t.director,
              notes: t.notes,
            }}
            disabled={!editable}
            submitLabel="Save changes"
            onSubmit={(v) => {
              update((x) => {
                Object.assign(x, v);
                x.approvals = x.approvals.map((a) => ({ ...a, name: a.role === "Director" ? v.director : v.tenderEngineer }));
              }, "Enquiry details updated");
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          />
          {(t.status === "enquiry" || t.status === "declined") && (
            <div className="mt-8 border-t border-white/[0.06] pt-6">
              <Button
                variant="danger"
                onClick={() => {
                  if (!confirm(`Delete ${t.code}? This cannot be undone.`)) return;
                  router.push("/tenders");
                  deleteTender(t.id);
                }}
              >
                <Trash2 className="size-4" /> Delete tender
              </Button>
            </div>
          )}
        </Panel>
      )}
      {tab === "boq" && <BoqEditor t={t} editable={editable} update={update} />}
      {tab === "quotes" && <QuotesPanel t={t} editable={editable} update={update} />}
      {tab === "pricing" && <PricingPanel t={t} editable={editable} update={update} />}
      {tab === "review" && <ReviewPanel t={t} update={update} onSubmitBid={submitBid} />}
      {tab === "outcome" && <OutcomePanel t={t} update={update} />}
      {tab === "activity" && (
        <Panel>
          <PanelTitle title="Activity" count={t.activity.length} />
          <ol className="flex flex-col">
            {[...t.activity].reverse().map((a, i) => (
              <li key={`${a.at}-${i}`} className="flex gap-4 border-l-2 border-line pb-5 pl-5 last:pb-0">
                <span className="-ml-[27px] mt-1 size-3 shrink-0 rounded-full bg-lime ring-4 ring-panel" />
                <div>
                  <p className="text-sm font-semibold">{a.text}</p>
                  <p className="text-xs text-muted">
                    {a.by} · {fmtDateTime(a.at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <Modal open={noBid} title="Decline to bid" onClose={() => setNoBid(false)}>
        <Field label="Reason">
          <textarea className={cn(inputCls, "h-28 py-3")} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Outside capacity, unfavourable terms, timeline too short…" autoFocus />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNoBid(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            onClick={() => {
              update((x) => {
                x.status = "declined";
                x.noBidReason = reason.trim();
              }, `No-bid: ${reason.trim()}`);
              setNoBid(false);
              setTab("outcome");
            }}
          >
            Confirm no-bid
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function HeadStat({ label, value, sub, lime, warn, icon }: { label: string; value: string; sub?: string; lime?: boolean; warn?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={cn("rounded-3xl border p-4", lime ? "border-lime/0 bg-lime text-ink" : "border-white/[0.06] bg-panel/85")}>
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold", lime ? "text-ink/70" : "text-muted")}>
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-extrabold tracking-tight sm:text-2xl">{value}</p>
      {sub && <p className={cn("text-xs font-semibold", warn ? "text-c-orange" : lime ? "text-ink/70" : "text-muted")}>{sub}</p>}
    </div>
  );
}

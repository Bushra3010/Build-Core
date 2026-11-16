import { Check } from "lucide-react";
import { cn } from "@/lib/format";
import type { TenderStatus } from "@/lib/types";

const STEPS = [
  { title: "Tender enquiry", sub: "Register opportunity" },
  { title: "Build BOQ + rates", sub: "Quantities, quotes, markup" },
  { title: "Review and submit", sub: "Approvals, submit bid" },
  { title: "Win → create project", sub: "Handoff to planning" },
];

function stepIndex(status: TenderStatus) {
  switch (status) {
    case "enquiry":
    case "declined":
      return 0;
    case "estimating":
      return 1;
    case "review":
    case "submitted":
      return 2;
    default:
      return 3;
  }
}

export function StepTracker({ status, hasProject }: { status: TenderStatus; hasProject?: boolean }) {
  const current = stepIndex(status);
  const finished = (i: number) => i < current || (i === 3 && (hasProject || status === "lost"));
  return (
    <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STEPS.map((s, i) => {
        const done = finished(i);
        const active = i === current && !done;
        const lostEnd = i === 3 && status === "lost";
        return (
          <li
            key={s.title}
            className={cn(
              "relative flex items-center gap-3 rounded-[22px] border-2 px-4 py-3.5 transition",
              done && !lostEnd && "border-lime/40 bg-lime/10",
              lostEnd && "border-c-red/40 bg-c-red/10",
              active && "border-lime bg-panel shadow-[0_0_24px_rgba(196,242,74,0.18)]",
              !done && !active && "border-white/[0.06] bg-panel/60 opacity-70",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                done && !lostEnd ? "bg-lime text-ink" : lostEnd ? "bg-c-red text-white" : active ? "bg-lime text-ink" : "bg-panel2 text-soft",
              )}
            >
              {done && !lostEnd ? <Check className="size-4" /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{lostEnd ? "Tender lost" : s.title}</span>
              <span className="block truncate text-xs text-muted">{s.sub}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/format";
import type { ModuleInfo } from "@/lib/modules";
import { Panel } from "./ui";

export function ModuleFlow({ m }: { m: ModuleInfo }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {m.steps.map((s, i) => (
        <li key={s} className={cn("relative flex items-center gap-3 rounded-[22px] border-2 bg-panel2/70 px-4 py-4", i === 3 ? "border-lime/50" : "border-white/[0.08]")}>
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold text-ink", m.color)}>{i + 1}</span>
          <span className="text-sm font-bold">{s}</span>
          {i < 3 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-muted lg:block" />}
        </li>
      ))}
    </ol>
  );
}

export function ModuleFacts({ m }: { m: ModuleInfo }) {
  const facts = [
    ["What it does", m.does],
    ["Typical users", m.users],
    ["How it connects", m.connects],
    ["Client value", m.value],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {facts.map(([k, v]) => (
        <Panel key={k} className="relative overflow-hidden pl-7 sm:pl-8">
          <span className={cn("absolute inset-y-0 left-0 w-1.5", m.color)} />
          <p className={cn("text-xs font-bold uppercase tracking-widest", m.text)}>{k}</p>
          <p className="mt-2 text-sm leading-relaxed text-soft">{v}</p>
        </Panel>
      ))}
    </div>
  );
}

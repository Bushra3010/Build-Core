import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";
import { cn } from "@/lib/format";
import { MODULES, moduleBySlug } from "@/lib/modules";
import { ModuleFacts, ModuleFlow } from "@/components/ModuleExplainer";
import { Panel } from "@/components/ui";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = moduleBySlug(slug);
  if (!m) notFound();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/modules" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-white">
        <ArrowLeft className="size-4" /> All modules
      </Link>
      <div>
        <span className={cn("rounded-full px-4 py-1.5 text-sm font-bold text-ink", m.color)}>{m.no}</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{m.name}</h1>
        <p className="mt-2 text-soft">{m.tagline}</p>
      </div>
      {m.live ? (
        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-soft">This module is live.</p>
          <Link href={m.href} className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-sm font-semibold text-ink">
            Open {m.name}
          </Link>
        </Panel>
      ) : (
        <Panel className="flex items-center gap-4 border-c-orange/30 bg-c-orange/10">
          <Construction className="size-6 shrink-0 text-c-orange" />
          <p className="text-sm text-soft">
            <b className="text-white">In development.</b> The flow below is the agreed design. Won tenders already create projects that will appear here.
          </p>
        </Panel>
      )}
      <Panel>
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">How this module works</p>
        <ModuleFlow m={m} />
      </Panel>
      <ModuleFacts m={m} />
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { pricing } from "./calc";
import { todayISO, uid } from "./format";
import { CURRENT_USER, seedRates, seedTenders } from "./seed";
import type { NewTenderInput, Project, RateItem, Tender } from "./types";

const KEY = "buildcore.erp.v2";

interface State {
  tenders: Tender[];
  rates: RateItem[];
  projects: Project[];
  seq: number;
}

interface Api {
  ready: boolean;
  user: typeof CURRENT_USER;
  tenders: Tender[];
  rates: RateItem[];
  projects: Project[];
  getTender: (id: string) => Tender | undefined;
  createTender: (input: NewTenderInput) => string;
  updateTender: (id: string, mutate: (t: Tender) => void, log?: string, by?: string) => void;
  deleteTender: (id: string) => void;
  createProject: (tenderId: string) => string | undefined;
  upsertRate: (rate: RateItem) => void;
  deleteRate: (id: string) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Api | null>(null);

function fresh(): State {
  const { tenders, projects, seq } = seedTenders();
  return { tenders, projects, seq, rates: seedRates() };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let loaded: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) loaded = JSON.parse(raw) as State;
    } catch {
      loaded = null;
    }
    setState(loaded ?? fresh());
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — keep working in memory */
    }
  }, [state]);

  const updateTender = useCallback<Api["updateTender"]>((id, mutate, log, by) => {
    setState((s) => {
      if (!s) return s;
      return {
        ...s,
        tenders: s.tenders.map((t) => {
          if (t.id !== id) return t;
          const next = structuredClone(t);
          mutate(next);
          if (log) next.activity.push({ at: new Date().toISOString(), by: by ?? CURRENT_USER.name, text: log });
          return next;
        }),
      };
    });
  }, []);

  const createTender = useCallback<Api["createTender"]>((input) => {
    const id = uid();
    setState((s) => {
      if (!s) return s;
      const seq = s.seq + 1;
      const t: Tender = {
        ...input,
        id,
        code: `TND-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`,
        status: "enquiry",
        boq: [],
        quotes: [],
        markup: { overheadPct: 8, contingencyPct: 3, profitPct: 10, taxPct: 5 },
        approvals: [
          { role: "Tender Engineer", name: input.tenderEngineer, status: "pending" },
          { role: "Director", name: input.director, status: "pending" },
        ],
        activity: [{ at: new Date().toISOString(), by: CURRENT_USER.name, text: "Tender enquiry registered" }],
      };
      return { ...s, seq, tenders: [t, ...s.tenders] };
    });
    return id;
  }, []);

  const createProject = useCallback<Api["createProject"]>(
    (tenderId) => {
      if (!state) return;
      const t = state.tenders.find((x) => x.id === tenderId);
      if (!t || t.status !== "won" || t.projectCode) return t?.projectCode;
      const last = Math.max(0, ...state.projects.map((p) => Number(p.code.split("-").pop()) || 0));
      const code = `PRJ-${new Date().getFullYear()}-${String(last + 1).padStart(3, "0")}`;
      setState((s) => {
        if (!s) return s;
        const project: Project = {
          code,
          name: t.title,
          tenderId,
          client: t.client.name,
          contractValue: t.submittedValue ?? pricing(t).bidPrice,
          createdOn: todayISO(),
          stage: "Awaiting planning",
        };
        return {
          ...s,
          projects: [project, ...s.projects],
          tenders: s.tenders.map((x) =>
            x.id === tenderId
              ? {
                  ...x,
                  projectCode: code,
                  activity: [
                    ...x.activity,
                    { at: new Date().toISOString(), by: CURRENT_USER.name, text: `Project ${code} created and handed to Budgeting & Scheduling` },
                  ],
                }
              : x,
          ),
        };
      });
      return code;
    },
    [state],
  );

  const api = useMemo<Api>(
    () => ({
      ready: !!state,
      user: CURRENT_USER,
      tenders: state?.tenders ?? [],
      rates: state?.rates ?? [],
      projects: state?.projects ?? [],
      getTender: (id) => state?.tenders.find((t) => t.id === id),
      createTender,
      updateTender,
      deleteTender: (id) => setState((s) => (s ? { ...s, tenders: s.tenders.filter((t) => t.id !== id) } : s)),
      createProject,
      upsertRate: (rate) =>
        setState((s) => {
          if (!s) return s;
          const exists = s.rates.some((r) => r.id === rate.id);
          return { ...s, rates: exists ? s.rates.map((r) => (r.id === rate.id ? rate : r)) : [...s.rates, rate] };
        }),
      deleteRate: (id) => setState((s) => (s ? { ...s, rates: s.rates.filter((r) => r.id !== id) } : s)),
      resetDemo: () => setState(fresh()),
    }),
    [state, createTender, updateTender, createProject],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}

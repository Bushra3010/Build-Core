"use client";

import { useRouter } from "next/navigation";
import { tenderHref } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Loading, Panel } from "@/components/ui";
import { EnquiryForm, blankEnquiry } from "@/components/tender/EnquiryForm";
import { StepTracker } from "@/components/tender/StepTracker";

export default function NewTenderPage() {
  const { ready, createTender } = useStore();
  const router = useRouter();
  if (!ready) return <Loading />;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-muted">Tender & Estimation</p>
        <h1 className="text-4xl font-extrabold tracking-tight">New tender enquiry</h1>
        <p className="mt-2 text-sm text-muted">Register the opportunity. You will build the BOQ and rates in the next step.</p>
      </div>
      <StepTracker status="enquiry" />
      <Panel>
        <EnquiryForm
          initial={blankEnquiry()}
          submitLabel="Register tender"
          onCancel={() => router.push("/tenders")}
          onSubmit={(v) => {
            const id = createTender(v);
            router.push(tenderHref(id));
          }}
        />
      </Panel>
    </div>
  );
}

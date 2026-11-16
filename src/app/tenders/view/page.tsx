"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui";
import { TenderPage } from "./TenderDetail";

function Inner() {
  const id = useSearchParams().get("id") ?? "";
  return <TenderPage id={id} />;
}

export default function TenderViewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Inner />
    </Suspense>
  );
}

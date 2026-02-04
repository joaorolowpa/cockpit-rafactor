import { Suspense } from "react";
import { CompanyHeader } from "./components/CompanyHeader";
import { DocumentsLoader } from "./components/DocumentsLoader";
import { CompanyHeaderSkeleton, CompanyDocumentsSkeleton } from "./components/loading-states";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ selected_tab?: string | string[] }>;
}) {
  const id = (await params).id;
  const selectedTabParam = (await searchParams).selected_tab;
  const selectedTab = Array.isArray(selectedTabParam)
    ? selectedTabParam[0]
    : selectedTabParam;

  return (
    <div className="space-y-4 p-4">
      {/* Header loads first and independently */}
      <Suspense fallback={<CompanyHeaderSkeleton />}>
        <CompanyHeader companyId={id} />
      </Suspense>

      {/* Documents load in parallel but render as soon as ready */}
      <Suspense fallback={<CompanyDocumentsSkeleton />}>
        <DocumentsLoader companyId={id} selectedTab={selectedTab} />
      </Suspense>
    </div>
  );
}

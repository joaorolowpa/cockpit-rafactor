import { Skeleton } from "@/components/ui/skeleton";

export function CompanyHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
    </div>
  );
}

export function CompanyDocumentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-md border">
        <div className="space-y-3 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

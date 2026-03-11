import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function StudentListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
      {/* Avatar */}
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

      {/* Name & badges */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
      </div>

      {/* Guardian info (hidden on mobile) */}
      <div className="hidden md:flex flex-col gap-1 flex-shrink-0">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Chevron */}
      <Skeleton className="h-4 w-4 flex-shrink-0" />
    </div>
  );
}

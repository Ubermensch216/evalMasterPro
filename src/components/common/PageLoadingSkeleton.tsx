"use client";

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Displays a centered loading skeleton while initial store data is fetched.
 */
export default function PageLoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-center items-center py-12">
        <div className="w-full max-w-md space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

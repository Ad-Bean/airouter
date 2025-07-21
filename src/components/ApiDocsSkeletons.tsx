import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <Skeleton className="mb-2 h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full rounded-md" />
            {i % 2 === 0 && (
              <div className="space-y-2 pl-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-[90%] rounded-md" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Skeleton className="h-[120px] w-full rounded-md" />
      </div>
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="mb-6 h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="space-y-4">
        <Skeleton className="mb-4 h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="my-6 grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="mb-4 h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="my-4 h-32 w-full rounded-md" />
      </div>
    </div>
  );
}

export function CodeExamplesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mb-4 flex space-x-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full rounded-md" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function ApiDocsLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-6 w-40 lg:hidden" />
        <Skeleton className="hidden h-10 w-full max-w-md lg:block" />
      </div>

      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white px-4 py-2 lg:hidden dark:border-gray-700 dark:bg-gray-900">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_430px]">
          <div className="hidden lg:block lg:px-4 lg:py-8">
            <SidebarSkeleton />
          </div>

          <main className="min-w-0 px-4 py-8 lg:px-8">
            <ContentSkeleton />
          </main>

          <aside className="hidden px-4 py-8 xl:block">
            <CodeExamplesSkeleton />
          </aside>
        </div>
      </div>
    </div>
  );
}

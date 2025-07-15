import * as React from 'react';
import { cn } from '@/lib/utils';

export const Select = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative w-full', className)} {...props} />
  ),
);
Select.displayName = 'Select';

export function SelectTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white',
        className,
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-2 h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  children,
  onSelect,
  selected,
  className,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  selected?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800',
        selected ? 'bg-gray-100 dark:bg-gray-800' : '',
        className,
      )}
      onClick={onSelect}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
    >
      {children}
    </div>
  );
}

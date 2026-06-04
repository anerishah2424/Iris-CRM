import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 5, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white rounded-lg border border-border">
          <div className="w-10 h-10 rounded-full bg-matrix-paleBlue flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-matrix-paleBlue rounded w-1/3" />
            <div className="h-3 bg-matrix-paleBlue rounded w-1/2" />
          </div>
          <div className="w-16 h-6 bg-matrix-paleBlue rounded-full" />
          <div className="w-12 h-8 bg-matrix-paleBlue rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ cols = 6, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-border bg-matrix-paleBlue/50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-matrix-lightBlue rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('flex gap-4 px-4 py-4 border-b border-border', i % 2 === 1 && 'bg-matrix-paleBlue/30')}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-matrix-paleBlue rounded flex-1" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse space-y-3">
          <div className="h-4 bg-matrix-paleBlue rounded w-2/3" />
          <div className="h-3 bg-matrix-paleBlue rounded w-full" />
          <div className="h-3 bg-matrix-paleBlue rounded w-4/5" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-matrix-paleBlue rounded-full w-16" />
            <div className="h-6 bg-matrix-paleBlue rounded-full w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

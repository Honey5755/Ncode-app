/** Shared shimmering placeholder, used in place of bare "Loading…" text while data fetches. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

/** Full-page loading state (initial auth/session check). */
export function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  );
}

/** Placeholder rows for a data table while its request is in flight. */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 py-3 px-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a stat-tile / card row while summary data loads. */
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="min-h-[120px] sm:min-h-[140px] rounded-xl" />
      ))}
    </div>
  );
}

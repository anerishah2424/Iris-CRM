import { useState } from 'react';
import { useAccountRenewals, useMarkRenewalReminded, useCloseRenewal } from '@/hooks/useRenewals';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate, daysFromNow } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Renewal } from '@/types/renewal';

const BUCKETS = [
  { label: 'Expired', filter: (r: Renewal) => r.days_remaining < 0 },
  { label: 'Due in 30d', filter: (r: Renewal) => r.days_remaining >= 0 && r.days_remaining <= 30 },
  { label: 'Due in 60d', filter: (r: Renewal) => r.days_remaining > 30 && r.days_remaining <= 60 },
  { label: 'Due in 90d', filter: (r: Renewal) => r.days_remaining > 60 && r.days_remaining <= 90 },
];

const reminderStatusColor: Record<string, string> = {
  Pending: 'bg-[#FEF3C7] text-[#92400E]',
  Reminded: 'bg-[#D1FAE5] text-[#065F46]',
  Closed: 'bg-muted/10 text-muted',
};

export function RenewalsTab({ accountId }: { accountId: number }) {
  const [activeBucket, setActiveBucket] = useState(0);
  const { data, isLoading } = useAccountRenewals(accountId);
  const renewals: Renewal[] = Array.isArray(data) ? data : [];

  const filtered = renewals.filter(BUCKETS[activeBucket].filter);

  return (
    <div className="space-y-4">
      {/* Bucket tabs */}
      <div className="flex gap-1 border border-border rounded-xl p-1 w-fit">
        {BUCKETS.map((b, i) => {
          const count = renewals.filter(b.filter).length;
          return (
            <button
              key={b.label}
              onClick={() => setActiveBucket(i)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                activeBucket === i
                  ? 'bg-matrix-blue text-white'
                  : 'text-muted hover:text-body'
              )}
            >
              {b.label}
              {count > 0 && (
                <span className={cn('text-[10px] font-bold rounded-full px-1.5 py-0.5',
                  activeBucket === i ? 'bg-white/20 text-white' : 'bg-matrix-paleBlue text-matrix-blue'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? <LoadingSkeleton rows={3} /> : filtered.length === 0 ? (
        <EmptyState title="No renewals in this bucket" description="No items match this time range." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-matrix-paleBlue/60">
              <tr className="text-[11px] text-muted font-bold uppercase tracking-wide">
                {['Product', 'Type', 'Expiry Date', 'Days Remaining', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <RenewalRow key={r.renewal_id} renewal={r} idx={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RenewalRow({ renewal: r, idx }: { renewal: Renewal; idx: number }) {
  const remind = useMarkRenewalReminded(r.renewal_id);
  const close = useCloseRenewal(r.renewal_id);
  const days = r.days_remaining;

  return (
    <tr className={cn('border-b border-border/50', idx % 2 === 1 && 'bg-matrix-paleBlue/20')}>
      <td className="px-4 py-3 font-semibold text-matrix-navy text-[13px]">{r.product_name}</td>
      <td className="px-4 py-3">
        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-matrix-lightBlue text-matrix-blue">
          {r.renewal_type}
        </span>
      </td>
      <td className={cn('px-4 py-3 text-[13px]', days < 0 ? 'text-health-red font-bold' : days <= 30 ? 'text-health-red font-semibold' : days <= 90 ? 'text-health-amber font-semibold' : 'text-body')}>
        {formatDate(r.expiry_date)}
      </td>
      <td className="px-4 py-3 text-[13px]">
        <span className={days < 0 ? 'text-health-red font-bold' : 'text-body'}>
          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('text-[11px] font-bold uppercase px-2 py-0.5 rounded-full', reminderStatusColor[r.reminder_status])}>
          {r.reminder_status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {r.reminder_status === 'Pending' && (
            <button
              onClick={() => remind.mutate()}
              disabled={remind.isPending}
              className="text-[12px] text-matrix-blue border border-matrix-blue rounded px-2 py-1 hover:bg-matrix-paleBlue"
            >
              Remind
            </button>
          )}
          {r.reminder_status !== 'Closed' && (
            <button
              onClick={() => close.mutate()}
              disabled={close.isPending}
              className="text-[12px] text-muted border border-border rounded px-2 py-1 hover:bg-matrix-paleBlue"
            >
              Close
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

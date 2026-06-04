import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useRenewals, useMarkRenewalReminded, useCloseRenewal } from '@/hooks/useRenewals';
import { HealthRing } from '@/components/common/HealthRing';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { DOMAINS } from '@/config/constants';
import type { Renewal } from '@/types/renewal';

const BUCKETS = [
  { value: '0', label: 'Expired', badgeColor: 'bg-red-500 text-white' },
  { value: '30', label: 'Due in 30 days', badgeColor: 'bg-red-100 text-red-700' },
  { value: '60', label: 'Due in 60 days', badgeColor: 'bg-amber-100 text-amber-700' },
  { value: '90', label: 'Due in 90 days', badgeColor: 'bg-blue-100 text-blue-700' },
];

const reminderBadge: Record<string, string> = {
  Pending: 'bg-[#FEF3C7] text-[#92400E]',
  Reminded: 'bg-[#D1FAE5] text-[#065F46]',
  Closed: 'bg-muted/10 text-muted',
};

export default function Renewals() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const bucket = searchParams.get('bucket') ?? '30';
  const domain = searchParams.get('domain') ?? '';
  const renewal_type = searchParams.get('renewal_type') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const filters = { bucket: bucket as '0' | '30' | '60' | '90', domain: domain || undefined, renewal_type: renewal_type || undefined, page, per_page: 20 };
  const { data, isLoading } = useRenewals(filters);
  const renewals: Renewal[] = (data as { data?: Renewal[] })?.data ?? [];
  const meta = (data as { meta?: { total: number; page: number; per_page: number; pages: number } })?.meta;

  const totalValue = renewals.reduce((sum, r) => sum + 0, 0); // placeholder
  const uniqueAccounts = new Set(renewals.map((r) => r.account_id)).size;

  const setParam = (key: string, value: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <h1 className="page-title">Renewals</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Products Expiring', value: meta?.total ?? 0, color: 'text-health-red' },
          { label: 'Accounts Affected', value: uniqueAccounts, color: 'text-health-amber' },
          { label: 'Estimated Value', value: '—', color: 'text-matrix-blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-[12px] text-muted font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-[32px] font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bucket Tabs */}
      <div className="flex gap-1 border border-border rounded-xl p-1 w-fit">
        {BUCKETS.map((b) => (
          <button
            key={b.value}
            onClick={() => setParam('bucket', b.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              bucket === b.value ? 'bg-matrix-blue text-white' : 'text-muted hover:text-body'
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <select value={domain} onChange={(e) => setParam('domain', e.target.value || undefined)} className="input w-auto text-sm">
          <option value="">All Domains</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={renewal_type} onChange={(e) => setParam('renewal_type', e.target.value || undefined)} className="input w-auto text-sm">
          <option value="">All Types</option>
          {['License', 'AMC', 'Warranty'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} rows={8} />
        ) : renewals.length === 0 ? (
          <EmptyState title="No renewals in this bucket" description="No items match the selected time range." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-matrix-paleBlue/60">
                  <tr className="text-[11px] text-muted font-bold uppercase tracking-wide">
                    {['Account', 'Product', 'Type', 'Expiry Date', 'Days', 'SI Partner', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renewals.map((r, i) => (
                    <RenewalTableRow key={r.renewal_id} renewal={r} idx={i} onViewAccount={() => navigate(`/accounts/${r.account_id}`)} />
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <Pagination
                page={meta.page}
                totalPages={meta.pages}
                total={meta.total}
                perPage={meta.per_page}
                onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; })}
                className="px-4 border-t border-border"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RenewalTableRow({ renewal: r, idx, onViewAccount }: { renewal: Renewal; idx: number; onViewAccount: () => void }) {
  const remind = useMarkRenewalReminded(r.renewal_id);
  const close = useCloseRenewal(r.renewal_id);
  const days = r.days_remaining;

  return (
    <tr className={cn('border-b border-border/50', idx % 2 === 1 && 'bg-matrix-paleBlue/20')}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {r.health_score != null && <HealthRing score={r.health_score} size={32} />}
          <div>
            <div className="font-semibold text-matrix-navy text-[13px]">{r.account_name}</div>
            {r.account_city && <div className="text-[11px] text-muted">{r.account_city}</div>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-body text-[13px]">{r.product_name}</td>
      <td className="px-4 py-3">
        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-matrix-lightBlue text-matrix-blue">{r.renewal_type}</span>
      </td>
      <td className={cn('px-4 py-3 text-[13px]', days < 0 ? 'text-health-red font-bold' : days <= 30 ? 'text-health-red font-semibold' : days <= 90 ? 'text-health-amber font-semibold' : 'text-body')}>
        {formatDate(r.expiry_date)}
      </td>
      <td className="px-4 py-3 text-[13px]">
        <span className={days < 0 ? 'text-health-red font-bold' : 'text-body'}>
          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
        </span>
      </td>
      <td className="px-4 py-3 text-[13px] text-muted">{r.si_name ?? '—'}</td>
      <td className="px-4 py-3">
        <span className={cn('text-[11px] font-bold uppercase px-2 py-0.5 rounded-full', reminderBadge[r.reminder_status])}>
          {r.reminder_status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {r.reminder_status === 'Pending' && (
            <button onClick={() => remind.mutate()} disabled={remind.isPending} className="text-[12px] text-matrix-blue border border-matrix-blue rounded px-2 py-1 hover:bg-matrix-paleBlue">Remind</button>
          )}
          <button onClick={onViewAccount} className="text-[12px] text-muted border border-border rounded px-2 py-1 hover:bg-matrix-paleBlue">View →</button>
        </div>
      </td>
    </tr>
  );
}

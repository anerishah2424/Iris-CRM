import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Download, Building2, X, Trash2, Edit2 } from 'lucide-react';
import { useAccounts, useDeleteAccount } from '@/hooks/useAccounts';
import { useAuthStore } from '@/store/authStore';
import { useZones } from '@/hooks/useAdmin';
import { HealthRing } from '@/components/common/HealthRing';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ProductChip } from '@/components/common/ProductChip';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { AddAccountWizard } from '@/components/accounts/AddAccountWizard';
import { formatDate, expiryColor, debounce } from '@/lib/utils';
import { INDIAN_STATES, INDUSTRIES } from '@/config/constants';
import type { Account } from '@/types/account';

const HEALTH_STATUS_OPTIONS = ['Healthy', 'At-Risk', 'Critical'];

function exportCSV(accounts: Account[]) {
  const headers = ['Account Name', 'Industry', 'City', 'State', 'Health Score', 'Status', 'Open Tickets', 'Nearest Expiry', 'SI Partner'];
  const rows = accounts.map((a) => [
    a.account_name, a.industry, a.city, a.state,
    a.health_score, a.health_status, a.open_tickets_count,
    a.nearest_expiry ?? '', a.si_name ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'accounts.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Accounts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuthStore();
  const { data: zones } = useZones();
  const deleteAccount = useDeleteAccount();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const filters = {
    search: searchParams.get('search') ?? undefined,
    health_status: searchParams.get('health_status') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    zone_id: searchParams.get('zone_id') ? Number(searchParams.get('zone_id')) : undefined,
    state: searchParams.get('state') ?? undefined,
    account_type: searchParams.get('account_type') ?? undefined,
    page: Number(searchParams.get('page') ?? 1),
    per_page: 20,
    sort_by: searchParams.get('sort_by') ?? undefined,
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') ?? undefined,
  };

  const { data, isLoading, isError, refetch } = useAccounts(filters);
  const accounts: Account[] = (data as { data?: Account[] })?.data ?? [];
  const meta = (data as { meta?: { total: number; page: number; per_page: number; pages: number } })?.meta;

  const setParam = (key: string, value: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    });
  };

  const debouncedSearch = useCallback(
    debounce((val: unknown) => setParam('search', (val as string) || undefined), 300),
    []
  );

  useEffect(() => { debouncedSearch(searchInput); }, [searchInput]);

  const clearFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete account "${name}"? This action cannot be undone.`)) {
      await deleteAccount.mutateAsync(id);
    }
  };

  const hasFilters = Array.from(searchParams.keys()).some((k) => k !== 'page');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Accounts</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(accounts)}
            className="btn-ghost text-sm"
            disabled={accounts.length === 0}
          >
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setWizardOpen(true)} className="btn-primary">
            <Plus size={15} /> Add Account
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
          <select
            value={filters.health_status ?? ''}
            onChange={(e) => setParam('health_status', e.target.value || undefined)}
            className="input w-auto text-sm"
          >
            <option value="">All Statuses</option>
            {HEALTH_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.industry ?? ''}
            onChange={(e) => setParam('industry', e.target.value || undefined)}
            className="input w-auto text-sm"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          {role === 'matrix_manager' && (
            <select
              value={filters.zone_id ?? ''}
              onChange={(e) => setParam('zone_id', e.target.value || undefined)}
              className="input w-auto text-sm"
            >
              <option value="">All Zones</option>
              {(zones as { zone_id: number; zone_name: string }[] ?? []).map((z) => (
                <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
              ))}
            </select>
          )}
          <select
            value={filters.state ?? ''}
            onChange={(e) => setParam('state', e.target.value || undefined)}
            className="input w-auto text-sm"
          >
            <option value="">All States</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-sm text-health-red border-health-red/30 hover:bg-red-50">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} rows={10} />
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-health-red mb-3">Failed to load accounts</p>
            <button onClick={() => refetch()} className="btn-primary">Retry</button>
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={<Building2 size={40} />}
            title={hasFilters ? 'No accounts match your filters' : 'No accounts in your zone yet'}
            description={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first account to get started.'}
            action={
              hasFilters
                ? <button onClick={clearFilters} className="btn-ghost">Clear Filters</button>
                : <button onClick={() => setWizardOpen(true)} className="btn-primary"><Plus size={14} />Add Account</button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-matrix-paleBlue/60 sticky top-0">
                  <tr className="text-[11px] text-muted font-bold uppercase tracking-wide">
                    {['Account', 'Industry', 'Zone/State', 'Health', 'Status', 'VAD Company', 'Sales Manager', 'SI Partner', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, i) => {
                    const borderColor =
                      acc.health_status === 'Critical' ? 'border-l-health-red'
                        : acc.health_status === 'At-Risk' ? 'border-l-health-amber'
                          : 'border-l-health-green';
                    return (
                      <motion.tr
                        key={acc.account_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => navigate(`/accounts/${acc.account_id}`)}
                        className={`cursor-pointer border-l-4 ${borderColor} border-b border-border/50 hover:bg-matrix-paleBlue/40 transition-colors ${i % 2 === 1 ? 'bg-matrix-paleBlue/20' : 'bg-white'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-matrix-navy text-[13px]">{acc.account_name}</div>
                          <div className="text-[11px] text-muted">{acc.city}, {acc.state}</div>
                        </td>
                        <td className="px-4 py-3 text-body">
                          <div className="text-[13px]">{acc.industry}</div>
                          {acc.sub_industry && <div className="text-[11px] text-muted">{acc.sub_industry}</div>}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-body">{acc.zone_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <HealthRing score={acc.health_score} size={42} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={acc.health_status} />
                        </td>
                        <td className="px-4 py-3 text-[13px] text-body">{acc.vad_company ?? '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-body">{acc.sales_manager ?? '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-muted">{acc.si_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${acc.account_id}`); }}
                              className="text-matrix-blue text-[12px] font-medium hover:underline whitespace-nowrap"
                            >
                              View →
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(acc.account_id, acc.account_name); }}
                              disabled={deleteAccount.isPending}
                              className="p-1 text-muted hover:text-health-red transition-colors disabled:opacity-30"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
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

      <AddAccountWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}

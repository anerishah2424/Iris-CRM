import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, X, Link2, RefreshCcw } from 'lucide-react';
import { useTickets, useCreateTicket, useSyncTickets } from '@/hooks/useTickets';
import { useAccounts } from '@/hooks/useAccounts';
import { SourceBadge } from '@/components/common/SourceBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate, formatDateTime, debounce } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TICKET_CATEGORIES } from '@/config/constants';
import type { Ticket } from '@/types/ticket';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const PRIORITY_BORDER: Record<string, string> = {
  Critical: 'border-l-health-red',
  High: 'border-l-health-amber',
  Medium: 'border-l-matrix-blue',
  Low: 'border-l-border',
};

export default function Tickets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const syncTickets = useSyncTickets();

  const filters = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    page: Number(searchParams.get('page') ?? 1),
    per_page: 20,
  };

  const { data, isLoading, isError, refetch } = useTickets(filters);
  const tickets: Ticket[] = (data as { data?: Ticket[] })?.data ?? [];
  const meta = (data as { meta?: { total: number; page: number; per_page: number; pages: number } })?.meta;
  const lastSync = (data as { last_sync?: string })?.last_sync;
  const hasApiTickets = tickets.some((t) => t.source === 'api');

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

  const clearFilters = () => { setSearchParams({}); setSearchInput(''); };
  const hasFilters = Array.from(searchParams.keys()).some((k) => k !== 'page');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Tickets</h1>
        <button onClick={() => setCreateModalOpen(true)} className="btn-primary">
          <Plus size={15} /> Create Ticket
        </button>
      </div>

      {/* Sync Banner */}
      {hasApiTickets && (
        <div className="flex items-center gap-3 p-3 px-4 rounded-xl bg-[#F3E8FF] border-l-4 border-[#8B5CF6]">
          <Link2 size={15} className="text-[#8B5CF6] flex-shrink-0" />
          <span className="text-sm text-[#4C1D95] flex-1">
            Tickets synced from external API{lastSync ? ` · Last sync: ${formatDateTime(lastSync)}` : ''}
          </span>
          <button
            onClick={() => syncTickets.mutate()}
            disabled={syncTickets.isPending}
            className="text-[12px] font-semibold text-[#7C3AED] border border-[#8B5CF6] rounded-lg px-3 py-1 hover:bg-[#EDE9FE] transition-colors"
          >
            {syncTickets.isPending ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search title / reference…"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); debouncedSearch(e.target.value); }}
              className="input pl-9 text-sm"
            />
          </div>
          <select value={filters.status ?? ''} onChange={(e) => setParam('status', e.target.value || undefined)} className="input w-auto text-sm">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority ?? ''} onChange={(e) => setParam('priority', e.target.value || undefined)} className="input w-auto text-sm">
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.category ?? ''} onChange={(e) => setParam('category', e.target.value || undefined)} className="input w-auto text-sm">
            <option value="">All Categories</option>
            {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-sm text-health-red border-health-red/30 hover:bg-red-50">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : isError ? (
        <div className="card text-center py-10">
          <p className="text-health-red mb-3">Failed to load tickets</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No tickets match your filters' : 'No tickets yet'}
          description={hasFilters ? 'Try adjusting your filters.' : 'Create a ticket to get started.'}
          action={hasFilters
            ? <button onClick={clearFilters} className="btn-ghost">Clear Filters</button>
            : <button onClick={() => setCreateModalOpen(true)} className="btn-primary"><Plus size={14} />Create Ticket</button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {tickets.map((ticket, i) => (
              <motion.div
                key={ticket.ticket_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn('card border-l-4 p-4', PRIORITY_BORDER[ticket.priority] ?? 'border-l-border')}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SourceBadge source={ticket.source} />
                    <PriorityBadge priority={ticket.priority} />
                    {ticket.sla_breach && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white uppercase">
                        SLA BREACH
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-muted">
                    {ticket.reference_number && <span className="font-mono">#{ticket.reference_number}</span>}
                    <span>{formatDate(ticket.raised_on)}</span>
                  </div>
                </div>
                <h3 className="font-bold text-matrix-navy text-[15px] mt-2">{ticket.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-[12px] text-muted flex-wrap">
                  {ticket.account_name && (
                    <button
                      onClick={() => navigate(`/accounts/${ticket.account_id}`)}
                      className="text-matrix-blue hover:underline"
                    >
                      {ticket.account_name}
                    </button>
                  )}
                  {ticket.category && <span>{ticket.category}</span>}
                  {ticket.assigned_to && <span>Assigned: {ticket.assigned_to}</span>}
                </div>
                {ticket.description && (
                  <p className="text-[13px] text-body mt-2 line-clamp-2">{ticket.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className={cn(
                    'text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full',
                    ticket.status === 'Open' ? 'bg-red-50 text-health-red'
                      : ticket.status === 'In Progress' ? 'bg-amber-50 text-health-amber'
                        : ticket.status === 'Resolved' ? 'bg-green-50 text-health-green'
                          : 'bg-muted/10 text-muted'
                  )}>
                    {ticket.status}
                  </span>
                  <button
                    onClick={() => navigate(`/accounts/${ticket.account_id}`)}
                    className="text-[12px] text-matrix-blue font-medium hover:underline flex items-center gap-1"
                  >
                    View Account →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.pages}
              total={meta.total}
              perPage={meta.per_page}
              onPageChange={(p) => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; })}
            />
          )}
        </>
      )}
    </div>
  );
}

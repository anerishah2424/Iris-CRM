import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useAccountTickets, useUpdateTicketStatus } from '@/hooks/useTickets';
import { SourceBadge } from '@/components/common/SourceBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TicketModal } from './TicketModal';
import type { Ticket } from '@/types/ticket';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITY_BORDER: Record<string, string> = {
  Critical: 'border-l-health-red',
  High: 'border-l-health-amber',
  Medium: 'border-l-matrix-blue',
  Low: 'border-l-border',
};

export function TicketsTab({ accountId }: { accountId: number }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useAccountTickets(accountId);
  const tickets: Ticket[] = Array.isArray(data) ? data : [];

  const filtered = tickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="">All Priorities</option>
            {['Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={14} /> Create Ticket</button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="No tickets"
          description="No tickets match the current filters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <TicketCard key={ticket.ticket_id} ticket={ticket} />
          ))}
        </div>
      )}
      <TicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        accountId={accountId}
      />
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const updateStatus = useUpdateTicketStatus(ticket.ticket_id, ticket.account_id);
  const borderColor = PRIORITY_BORDER[ticket.priority] ?? 'border-l-border';

  return (
    <div className={cn('card border-l-4 p-4', borderColor)}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <SourceBadge source={ticket.source} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.sla_breach && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-red-500 text-white">
              SLA BREACH
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted">
          {ticket.reference_number && <span className="font-mono">#{ticket.reference_number}</span>}
          <span>{formatDate(ticket.raised_on)}</span>
        </div>
      </div>
      <h3 className="font-bold text-matrix-navy text-[15px] mt-2">{ticket.title}</h3>
      <div className="flex items-center gap-3 mt-1 text-[12px] text-muted flex-wrap">
        {ticket.category && <span>{ticket.category}</span>}
        {ticket.assigned_to && <span>Assigned: {ticket.assigned_to}</span>}
      </div>
      {ticket.description && (
        <p className="text-[13px] text-body mt-2 line-clamp-2">{ticket.description}</p>
      )}
      <div className="flex items-center justify-end mt-3">
        <select
          value={ticket.status}
          onChange={(e) => updateStatus.mutate(e.target.value)}
          className="input w-auto text-sm"
          disabled={updateStatus.isPending}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

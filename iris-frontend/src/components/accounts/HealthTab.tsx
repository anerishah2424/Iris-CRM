import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { RefreshCcw, AlertTriangle, Ticket, ShieldCheck, History, ArrowRight } from 'lucide-react';
import { useAccountHealth, useAccountHealthHistory, useRecalculateHealth } from '@/hooks/useHealth';
import { HealthRing } from '@/components/common/HealthRing';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { getHealthColor } from '@/lib/healthUtils';
import { formatDate, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AccountHealth, HealthHistoryEntry } from '@/types/health';

export function HealthTab({ accountId }: { accountId: number }) {
  const { data: health, isLoading } = useAccountHealth(accountId);
  const { data: history } = useAccountHealthHistory(accountId);
  const recalc = useRecalculateHealth(accountId);

  const h = health as AccountHealth | undefined;
  const hist: HealthHistoryEntry[] = Array.isArray(history) ? history : [];

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-40 bg-matrix-paleBlue rounded-xl" /><div className="h-60 bg-matrix-paleBlue rounded-xl" /></div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Score Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <h2 className="card-title">Health Score</h2>
          <button
            onClick={() => recalc.mutate()}
            disabled={recalc.isPending}
            className="btn-ghost text-sm"
          >
            <RefreshCcw size={13} className={recalc.isPending ? 'animate-spin' : ''} />
            {recalc.isPending ? 'Recalculating…' : 'Recalculate Now'}
          </button>
        </div>

        <div className="flex items-center gap-6 mb-6">
          {h && <HealthRing score={h.health_score} size={80} showLabel />}
          {h && <StatusBadge status={h.health_status} />}
          {h?.recalculated_at && (
            <span className="text-[12px] text-muted ml-auto">
              Last calculated: {formatDateTime(h.recalculated_at)}
            </span>
          )}
        </div>

        {/* Summary Cards */}
        {h?.breakdown && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-matrix-paleBlue/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-matrix-blue" />
                <span className="text-[11px] font-bold text-muted uppercase">Base Score</span>
              </div>
              <span className="text-2xl font-bold text-matrix-navy">{h.breakdown.base_score}</span>
            </div>
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <Ticket size={16} className="text-health-red" />
                <span className="text-[11px] font-bold text-muted uppercase">Open Tickets</span>
              </div>
              <span className="text-2xl font-bold text-health-red">{h.breakdown.ticket_count}</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-health-amber" />
                <span className="text-[11px] font-bold text-muted uppercase">License Penalty</span>
              </div>
              <span className="text-2xl font-bold text-health-amber">−{h.breakdown.license_expiry_deduction}</span>
            </div>
          </div>
        )}

        {/* Breakdown Table */}
        {h?.breakdown && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-matrix-paleBlue/40 font-semibold text-[13px] text-matrix-navy border-b border-border">
              <span>Component</span>
              <span>Points</span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/50 text-sm">
              <span className="text-body">Base Score</span>
              <span className="font-bold text-green-600">+{h.breakdown.base_score}</span>
            </div>
            {h.breakdown.deductions.map((d, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between border-b border-border/50 text-sm">
                <span className="text-body">— {d.reason}</span>
                <span className="font-semibold text-health-red">{d.points}</span>
              </div>
            ))}
            {h.breakdown.deductions.length === 0 && (
              <div className="px-4 py-4 text-center text-sm text-muted">
                No deductions — account is in great health! ✅
              </div>
            )}
            <div className="px-4 py-3 flex items-center justify-between bg-matrix-paleBlue/40 text-[15px]">
              <span className="font-bold text-matrix-navy">Final Score</span>
              <span className="font-bold" style={{ color: getHealthColor(h.health_score) }}>
                {h.health_score}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
        {/* History Chart */}
        <div className="card">
          <h2 className="card-title mb-4">Health Score History</h2>
          {hist.length < 2 ? (
            <EmptyState
              title="No history yet"
              description="Recalculate to start tracking health score over time."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hist.map((h) => ({ ...h, date: formatDate(h.calculated_at) })).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF5FD" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #C5D8EF', fontSize: 12 }}
                  formatter={(val: any) => [val, 'Health Score']}
                />
                <Line
                  type="monotone"
                  dataKey="health_score"
                  stroke="#1A6FE8"
                  strokeWidth={2}
                  dot={(props) => {
                    const color = getHealthColor(props.payload.health_score);
                    return <Dot key={props.key} {...props as any} fill={color} stroke={color} r={4} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Change Logs */}
        <div className="card">
          <h2 className="card-title mb-4 flex items-center gap-2">
            <History size={18} className="text-matrix-blue" />
            Change Logs
          </h2>
          <div className="space-y-3 overflow-y-auto max-h-[260px] pr-2">
            {hist.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-matrix-paleBlue/30 transition-colors">
                <div>
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider">{formatDate(entry.calculated_at)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[13px] font-bold text-matrix-navy">{entry.health_score}</span>
                    <StatusBadge status={entry.health_status} className="scale-75 origin-left" />
                  </div>
                </div>
                {i < hist.length - 1 && (
                  <div className="flex flex-col items-end">
                    <div className={cn(
                      "text-[12px] font-bold flex items-center gap-1",
                      entry.health_score > hist[i+1].health_score ? "text-health-green" : entry.health_score < hist[i+1].health_score ? "text-health-red" : "text-muted"
                    )}>
                      {entry.health_score > hist[i+1].health_score ? '+' : ''}{entry.health_score - hist[i+1].health_score}
                    </div>
                    <div className="text-[10px] text-muted">vs previous</div>
                  </div>
                )}
              </div>
            ))}
            {hist.length === 0 && <p className="text-center text-muted text-sm py-10">No logs found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

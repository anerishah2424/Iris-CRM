import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, AlertTriangle, TrendingDown, TicketCheck,
  RefreshCw, Heart, Zap, Sparkles, ArrowRight, RefreshCcw
} from 'lucide-react';
import { useDashboard, useDashboardOpportunities, useDashboardActivity } from '@/hooks/useDashboard';
import { useAccounts } from '@/hooks/useAccounts';
import { KPICard } from '@/components/common/KPICard';
import { HealthRing } from '@/components/common/HealthRing';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Pagination } from '@/components/common/Pagination';
import { formatDate, expiryColor } from '@/lib/utils';
import type { Opportunity } from '@/types/shared';
import type { Account } from '@/types/account';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboard();
  const { data: opportunities, isLoading: oppsLoading, refetch: refetchOpps } = useDashboardOpportunities();
  const { data: activityData, isLoading: activityLoading, refetch: refetchActivity } = useDashboardActivity();
  const { data: accountsData, isLoading: accountsLoading } = useAccounts({
    health_status: 'Critical,At-Risk',
    sort_by: 'health_score',
    sort_order: 'asc',
    per_page: 10,
  });

  const s = stats as Record<string, number> | undefined;
  const accounts: Account[] = (accountsData as { data?: Account[] })?.data ?? [];
  const opps: Opportunity[] = Array.isArray(opportunities) ? opportunities : [];
  const activity: any[] = Array.isArray(activityData) ? activityData : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Dashboard</h1>
        <button
          onClick={() => { refetchStats(); refetchOpps(); }}
          className="btn-ghost text-sm"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {[
          {
            icon: <Building2 />, label: 'Total Accounts',
            value: s?.total_accounts ?? 0, valueColor: 'text-matrix-navy',
            iconBg: 'bg-matrix-paleBlue',
            onClick: () => navigate('/accounts'),
          },
          {
            icon: <AlertTriangle />, label: 'Critical Clients',
            value: s?.critical_accounts ?? 0, valueColor: 'text-health-red',
            iconBg: 'bg-red-50',
            onClick: () => navigate('/accounts?health_status=Critical'),
          },
          {
            icon: <TrendingDown />, label: 'At-Risk Clients',
            value: s?.at_risk_accounts ?? 0, valueColor: 'text-health-amber',
            iconBg: 'bg-amber-50',
            onClick: () => navigate('/accounts?health_status=At-Risk'),
          },
          {
            icon: <TicketCheck />, label: 'Open Tickets',
            value: s?.open_tickets ?? 0, valueColor: 'text-matrix-blue',
            iconBg: 'bg-blue-50',
            onClick: () => navigate('/tickets?status=Open'),
          },
          {
            icon: <RefreshCw />, label: 'Renewals Due 30d',
            value: s?.renewals_due_30_days ?? 0, valueColor: 'text-health-red',
            iconBg: 'bg-red-50',
            onClick: () => navigate('/renewals?bucket=30'),
          },
          {
            icon: <Heart />, label: 'Avg Health Score',
            value: s?.avg_health_score ? Math.round(s.avg_health_score) : 0,
            valueColor: (s?.avg_health_score ?? 0) >= 70 ? 'text-health-green' : (s?.avg_health_score ?? 0) >= 40 ? 'text-health-amber' : 'text-health-red',
            iconBg: 'bg-green-50',
          },
          {
            icon: <Zap />, label: 'Upsell Opportunities',
            value: (s?.critical_accounts ?? 0) + (s?.at_risk_accounts ?? 0), valueColor: 'text-matrix-cyan',
            iconBg: 'bg-cyan-50',
            onClick: () => navigate('/accounts'),
          },
          {
            icon: <Sparkles />, label: 'Release Matches',
            value: s?.releases_pending_review ?? 0, valueColor: 'text-matrix-blue',
            iconBg: 'bg-blue-50',
            onClick: () => navigate('/releases'),
          },
          {
            icon: <Zap />, label: 'Strategic Analysis',
            value: 'PRISM', valueColor: 'text-matrix-blue',
            iconBg: 'bg-matrix-paleBlue',
            onClick: () => navigate('/prism/prioritization'),
          },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={itemVariants}>
            <KPICard {...kpi} loading={statsLoading} />
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column below KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-5">
        {/* Mini Account Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Accounts Needing Attention</h2>
          </div>
          {accountsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-matrix-paleBlue rounded" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">All accounts are healthy 🎉</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[12px] text-muted font-semibold uppercase tracking-wide bg-matrix-paleBlue/60">
                      <th className="text-left px-3 py-2 rounded-l">Account</th>
                      <th className="text-left px-3 py-2">Industry</th>
                      <th className="text-left px-3 py-2">Open Tickets</th>
                      <th className="text-left px-3 py-2">Nearest Expiry</th>
                      <th className="text-left px-3 py-2 rounded-r">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc, i) => (
                      <tr
                        key={acc.account_id}
                        onClick={() => navigate(`/accounts/${acc.account_id}`)}
                        className={`cursor-pointer hover:bg-matrix-paleBlue/50 transition-colors border-b border-border/50 ${i % 2 === 1 ? 'bg-matrix-paleBlue/20' : ''}`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <HealthRing score={acc.health_score} size={32} />
                            <div>
                              <div className="font-semibold text-matrix-navy text-[13px]">{acc.account_name}</div>
                              <div className="text-[11px] text-muted">{acc.city}, {acc.state}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-body text-[13px]">{acc.industry}</td>
                        <td className="px-3 py-2.5">
                          {acc.open_tickets_count > 0 ? (
                            <span className="font-bold text-health-red">{acc.open_tickets_count}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className={`px-3 py-2.5 text-[13px] ${expiryColor(acc.nearest_expiry)}`}>
                          {formatDate(acc.nearest_expiry)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={acc.health_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => navigate('/accounts')}
                  className="text-sm text-matrix-blue hover:underline flex items-center gap-1"
                >
                  View All Accounts <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Intelligence Feed */}
        <div className="card flex flex-col h-[550px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Intelligence Feed</h2>
            <div className="flex items-center gap-1">
               <span className="text-[10px] font-bold text-matrix-blue bg-matrix-paleBlue px-2 py-0.5 rounded-full uppercase tracking-wider">AI Powered</span>
               <button onClick={() => { refetchOpps(); refetchActivity(); }} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                 <RefreshCcw size={14} className="text-muted" />
               </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {/* Priority Alerts */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest border-b border-border pb-2">Critical Alerts</h3>
              {oppsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="animate-pulse h-16 bg-matrix-paleBlue rounded-xl" />)}
                </div>
              ) : opps.length === 0 ? (
                <p className="text-[12px] text-muted italic px-2">No pending alerts</p>
              ) : (
                opps.map((opp, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-matrix-blue/30 hover:bg-matrix-paleBlue/20 transition-all"
                  >
                    <PriorityBadge priority={opp.priority} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-matrix-navy text-[13px] truncate group-hover:text-matrix-blue transition-colors">{opp.account_name}</div>
                      <div className="text-[12px] text-body mt-0.5 leading-snug">{opp.message}</div>
                    </div>
                    <button
                      onClick={() => navigate(`/accounts/${opp.account_id}`)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white shadow-sm border border-border text-matrix-blue transition-all"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest border-b border-border pb-2">Recent Interactions</h3>
              {activityLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-12 bg-matrix-paleBlue rounded-xl" />)}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-[12px] text-muted italic px-2">No recent activity</p>
              ) : (
                activity.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-matrix-paleBlue/20 transition-colors"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${act.type === 'visit' ? 'bg-green-50 text-health-green' : 'bg-blue-50 text-matrix-blue'}`}>
                      {act.type === 'visit' ? <Building2 size={14} /> : <TicketCheck size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-matrix-navy text-[12px] truncate">{act.account_name}</span>
                        <span className="text-[10px] text-muted whitespace-nowrap">{formatDate(act.date)}</span>
                      </div>
                      <div className="text-[11px] font-medium text-body mt-0.5">{act.title}</div>
                      <div className="text-[11px] text-muted mt-0.5 line-clamp-1">{act.subtitle}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

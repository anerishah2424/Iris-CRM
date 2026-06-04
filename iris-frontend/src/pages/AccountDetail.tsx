import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Building2, Phone, Mail, Globe, Edit2, CalendarCheck, Trash2 } from 'lucide-react';
import { useAccount, useDeleteAccount } from '@/hooks/useAccounts';
import { HealthRing } from '@/components/common/HealthRing';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { InstalledProductsTab } from '@/components/accounts/InstalledProductsTab';
import { TicketsTab } from '@/components/accounts/TicketsTab';
import { RenewalsTab } from '@/components/accounts/RenewalsTab';
import { HealthTab } from '@/components/accounts/HealthTab';
import { MarketAnalysisTab } from '@/components/accounts/MarketAnalysisTab';
import { ProposalTab } from '@/components/accounts/ProposalTab';
import { ReleasesTab } from '@/components/accounts/ReleasesTab';
import { VisitLogModal } from '@/components/accounts/VisitLogModal';
import { EditAccountModal } from '@/components/accounts/EditAccountModal';
import { formatDate } from '@/lib/utils';

const TABS = [
  'Overview', 'Installed Products', 'Tickets', 'Renewals',
  'Health Score', 'AI Market Analysis', 'Proposal', 'Release Matches',
];

export default function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const id = Number(accountId);
  const [activeTab, setActiveTab] = useState('Overview');
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: account, isLoading, isError, refetch } = useAccount(id);
  const deleteAccount = useDeleteAccount();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setEditModalOpen(true);
    }
  }, [searchParams]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete account "${account?.account_name}"? This cannot be undone.`)) {
      await deleteAccount.mutateAsync(id);
      navigate('/accounts');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-matrix-paleBlue rounded animate-pulse" />
        <div className="card animate-pulse h-32" />
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="card text-center py-16">
        <p className="text-health-red mb-3">Account not found or failed to load.</p>
        <button onClick={() => refetch()} className="btn-primary mr-2">Retry</button>
        <button onClick={() => navigate('/accounts')} className="btn-ghost">← Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link to="/accounts" className="hover:text-matrix-blue transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Accounts
          </Link>
          <span>/</span>
          <span className="text-body font-medium">{account.account_name}</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setEditModalOpen(true)} className="btn-ghost text-sm border-border bg-white">
             <Edit2 size={13} /> Edit
           </button>
           <button onClick={handleDelete} disabled={deleteAccount.isPending} className="btn-ghost text-sm border-border bg-white text-health-red hover:bg-red-50">
             <Trash2 size={13} /> Delete
           </button>
        </div>
      </div>

      {/* Account Header */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">{account.account_name}</h1>
              <StatusBadge status={account.health_status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 size={13} /> {account.industry}
                {account.sub_industry && ` · ${account.sub_industry}`}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {account.city}, {account.state}
              </span>
              {account.zone_name && <span>Zone: <b className="text-body">{account.zone_name}</b></span>}
            </div>
            <div className="flex items-center gap-4 mt-1 text-[12px] text-muted flex-wrap">
              {account.vad_company && <span>VAD: {account.vad_company}</span>}
              {account.si_name && <span>SI: {account.si_name}</span>}
              {account.sales_manager && <span>SM: {account.sales_manager}</span>}
              {account.last_visit_date && <span>Last visit: {formatDate(account.last_visit_date)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <HealthRing score={account.health_score} size={64} showLabel />
            <button
              onClick={() => setVisitModalOpen(true)}
              className="btn-primary text-sm shadow-lg shadow-matrix-blue/20"
            >
              <CalendarCheck size={14} /> Log Visit
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-matrix-blue text-matrix-blue'
                  : 'border-transparent text-muted hover:text-body'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'Overview' && <OverviewTab account={account} onTabChange={setActiveTab} onEdit={() => setEditModalOpen(true)} />}
          {activeTab === 'Installed Products' && <InstalledProductsTab accountId={id} />}
          {activeTab === 'Tickets' && <TicketsTab accountId={id} />}
          {activeTab === 'Renewals' && <RenewalsTab accountId={id} />}
          {activeTab === 'Health Score' && <HealthTab accountId={id} />}
          {activeTab === 'AI Market Analysis' && <MarketAnalysisTab accountId={id} accountName={account.account_name} />}
          {activeTab === 'Proposal' && <ProposalTab accountId={id} accountName={account.account_name} />}
          {activeTab === 'Release Matches' && <ReleasesTab accountId={id} />}
        </motion.div>
      </AnimatePresence>

      <VisitLogModal open={visitModalOpen} onClose={() => setVisitModalOpen(false)} accountId={id} />
      <EditAccountModal open={editModalOpen} onClose={() => setEditModalOpen(false)} account={account} />
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({
  account,
  onTabChange,
  onEdit,
}: {
  account: any;
  onTabChange: (tab: string) => void;
  onEdit: () => void;
}) {
  const acc = account as {
    account_name: string; contact_name?: string; contact_phone?: string; contact_email?: string;
    website?: string; address?: string; gstin?: string; pan?: string; si_name?: string;
    vad_company?: string; sales_manager?: string; notes?: string; health_score: number;
    health_status: 'Healthy' | 'At-Risk' | 'Critical';
    open_tickets_count: number; nearest_expiry?: string;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-5">
      {/* Left */}
      <div className="space-y-5">
        {/* Account Info */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">Account Information</h2>
            <button onClick={onEdit} className="btn-ghost text-sm"><Edit2 size={13} /> Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Contact', value: acc.contact_name },
              { label: 'Phone', icon: <Phone size={12} />, value: acc.contact_phone },
              { label: 'Email', icon: <Mail size={12} />, value: acc.contact_email },
              { label: 'Website', icon: <Globe size={12} />, value: acc.website },
              { label: 'GSTIN', value: acc.gstin },
              { label: 'PAN', value: acc.pan },
              { label: 'VAD Company', value: acc.vad_company },
              { label: 'SI Partner', value: acc.si_name },
              { label: 'Sales Manager', value: acc.sales_manager },
            ].map(({ label, value, icon }) =>
              value ? (
                <div key={label}>
                  <span className="label">{label}</span>
                  <span className="flex items-center gap-1 text-body">{icon}{value}</span>
                </div>
              ) : null
            )}
            {acc.address && (
              <div className="col-span-2">
                <span className="label">Address</span>
                <p className="text-body">{acc.address}</p>
              </div>
            )}
            {acc.notes && (
              <div className="col-span-2">
                <span className="label">Notes</span>
                <p className="text-body">{acc.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="space-y-5">
        {/* Health card */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title">Health Score</h2>
            <button
              onClick={() => onTabChange('Health Score')}
              className="text-[12px] text-matrix-blue hover:underline"
            >
              View Breakdown →
            </button>
          </div>
          <div className="flex items-center gap-4">
            <HealthRing score={acc.health_score} size={64} showLabel />
            <div className="text-sm text-muted">
              Based on tickets, renewals, hardware age, and visit frequency.
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title">Open Tickets</h2>
            <button onClick={() => onTabChange('Tickets')} className="text-[12px] text-matrix-blue hover:underline">
              View All →
            </button>
          </div>
          <div className="text-[32px] font-bold text-health-red leading-none">{acc.open_tickets_count}</div>
          <p className="text-[12px] text-muted mt-1">open tickets requiring attention</p>
        </div>

        {/* Nearest Renewal */}
        {acc.nearest_expiry && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="card-title">Nearest Renewal</h2>
              <button onClick={() => onTabChange('Renewals')} className="text-[12px] text-matrix-blue hover:underline">
                View All →
              </button>
            </div>
            <div className="text-[20px] font-bold text-health-red">{formatDate(acc.nearest_expiry)}</div>
            <p className="text-[12px] text-muted mt-1">next license / AMC expiry</p>
          </div>
        )}
      </div>
    </div>
  );
}

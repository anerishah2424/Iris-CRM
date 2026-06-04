import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RefreshCcw, Bell, Sparkles } from 'lucide-react';
import { useReleases, useReleaseMatches, useRecomputeReleaseMatches, useUpdateReleaseMatch } from '@/hooks/useReleases';
import { ProductChip } from '@/components/common/ProductChip';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatLakhs } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Release, ReleaseMatch } from '@/types/release';

export default function Releases() {
  const { data, isLoading } = useReleases({});
  const releases: Release[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-5">
      <h1 className="page-title">Product Releases</h1>

      {isLoading ? (
        <CardSkeleton count={4} />
      ) : releases.length === 0 ? (
        <EmptyState icon={<Sparkles size={40} />} title="No releases yet" description="Releases will appear here once added." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {releases.map((release) => (
            <ReleaseCard key={release.release_id} release={release} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReleaseCard({ release }: { release: Release }) {
  const [expanded, setExpanded] = useState(false);
  const recompute = useRecomputeReleaseMatches(release.release_id);
  const { data: matches, isLoading: matchesLoading } = useReleaseMatches(release.release_id);
  const matchList: ReleaseMatch[] = Array.isArray(matches) ? matches : [];

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ProductChip domain={release.domain} label={release.domain} />
          <span className="text-[12px] font-bold font-mono bg-matrix-lightBlue text-matrix-blue px-2 py-0.5 rounded">
            v{release.new_version}
          </span>
        </div>
        <span className="text-[12px] text-muted flex-shrink-0">{formatDate(release.release_date)}</span>
      </div>

      <h3 className="card-title">{release.release_title}</h3>
      {release.description && (
        <p className="text-[13px] text-body line-clamp-2">{release.description}</p>
      )}

      {/* Highlights */}
      {release.highlights?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wide">Highlights</p>
          {release.highlights.slice(0, 3).map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-[13px] text-body">
              <span className="text-matrix-blue mt-0.5 flex-shrink-0">•</span> {h}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-border text-[13px] text-muted">
        <span>Matched: <b className="text-matrix-navy">{release.matched_accounts_count ?? matchList.length}</b></span>
        {release.estimated_opportunity && (
          <span>Est. Opportunity: <b className="text-health-green">{formatLakhs(release.estimated_opportunity)}</b></span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn('btn-ghost text-sm flex items-center gap-1.5', expanded && 'bg-matrix-paleBlue')}
        >
          View Matches
          <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
        <button className="btn-ghost text-sm">
          <Bell size={13} /> Notify All
        </button>
        <button
          onClick={() => recompute.mutate()}
          disabled={recompute.isPending}
          className="btn-ghost text-sm"
        >
          <RefreshCcw size={13} className={recompute.isPending ? 'animate-spin' : ''} />
          Recompute
        </button>
      </div>

      {/* Matches Accordion */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border pt-3">
              {matchesLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-matrix-paleBlue rounded" />)}
                </div>
              ) : matchList.length === 0 ? (
                <p className="text-sm text-muted">No matched accounts.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-muted font-bold uppercase tracking-wide">
                      {['Account', 'Installed', 'Reason', 'Score', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-2 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matchList.map((m) => (
                      <MatchRow key={m.match_id} match={m} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchRow({ match: m }: { match: ReleaseMatch }) {
  const update = useUpdateReleaseMatch(m.match_id);
  return (
    <tr className="border-t border-border/50">
      <td className="px-2 py-2 font-medium text-matrix-navy text-[12px]">{m.account_name ?? `#${m.account_id}`}</td>
      <td className="px-2 py-2 font-mono text-[11px] text-muted">{m.installed_version ?? '—'}</td>
      <td className="px-2 py-2 text-[12px] text-body max-w-[120px] truncate">{m.match_reason ?? '—'}</td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-matrix-paleBlue rounded-full overflow-hidden">
            <div className="h-full bg-matrix-blue rounded-full" style={{ width: `${(m.match_score / 20) * 100}%` }} />
          </div>
          <span className="text-[11px] text-muted">{m.match_score}</span>
        </div>
      </td>
      <td className="px-2 py-2">
        <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full',
          m.reminder_status === 'Reminded' ? 'bg-green-100 text-green-700' : m.reminder_status === 'Closed' ? 'bg-muted/10 text-muted' : 'bg-amber-100 text-amber-700'
        )}>
          {m.reminder_status}
        </span>
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          {m.reminder_status === 'Pending' && (
            <button onClick={() => update.mutate('Reminded')} className="text-[11px] text-matrix-blue hover:underline">Remind</button>
          )}
          {m.reminder_status !== 'Closed' && (
            <button onClick={() => update.mutate('Closed')} className="text-[11px] text-muted hover:underline">Close</button>
          )}
        </div>
      </td>
    </tr>
  );
}

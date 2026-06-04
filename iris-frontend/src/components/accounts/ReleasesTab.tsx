import { useAccountReleaseMatches } from '@/hooks/useReleases';
import { useUpdateReleaseMatch } from '@/hooks/useReleases';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import type { ReleaseMatch } from '@/types/release';

export function ReleasesTab({ accountId }: { accountId: number }) {
  const { data, isLoading } = useAccountReleaseMatches(accountId);
  const matches: ReleaseMatch[] = Array.isArray(data) ? data : [];

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="card-title">Release Matches</h2>
      </div>
      {isLoading ? (
        <TableSkeleton cols={6} rows={4} />
      ) : matches.length === 0 ? (
        <EmptyState title="No release matches" description="No releases matched for this account." className="py-12" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-matrix-paleBlue/60">
              <tr className="text-[11px] text-muted font-bold uppercase tracking-wide">
                {['Release', 'Installed Version', 'Match Reason', 'Score', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <ReleaseMatchRow key={m.match_id} match={m} idx={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReleaseMatchRow({ match: m, idx }: { match: ReleaseMatch; idx: number }) {
  const update = useUpdateReleaseMatch(m.match_id);
  return (
    <tr className={`border-b border-border/50 ${idx % 2 === 1 ? 'bg-matrix-paleBlue/20' : ''}`}>
      <td className="px-4 py-3 font-semibold text-matrix-navy text-[13px]">Release #{m.release_id}</td>
      <td className="px-4 py-3 font-mono text-[12px] text-body">{m.installed_version ?? '—'}</td>
      <td className="px-4 py-3 text-body text-[13px] max-w-[200px] truncate">{m.match_reason ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-matrix-paleBlue rounded-full overflow-hidden max-w-[80px]">
            <div
              className="h-full bg-matrix-blue rounded-full"
              style={{ width: `${(m.match_score / 20) * 100}%` }}
            />
          </div>
          <span className="text-[12px] text-muted">{m.match_score}/20</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
          m.reminder_status === 'Reminded' ? 'bg-[#D1FAE5] text-[#065F46]'
            : m.reminder_status === 'Closed' ? 'bg-muted/10 text-muted'
              : 'bg-[#FEF3C7] text-[#92400E]'
        }`}>
          {m.reminder_status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {m.reminder_status === 'Pending' && (
            <button
              onClick={() => update.mutate('Reminded')}
              className="text-[12px] text-matrix-blue border border-matrix-blue rounded px-2 py-1 hover:bg-matrix-paleBlue"
            >
              Remind
            </button>
          )}
          {m.reminder_status !== 'Closed' && (
            <button
              onClick={() => update.mutate('Closed')}
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

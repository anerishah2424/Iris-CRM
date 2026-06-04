import { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, RefreshCcw } from 'lucide-react';
import { useAdminReleases } from '@/hooks/useAdmin';
import { useCreateRelease, useRecomputeReleaseMatches } from '@/hooks/useReleases';
import { ProductChip } from '@/components/common/ProductChip';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Release } from '@/types/release';

export default function AdminReleases() {
  const [slideOver, setSlideOver] = useState(false);
  const { data, isLoading } = useAdminReleases({});
  const releases: Release[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Releases Management</h1>
        <button onClick={() => setSlideOver(true)} className="btn-primary">
          <Plus size={15} /> Add Release
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={7} rows={6} />
        ) : releases.length === 0 ? (
          <EmptyState title="No releases found" description="Add a new software release to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-matrix-paleBlue/60">
                <tr className="text-[11px] text-muted font-bold uppercase tracking-wide">
                  {['Title', 'Product', 'Version', 'Release Date', 'Domain', 'Active', 'Matched', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {releases.map((r, i) => (
                  <ReleaseAdminRow key={r.release_id} release={r} idx={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over for Add Release */}
      {slideOver && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSlideOver(false)} />
          <div className="w-[480px] bg-white h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="card-title">Add Release</h2>
              <button onClick={() => setSlideOver(false)} className="btn-ghost text-sm">Close</button>
            </div>
            <AddReleaseForm onClose={() => setSlideOver(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ReleaseAdminRow({ release: r, idx }: { release: Release; idx: number }) {
  const recompute = useRecomputeReleaseMatches(r.release_id);
  return (
    <tr className={cn('border-b border-border/50', idx % 2 === 1 && 'bg-matrix-paleBlue/20')}>
      <td className="px-4 py-3 font-semibold text-matrix-navy text-[13px] max-w-[200px] truncate">{r.release_title}</td>
      <td className="px-4 py-3 text-body text-[13px]">{r.product_name}</td>
      <td className="px-4 py-3 font-mono text-[12px] text-matrix-blue">v{r.new_version}</td>
      <td className="px-4 py-3 text-body">{formatDate(r.release_date)}</td>
      <td className="px-4 py-3"><ProductChip domain={r.domain} label={r.domain} /></td>
      <td className="px-4 py-3">
        {r.is_active
          ? <ToggleRight size={20} className="text-health-green" />
          : <ToggleLeft size={20} className="text-muted" />
        }
      </td>
      <td className="px-4 py-3 text-body">{r.matched_accounts_count ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => recompute.mutate()}
            disabled={recompute.isPending}
            className="text-[12px] text-matrix-blue border border-matrix-blue rounded px-2 py-1 hover:bg-matrix-paleBlue flex items-center gap-1"
          >
            <RefreshCcw size={11} className={recompute.isPending ? 'animate-spin' : ''} />
            Recompute
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddReleaseForm({ onClose }: { onClose: () => void }) {
  const createRelease = useCreateRelease();
  const [highlights, setHighlights] = useState(['']);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      product_name: fd.get('product_name'),
      new_version: fd.get('new_version'),
      release_date: fd.get('release_date'),
      release_title: fd.get('release_title'),
      description: fd.get('description'),
      domain: fd.get('domain'),
      highlights: highlights.filter(Boolean),
    };
    await createRelease.mutateAsync(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: 'Product *', name: 'product_name', placeholder: 'SATATYA NVR' },
        { label: 'New Version *', name: 'new_version', placeholder: '3.5.2' },
        { label: 'Release Date *', name: 'release_date', type: 'date' },
        { label: 'Release Title *', name: 'release_title', placeholder: 'SATATYA NVR 3.5.2 — AI Analytics Update' },
      ].map(({ label, name, placeholder, type }) => (
        <div key={name}>
          <label className="label">{label}</label>
          <input name={name} type={type} placeholder={placeholder} className="input" required />
        </div>
      ))}
      <div>
        <label className="label">Domain</label>
        <select name="domain" className="input">
          <option>Video Surveillance</option>
          <option>Access Control</option>
          <option>Time Attendance</option>
          <option>Telecom</option>
          <option>Intrusion</option>
        </select>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={3} className="input resize-none" />
      </div>
      <div>
        <label className="label">Highlights</label>
        {highlights.map((h, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={h}
              onChange={(e) => setHighlights((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
              className="input"
              placeholder={`Highlight ${i + 1}`}
            />
            {highlights.length > 1 && (
              <button type="button" onClick={() => setHighlights((p) => p.filter((_, j) => j !== i))} className="text-health-red px-2">×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setHighlights((p) => [...p, ''])} className="text-[12px] text-matrix-blue hover:underline">
          + Add highlight
        </button>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={createRelease.isPending} className="btn-primary">
          {createRelease.isPending ? 'Saving…' : 'Add Release'}
        </button>
      </div>
    </form>
  );
}

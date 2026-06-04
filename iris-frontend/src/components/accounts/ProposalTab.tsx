import { Sparkles, Copy, Download, RefreshCcw } from 'lucide-react';
import { useLatestAgentRun, useRunAgent } from '@/hooks/useAgent';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { AgentRun, ProposalData } from '@/types/agent';

export function ProposalTab({ accountId, accountName }: { accountId: number; accountName: string }) {
  const { data: run, isLoading } = useLatestAgentRun(accountId, 'proposal');
  const runAgent = useRunAgent(accountId);
  const agentRun = run as AgentRun | null;
  const isRunning = runAgent.isPending || agentRun?.status === 'running';
  const proposal = agentRun?.output_payload?.proposal as ProposalData | undefined;

  const handleGenerate = () => runAgent.mutate({ run_type: 'proposal' });

  const handleCopy = () => {
    if (!proposal) return;
    const text = [
      `IRIS — Product Proposal`,
      `Account: ${accountName}   Date: ${formatDate(new Date().toISOString())}`,
      ``,
      `Executive Summary`,
      proposal.executive_summary,
      ``,
      `Recommended Products`,
      ...proposal.line_items.map((li, i) =>
        `${i + 1}. ${li.product_name}   Qty: ${li.quantity}   Unit: ${formatCurrency(li.unit_price)}   Total: ${formatCurrency(li.total)}`
      ),
      ``,
      `Sub-total: ${formatCurrency(proposal.subtotal)}`,
      `GST: ${formatCurrency(proposal.gst)}`,
      `Total: ${formatCurrency(proposal.total)}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-matrix-paleBlue rounded-xl" />;

  if (!agentRun || !proposal) {
    return (
      <div className="card flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-matrix-paleBlue flex items-center justify-center mb-4">
          <Sparkles size={36} className="text-matrix-blue" />
        </div>
        <h3 className="text-[18px] font-bold text-matrix-navy mb-2">Generate Proposal</h3>
        <p className="text-muted text-sm text-center max-w-sm mb-6">
          Create a polished product proposal for {accountName} based on AI recommendations.
        </p>
        <button onClick={handleGenerate} disabled={isRunning} className="btn-primary">
          {isRunning ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Building…</>
          ) : 'Generate Proposal'}
        </button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-matrix-blue font-medium flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-matrix-blue border-t-transparent rounded-full animate-spin" />
          Building your proposal…
        </p>
        {[1, 2].map((i) => <div key={i} className="card animate-pulse h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">Proposal Preview</h2>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="btn-ghost text-sm"><Copy size={13} /> Copy</button>
          <button className="btn-ghost text-sm"><Download size={13} /> Download PDF</button>
          <button onClick={handleGenerate} disabled={isRunning} className="btn-ghost text-sm">
            <RefreshCcw size={13} /> Edit & Regenerate
          </button>
        </div>
      </div>

      <div className="card border-2 border-border font-mono">
        {/* Header */}
        <div className="border-b border-border pb-4 mb-4">
          <h2 className="text-[18px] font-bold text-matrix-navy">IRIS — Product Proposal</h2>
          <div className="flex justify-between text-sm text-muted mt-1">
            <span>Account: <b className="text-body">{accountName}</b></span>
            <span>Date: {formatDate(new Date().toISOString())}</span>
          </div>
        </div>

        {/* Executive Summary */}
        {proposal.executive_summary && (
          <div className="mb-5">
            <h3 className="text-[13px] font-bold text-matrix-navy uppercase tracking-wide mb-2">Executive Summary</h3>
            <div className="h-px bg-border mb-2" />
            <p className="text-sm text-body leading-relaxed">{proposal.executive_summary}</p>
          </div>
        )}

        {/* Products Table */}
        <div className="mb-5">
          <h3 className="text-[13px] font-bold text-matrix-navy uppercase tracking-wide mb-2">Recommended Products</h3>
          <div className="h-px bg-border mb-2" />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted uppercase">
                <th className="text-left py-1.5">#</th>
                <th className="text-left py-1.5">Product</th>
                <th className="text-right py-1.5">Qty</th>
                <th className="text-right py-1.5">Unit Price</th>
                <th className="text-right py-1.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {proposal.line_items.map((li, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-2 text-muted">{i + 1}</td>
                  <td className="py-2 font-medium text-matrix-navy">{li.product_name}</td>
                  <td className="py-2 text-right">{li.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(li.unit_price)}</td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(li.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={4} className="py-2 text-right text-muted font-medium">Sub-total:</td>
                <td className="py-2 text-right font-bold">{formatCurrency(proposal.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="py-1.5 text-right text-muted font-medium">GST (18%):</td>
                <td className="py-1.5 text-right font-bold">{formatCurrency(proposal.gst)}</td>
              </tr>
              <tr className="bg-matrix-paleBlue/40">
                <td colSpan={4} className="py-2 text-right font-bold text-matrix-navy">Total:</td>
                <td className="py-2 text-right font-bold text-[16px] text-matrix-blue">{formatCurrency(proposal.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Justifications */}
        {proposal.justifications && Object.keys(proposal.justifications).length > 0 && (
          <div>
            <h3 className="text-[13px] font-bold text-matrix-navy uppercase tracking-wide mb-2">Why These Products</h3>
            <div className="h-px bg-border mb-2" />
            <div className="space-y-3">
              {Object.entries(proposal.justifications).map(([product, justification]) => (
                <div key={product}>
                  <p className="text-[13px] font-bold text-matrix-navy">{product}</p>
                  <p className="text-sm text-body mt-0.5">{justification}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

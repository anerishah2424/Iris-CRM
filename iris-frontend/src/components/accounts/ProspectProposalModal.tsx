import { X, Copy, Download, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface ProspectProposalModalProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  selectedProducts: any[];
}

export function ProspectProposalModal({ open, onClose, companyName, selectedProducts }: ProspectProposalModalProps) {
  const subtotal = selectedProducts.reduce((acc, p) => acc + (p.unit_price * p.suggested_quantity), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleCopy = () => {
    const text = [
      `PROPOSAL: ${companyName}`,
      `Date: ${formatDate(new Date().toISOString())}`,
      ``,
      `Products:`,
      ...selectedProducts.map(p => `- ${p.product_name} (Qty: ${p.suggested_quantity}) - ${formatCurrency(p.unit_price * p.suggested_quantity)}`),
      ``,
      `Total: ${formatCurrency(total)}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Proposal text copied');
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border bg-matrix-navy text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-matrix-cyan" />
                <h2 className="text-xl font-bold">AI Generated Proposal</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 font-mono bg-[#fcfcfc]">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="border-b-2 border-matrix-navy pb-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black text-matrix-navy tracking-tighter italic">IRIS PORTAL</h1>
                    <p className="text-[10px] text-muted uppercase font-sans font-bold">Matrix Comsec Sales Management</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-matrix-navy uppercase">Proposal #{Math.floor(Math.random() * 90000) + 10000}</p>
                    <p className="text-[11px] text-muted">{formatDate(new Date().toISOString())}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-[11px] font-bold text-muted uppercase mb-2">Prepared For</h3>
                    <p className="text-lg font-bold text-matrix-navy">{companyName}</p>
                    <p className="text-sm text-body">New Prospect Opportunity</p>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-muted uppercase mb-2">Prepared By</h3>
                    <p className="text-sm font-bold text-matrix-navy">Matrix AI Agent</p>
                    <p className="text-sm text-body">support@matrixcomsec.com</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-muted uppercase mb-3">Proposed Solutions</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-matrix-navy/20">
                        <th className="text-left py-2">Item Description</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Unit</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((p, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-3 pr-4">
                            <p className="font-bold text-matrix-navy">{p.product_name}</p>
                            <p className="text-[11px] text-muted font-sans mt-0.5">{p.reason}</p>
                          </td>
                          <td className="py-3 text-right">{p.suggested_quantity}</td>
                          <td className="py-3 text-right">{formatCurrency(p.unit_price)}</td>
                          <td className="py-3 text-right font-bold">{formatCurrency(p.unit_price * p.suggested_quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="pt-6 text-right text-muted font-bold uppercase text-[11px]">Sub-total</td>
                        <td className="pt-6 text-right font-bold text-matrix-navy">{formatCurrency(subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-1 text-right text-muted font-bold uppercase text-[11px]">GST (18%)</td>
                        <td className="py-1 text-right font-bold text-matrix-navy">{formatCurrency(gst)}</td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan={3} className="pt-2 text-right font-black text-matrix-navy uppercase italic">Total</td>
                        <td className="pt-2 text-right font-black text-matrix-blue">{formatCurrency(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="pt-10 border-t border-border">
                  <h3 className="text-[11px] font-bold text-muted uppercase mb-2">Next Steps</h3>
                  <p className="text-sm text-body italic font-sans">"This proposal is valid for 30 days. Please reach out to our sales engineering team for a technical deep-dive and site survey."</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-gray-50 flex justify-center gap-4">
              <button onClick={handleCopy} className="btn-ghost bg-white border border-border">
                <Copy size={16} /> Copy to Clipboard
              </button>
              <button onClick={() => window.print()} className="btn-primary">
                <Download size={16} /> Download PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

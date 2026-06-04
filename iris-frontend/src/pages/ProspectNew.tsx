import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Download, FileText, Plus, Trash2, ChevronDown, ChevronUp,
  Building2, ClipboardList, AlertCircle, Loader2
} from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRunDocAnalysis } from '@/hooks/useAgent';
import { INDIAN_STATES, INDUSTRIES } from '@/config/constants';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const requirementSchema = z.object({
  category: z.string().min(1, 'Required'),
  description: z.string().min(5, 'Required'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  technical_specs_raw: z.string().optional(),
  quantity_estimate: z.string().optional(),
});

const schema = z.object({
  // ClientInfo
  company_name: z.string().min(1, 'Required'),
  industry: z.string().min(1, 'Required'),
  company_size: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  country: z.string().min(1).default('India'),
  budget_range: z.string().optional(),

  // Requirements (array)
  requirements: z.array(requirementSchema).min(1, 'Add at least one requirement'),
});

type FormData = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'var(--health-red, #EF4444)',
  MEDIUM: 'var(--amber, #F5A623)',
  LOW: 'var(--matrix-blue, #1A6FE8)',
};

const REQ_CATEGORIES = [
  'Video Surveillance', 'Access Control', 'Time & Attendance',
  'Intrusion Detection', 'Networking', 'Power Backup', 'Software', 'Other',
];
const COMPANY_SIZES = ['<50', '50–200', '200–1000', '1000+'];
const BUDGET_RANGES = [
  'Under ₹5L', '₹5L–₹20L', '₹20L–₹1Cr', '₹1Cr–₹5Cr', '₹5Cr+',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProspectNew() {
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<'client' | 'requirements'>('client');
  const runDocAnalysis = useRunDocAnalysis();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      country: 'India',
      requirements: [{ category: '', description: '', priority: 'HIGH', technical_specs_raw: '', quantity_estimate: '' }],
    },
  });

  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({
    control,
    name: 'requirements',
  });


  // Cleanup object URL on unmount
  useEffect(() => {
    return () => { if (docUrl) URL.revokeObjectURL(docUrl); };
  }, [docUrl]);

  const onSubmit = async (data: FormData) => {
    // Build the structured JSON payload
    const payload = {
      client_info: {
        company_name: data.company_name,
        industry: data.industry,
        company_size: data.company_size,
        location: { city: data.city, state: data.state, country: data.country },
        budget_range: data.budget_range || undefined,
      },
      requirements: data.requirements.map((r) => {
        let tech_specs: Record<string, unknown> = {};
        try { tech_specs = r.technical_specs_raw ? JSON.parse(r.technical_specs_raw) : {}; }
        catch { tech_specs = { notes: r.technical_specs_raw }; }
        return {
          category: r.category,
          description: r.description,
          priority: r.priority,
          technical_specs: tech_specs,
          quantity_estimate: r.quantity_estimate ? parseInt(r.quantity_estimate) : undefined,
        };
      }),
    };

    const blob = await runDocAnalysis.mutateAsync(payload as Parameters<typeof runDocAnalysis.mutateAsync>[0]);
    if (blob) {
      if (docUrl) URL.revokeObjectURL(docUrl);
      const url = URL.createObjectURL(blob);
      setDocBlob(blob);
      setDocUrl(url);
      toast.success('Document generated — preview ready!');
    }
  };

  const handleDownload = () => {
    if (!docBlob || !docUrl) return;
    const a = document.createElement('a');
    a.href = docUrl;
    a.download = 'AI_Analysis_Report.docx';
    a.click();
  };

  // Toggle sections
  const toggle = (s: 'client' | 'requirements') =>
    setOpenSection((prev) => (prev === s ? prev : s));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">AI Prospect Analysis</h1>
        <p className="text-sm text-muted">
          Fill in the prospect details and let the AI agent generate a tailored analysis document.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,55%)_minmax(0,45%)] gap-5 items-start">

        {/* ── LEFT: Form ── */}
        <form id="prospect-ai-form" onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">

          {/* SECTION 1: ClientInfo */}
          <SectionCard
            icon={<Building2 size={16} />}
            title="Client Information"
            id="client"
            open={openSection === 'client'}
            onToggle={() => toggle('client')}
          >
            <div>
              <label className="label">Company Name *</label>
              <input {...register('company_name')} className="input" placeholder="ABC Logistics Pvt Ltd" />
              {errors.company_name && <FieldError msg={errors.company_name.message} />}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Industry *</label>
                <select {...register('industry')} className="input">
                  <option value="">Select…</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                {errors.industry && <FieldError msg={errors.industry.message} />}
              </div>
              <div>
                <label className="label">Company Size *</label>
                <select {...register('company_size')} className="input">
                  <option value="">Select…</option>
                  {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.company_size && <FieldError msg={errors.company_size.message} />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">City *</label>
                <input {...register('city')} className="input" placeholder="Pune" />
                {errors.city && <FieldError msg={errors.city.message} />}
              </div>
              <div>
                <label className="label">State *</label>
                <select {...register('state')} className="input">
                  <option value="">Select…</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <FieldError msg={errors.state.message} />}
              </div>
            </div>

            <div>
              <label className="label">Budget Range</label>
              <select {...register('budget_range')} className="input">
                <option value="">Not specified</option>
                {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </SectionCard>

          {/* SECTION 2: Requirements */}
          <SectionCard
            icon={<ClipboardList size={16} />}
            title="Requirements"
            id="requirements"
            open={openSection === 'requirements'}
            onToggle={() => toggle('requirements')}
            badge={reqFields.length}
          >
            {errors.requirements?.root && (
              <FieldError msg={errors.requirements.root.message} />
            )}
            <div className="space-y-4">
              {reqFields.map((field, idx) => (
                <div key={field.id} className="relative border border-border rounded-xl p-4 space-y-3 bg-surface/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-muted uppercase tracking-wide">
                      Requirement #{idx + 1}
                    </span>
                    {reqFields.length > 1 && (
                      <button type="button" onClick={() => removeReq(idx)}
                        className="text-health-red hover:opacity-70 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Category *</label>
                      <select {...register(`requirements.${idx}.category`)} className="input">
                        <option value="">Select…</option>
                        {REQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.requirements?.[idx]?.category && (
                        <FieldError msg={errors.requirements[idx]?.category?.message} />
                      )}
                    </div>
                    <div>
                      <label className="label">Priority *</label>
                      <Controller
                        control={control}
                        name={`requirements.${idx}.priority`}
                        render={({ field }) => (
                          <div className="flex gap-2 mt-1">
                            {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                              <button
                                key={p} type="button"
                                onClick={() => field.onChange(p)}
                                className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border"
                                style={{
                                  background: field.value === p ? PRIORITY_COLORS[p] : 'transparent',
                                  color: field.value === p ? '#fff' : PRIORITY_COLORS[p],
                                  borderColor: PRIORITY_COLORS[p],
                                }}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Description *</label>
                    <textarea
                      {...register(`requirements.${idx}.description`)}
                      rows={2} className="input resize-none"
                      placeholder="Describe the requirement in detail…"
                    />
                    {errors.requirements?.[idx]?.description && (
                      <FieldError msg={errors.requirements[idx]?.description?.message} />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Quantity Estimate</label>
                      <input
                        {...register(`requirements.${idx}.quantity_estimate`)}
                        type="number" min={0} className="input" placeholder="e.g. 10"
                      />
                    </div>
                    <div>
                      <label className="label">Technical Specs (JSON or notes)</label>
                      <input
                        {...register(`requirements.${idx}.technical_specs_raw`)}
                        className="input" placeholder='{"resolution":"4K"} or free text'
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => appendReq({ category: '', description: '', priority: 'MEDIUM', technical_specs_raw: '', quantity_estimate: '' })}
              className="mt-2 flex items-center gap-2 text-[13px] text-matrix-blue hover:opacity-70 transition-opacity font-medium"
            >
              <Plus size={14} /> Add Requirement
            </button>
          </SectionCard>

          {/* Submit */}
          <button
            form="prospect-ai-form"
            type="submit"
            disabled={runDocAnalysis.isPending}
            className="btn-cyan w-full justify-center gap-2"
          >
            {runDocAnalysis.isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Generating with AI…</>
            ) : (
              <><Sparkles size={15} /> Analyze with AI</>
            )}
          </button>
        </form>

        {/* ── RIGHT: Preview Panel ── */}
        <div className="sticky top-5">
          <AnimatePresence mode="wait">
            {runDocAnalysis.isPending && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card flex flex-col items-center justify-center gap-4 py-16 text-center"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-matrix-blue/20 border-t-matrix-blue animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-matrix-blue" />
                </div>
                <div>
                  <p className="font-semibold text-matrix-navy text-sm">AI Agent is Working…</p>
                  <p className="text-[12px] text-muted mt-1">Generating your analysis document</p>
                </div>
              </motion.div>
            )}

            {!runDocAnalysis.isPending && !docUrl && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card flex flex-col items-center justify-center gap-4 py-16 text-center border-dashed"
              >
                <div className="w-14 h-14 rounded-2xl bg-matrix-lightBlue flex items-center justify-center">
                  <FileText size={24} className="text-matrix-blue" />
                </div>
                <div>
                  <p className="font-semibold text-matrix-navy text-sm">No Document Yet</p>
                  <p className="text-[12px] text-muted mt-1 max-w-[220px]">
                    Fill in the form and click "Analyze with AI" to generate your document
                  </p>
                </div>
              </motion.div>
            )}

            {!runDocAnalysis.isPending && docUrl && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-matrix-lightBlue flex items-center justify-center">
                      <FileText size={16} className="text-matrix-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-matrix-navy text-[13px]">Analysis Report</p>
                      <p className="text-[11px] text-muted">AI-generated .docx document</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="btn-primary gap-1.5 text-[13px] py-2 px-3"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>

                {/* Preview notice + iframe */}
                <div className="rounded-xl overflow-hidden border border-border bg-surface">
                  {/* .docx can't be rendered natively — use Office Online viewer */}
                  <DocPreview docUrl={docUrl} docBlob={docBlob!} />
                </div>

                <p className="text-[11px] text-muted text-center">
                  Preview may show limited formatting. Download for the full document.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-health-red mt-1">
      <AlertCircle size={11} /> {msg}
    </p>
  );
}

function SectionCard({
  icon, title, id, open, onToggle, badge, children,
}: {
  icon: React.ReactNode;
  title: string;
  id: string;
  open: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-matrix-blue">{icon}</span>
          <span className="font-semibold text-matrix-navy text-[14px]">{title}</span>
          {badge !== undefined && (
            <span className="text-[11px] font-bold bg-matrix-blue text-white rounded-full w-5 h-5 flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocPreview({ docUrl, docBlob }: { docUrl: string; docBlob: Blob }) {
  // Try to display a preview. For .docx files, browsers can't render natively.
  // Strategy: if blob looks like a text/html we show it in iframe,
  // otherwise show a rich "ready to download" card.
  const [previewMode, setPreviewMode] = useState<'loading' | 'iframe' | 'fallback'>('loading');

  useEffect(() => {
    // Check content type: if it's a PDF we can embed; docx → fallback
    if (docBlob.type === 'application/pdf') {
      setPreviewMode('iframe');
    } else {
      setPreviewMode('fallback');
    }
  }, [docBlob]);

  if (previewMode === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-matrix-blue" />
      </div>
    );
  }

  if (previewMode === 'iframe') {
    return (
      <iframe
        src={docUrl}
        className="w-full"
        style={{ height: '500px', border: 'none' }}
        title="Document Preview"
      />
    );
  }

  // Fallback: .docx ready card
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-matrix-lightBlue flex items-center justify-center">
        <FileText size={28} className="text-matrix-blue" />
      </div>
      <div>
        <p className="font-bold text-matrix-navy text-[15px]">Document Ready</p>
        <p className="text-[12px] text-muted mt-1">
          Your AI-generated analysis is ready as a <strong>.docx</strong> file.
          Click Download to open it in Microsoft Word or compatible applications.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center mt-2">
        <div className="flex items-center gap-1.5 text-[12px] text-health-green">
          <span className="w-2 h-2 rounded-full bg-health-green" /> Generated Successfully
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-muted">
          <span className="w-2 h-2 rounded-full bg-matrix-blue" />
          {(docBlob.size / 1024).toFixed(1)} KB
        </div>
      </div>
    </div>
  );
}

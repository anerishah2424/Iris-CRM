import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useCreateAccount } from '@/hooks/useAccounts';
import { useSIPartners } from '@/hooks/useAccounts';
import { INDIAN_STATES, INDUSTRIES } from '@/config/constants';

const step1Schema = z.object({
  account_name: z.string().min(1, 'Required'),
  industry: z.string().min(1, 'Required'),
  sub_industry: z.string().optional(),
  account_type: z.enum(['existing', 'prospect']),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  pincode: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  website: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  si_id: z.number().optional(),
  notes: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;

interface AddAccountWizardProps {
  open: boolean;
  onClose: () => void;
}

const steps = ['Company Details', 'Installed Products', 'Review & Save'];

export function AddAccountWizard({ open, onClose }: AddAccountWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { data: siPartners } = useSIPartners();
  const createAccount = useCreateAccount();

  const { register, handleSubmit, watch, formState: { errors }, getValues } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { account_type: 'existing' },
  });

  if (!open) return null;

  const onStep1Next = handleSubmit(() => setStep(1));

  const handleSave = async () => {
    const data = getValues();
    try {
      const res = await createAccount.mutateAsync(data);
      const newId = (res.data as { data?: { account_id?: number } })?.data?.account_id;
      onClose();
      setStep(0);
      if (newId) navigate(`/accounts/${newId}`);
    } catch {
      // error toast handled by hook
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] mx-4 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="card-title">Add New Account</h2>
                <p className="text-[12px] text-muted mt-0.5">Step {step + 1} of {steps.length}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                <X size={16} className="text-muted" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-6 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                      i < step ? 'bg-health-green text-white'
                        : i === step ? 'bg-matrix-blue text-white'
                          : 'bg-matrix-paleBlue text-muted'
                    }`}>
                      {i < step ? <Check size={12} /> : i + 1}
                    </div>
                    <span className={`text-[12px] font-medium ${i === step ? 'text-matrix-navy' : 'text-muted'}`}>{s}</span>
                    {i < steps.length - 1 && <div className={`flex-1 h-0.5 ml-2 ${i < step ? 'bg-health-green' : 'bg-border'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {step === 0 && (
                <form id="step1-form" onSubmit={onStep1Next}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Account Name *</label>
                      <input {...register('account_name')} className="input" placeholder="ABC Ltd" />
                      {errors.account_name && <p className="text-[12px] text-health-red mt-1">{errors.account_name.message}</p>}
                    </div>
                    <div>
                      <label className="label">Industry *</label>
                      <select {...register('industry')} className="input">
                        <option value="">Select…</option>
                        {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                      {errors.industry && <p className="text-[12px] text-health-red mt-1">{errors.industry.message}</p>}
                    </div>
                    <div>
                      <label className="label">Sub-industry</label>
                      <input {...register('sub_industry')} className="input" placeholder="e.g. Pharma Mfg" />
                    </div>
                    <div>
                      <label className="label">Account Type</label>
                      <div className="flex gap-3 mt-1">
                        {(['existing', 'prospect'] as const).map((t) => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" {...register('account_type')} value={t} className="accent-matrix-blue" />
                            <span className="text-sm capitalize">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">City *</label>
                      <input {...register('city')} className="input" placeholder="Mumbai" />
                      {errors.city && <p className="text-[12px] text-health-red mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="label">State *</label>
                      <select {...register('state')} className="input">
                        <option value="">Select…</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-[12px] text-health-red mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                      <label className="label">Pincode</label>
                      <input {...register('pincode')} className="input" placeholder="400001" />
                    </div>
                    <div>
                      <label className="label">GSTIN</label>
                      <input {...register('gstin')} className="input" placeholder="27AAAAA0000A1Z5" />
                    </div>
                    <div>
                      <label className="label">PAN</label>
                      <input {...register('pan')} className="input" placeholder="AAAAA0000A" />
                    </div>
                    <div>
                      <label className="label">Website</label>
                      <input {...register('website')} className="input" placeholder="https://..." />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Address</label>
                      <textarea {...register('address')} rows={2} className="input resize-none" placeholder="Full address" />
                    </div>
                    <div className="col-span-2 border-t border-border pt-4">
                      <p className="text-[13px] font-bold text-matrix-navy mb-3">Primary Contact</p>
                    </div>
                    <div>
                      <label className="label">Contact Name</label>
                      <input {...register('contact_name')} className="input" />
                    </div>
                    <div>
                      <label className="label">Contact Phone</label>
                      <input {...register('contact_phone')} className="input" type="tel" />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Contact Email</label>
                      <input {...register('contact_email')} className="input" type="email" />
                      {errors.contact_email && <p className="text-[12px] text-health-red mt-1">{errors.contact_email.message}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="label">SI Partner</label>
                      <select {...register('si_id', { setValueAs: (v) => v ? Number(v) : undefined })} className="input">
                        <option value="">None</option>
                        {(siPartners as { si_id: number; si_name: string }[] ?? []).map((si) => (
                          <option key={si.si_id} value={si.si_id}>{si.si_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Notes</label>
                      <textarea {...register('notes')} rows={2} className="input resize-none" />
                    </div>
                  </div>
                </form>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Product installation can be added after account creation from the Installed Products tab.</p>
                  <div className="bg-matrix-paleBlue rounded-xl p-4 text-sm text-body">
                    💡 You'll be taken directly to the account page where you can add products with full version, expiry, and license details.
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-[14px] font-bold text-matrix-navy">Review Details</h3>
                  {Object.entries(getValues()).map(([k, v]) => {
                    if (!v) return null;
                    return (
                      <div key={k} className="flex gap-3 text-sm border-b border-border/50 pb-2">
                        <span className="text-muted capitalize w-36 flex-shrink-0">{k.replace(/_/g, ' ')}</span>
                        <span className="text-body font-medium">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
                className="btn-ghost"
              >
                <ChevronLeft size={14} />
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              {step < 2 ? (
                <button
                  form={step === 0 ? 'step1-form' : undefined}
                  type={step === 0 ? 'submit' : 'button'}
                  onClick={step === 0 ? undefined : () => setStep(s => s + 1)}
                  className="btn-primary"
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={createAccount.isPending}
                  className="btn-primary"
                >
                  {createAccount.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><Check size={14} /> Save Account</>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

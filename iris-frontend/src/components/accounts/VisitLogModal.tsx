import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLogVisit } from '@/hooks/useAccounts';

const schema = z.object({
  visit_type: z.string().min(1, 'Required'),
  visit_date: z.string().min(1, 'Required'),
  notes: z.string().optional(),
  next_visit_date: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const VISIT_TYPES = ['In-Person', 'Phone Call', 'Video Call', 'Email', 'Demo', 'Training'];

interface VisitLogModalProps {
  open: boolean;
  onClose: () => void;
  accountId: number;
}

export function VisitLogModal({ open, onClose, accountId }: VisitLogModalProps) {
  const logVisit = useLogVisit(accountId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visit_date: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    await logVisit.mutateAsync(data);
    reset();
    onClose();
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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="card-title">Log Visit</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                <X size={16} className="text-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Visit Type *</label>
                <select {...register('visit_type')} className="input">
                  <option value="">Select…</option>
                  {VISIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.visit_type && <p className="text-[12px] text-health-red mt-1">{errors.visit_type.message}</p>}
              </div>
              <div>
                <label className="label">Visit Date *</label>
                <input {...register('visit_date')} type="date" className="input" />
                {errors.visit_date && <p className="text-[12px] text-health-red mt-1">{errors.visit_date.message}</p>}
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Key discussion points…" />
              </div>
              <div>
                <label className="label">Next Visit Date</label>
                <input {...register('next_visit_date')} type="date" className="input" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={logVisit.isPending} className="btn-primary">
                  {logVisit.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                  ) : 'Log Visit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

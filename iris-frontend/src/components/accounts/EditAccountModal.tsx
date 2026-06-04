import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUpdateAccount } from '@/hooks/useAccounts';
import { INDIAN_STATES, INDUSTRIES } from '@/config/constants';
import type { Account } from '@/types/account';

const schema = z.object({
  account_name: z.string().min(1, 'Required'),
  industry: z.string().min(1, 'Required'),
  sub_industry: z.string().optional(),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: Account;
}

export function EditAccountModal({ open, onClose, account }: EditAccountModalProps) {
  const updateAccount = useUpdateAccount(account.account_id);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      account_name: account.account_name,
      industry: account.industry,
      sub_industry: account.sub_industry ?? '',
      city: account.city,
      state: account.state,
      contact_name: account.contact_name ?? '',
      contact_phone: account.contact_phone ?? '',
      contact_email: account.contact_email ?? '',
      notes: account.notes ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await updateAccount.mutateAsync(data);
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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-matrix-navy">Edit Account</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                <X size={18} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="label">Account Name *</label>
                <input {...register('account_name')} className="input" />
                {errors.account_name && <p className="text-[12px] text-health-red mt-1">{errors.account_name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Industry *</label>
                  <select {...register('industry')} className="input">
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Sub-industry</label>
                  <input {...register('sub_industry')} className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City *</label>
                  <input {...register('city')} className="input" />
                </div>
                <div>
                  <label className="label">State *</label>
                  <select {...register('state')} className="input">
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-[13px] font-bold text-matrix-navy mb-3">Primary Contact</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input {...register('contact_name')} className="input" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input {...register('contact_phone')} className="input" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="label">Email</label>
                  <input {...register('contact_email')} className="input" />
                  {errors.contact_email && <p className="text-[12px] text-health-red mt-1">{errors.contact_email.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                <button 
                  type="submit" 
                  disabled={updateAccount.isPending} 
                  className="btn-primary"
                >
                  {updateAccount.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

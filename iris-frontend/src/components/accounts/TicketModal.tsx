import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateTicket } from '@/hooks/useTickets';

const schema = z.object({
  title: z.string().min(5, 'Title too short'),
  description: z.string().min(10, 'Please provide more detail'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  category: z.string().min(1, 'Required'),
  raised_by: z.string().min(1, 'Required'),
  source: z.enum(['Portal', 'Email', 'Phone', 'On-Site']),
});

type FormData = z.infer<typeof schema>;

interface TicketModalProps {
  open: boolean;
  onClose: () => void;
  accountId: number;
}

export function TicketModal({ open, onClose, accountId }: TicketModalProps) {
  const createTicket = useCreateTicket();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'Medium',
      source: 'Portal',
      category: 'Software Bug',
    },
  });

  const onSubmit = async (data: FormData) => {
    await createTicket.mutateAsync({
      ...data,
      account_id: accountId,
    });
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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-matrix-navy">Create New Ticket</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                <X size={18} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Ticket Title *</label>
                <input {...register('title')} placeholder="Brief summary of issue" className="input" />
                {errors.title && <p className="text-[12px] text-health-red mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea {...register('description')} rows={4} className="input resize-none" placeholder="Detailed description of the problem…" />
                {errors.description && <p className="text-[12px] text-health-red mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select {...register('category')} className="input">
                    <option value="Software Bug">Software Bug</option>
                    <option value="Hardware Fault">Hardware Fault</option>
                    <option value="Configuration">Configuration</option>
                    <option value="Inquiry">Inquiry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select {...register('priority')} className="input font-semibold">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Raised By *</label>
                  <input {...register('raised_by')} placeholder="Contact person name" className="input" />
                </div>
                <div>
                  <label className="label">Source</label>
                  <select {...register('source')} className="input">
                    <option value="Portal">Portal</option>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="On-Site">On-Site</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                <button 
                  type="submit" 
                  disabled={createTicket.isPending} 
                  className="btn-primary min-w-[120px]"
                >
                  {createTicket.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Saving…</>
                  ) : 'Create Ticket'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

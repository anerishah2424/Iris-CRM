import { useState } from 'react';
import { Plus, Edit2, Key } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useZones } from '@/hooks/useAdmin';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from '@/types/user';
import api from '@/config/api';
import { toast } from 'sonner';

// ─── Schemas ─────────────────────────────────────────────────────────────────
const createSchema = z.object({
  username: z.string().min(3, 'Min 3 chars'),
  email: z.string().email('Invalid email'),
  full_name: z.string().min(1, 'Required'),
  password: z.string().min(6, 'Min 6 chars'),
  role: z.enum(['matrix_manager', 'Sales_manager']),
  zone_id: z.number().optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  is_active: z.boolean().default(true),
});

const editSchema = z.object({
  full_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['matrix_manager', 'Sales_manager']),
  zone_id: z.number().optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  is_active: z.boolean().default(true),
});

const resetSchema = z.object({
  new_password: z.string().min(6, 'Min 6 chars'),
  confirm_password: z.string().min(6, 'Min 6 chars'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type ZoneOption = { zone_id: number; zone_name: string };

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);

  const { data, isLoading } = useUsers();
  const { data: zonesData } = useZones();
  const users: User[] = Array.isArray(data) ? data : [];
  const zones: ZoneOption[] = Array.isArray(zonesData) ? zonesData : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">User Management</h1>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={15} /> Create User
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton cols={8} rows={8} />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-matrix-paleBlue/60">
                <tr className="text-[11px] text-muted font-bold uppercase tracking-wide">
                  {['Name', 'Email', 'Role', 'Zone', 'Designation', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.user_id} className={cn('border-b border-border/50', i % 2 === 1 && 'bg-matrix-paleBlue/20')}>
                    <td className="px-4 py-3 font-semibold text-matrix-navy">{user.full_name}</td>
                    <td className="px-4 py-3 text-muted">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[11px] font-bold uppercase px-2 py-0.5 rounded-full',
                        user.role === 'matrix_manager' ? 'bg-[#EDE9FE] text-[#4C1D95]' : 'bg-matrix-lightBlue text-matrix-blue'
                      )}>
                        {user.role === 'matrix_manager' ? 'Matrix Mgr' : 'Sales Mgr'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body">{user.zone_name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{user.designation ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[11px] font-bold uppercase px-2 py-0.5 rounded-full',
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-[12px]">{user.last_login ? formatDateTime(user.last_login) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-1.5 hover:text-matrix-blue hover:bg-matrix-paleBlue rounded transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setResetUser(user)}
                          className="p-1.5 hover:text-matrix-cyan hover:bg-matrix-paleBlue rounded transition-colors"
                          title="Reset Password"
                        >
                          <Key size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} zones={zones} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} zones={zones} />
      <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />
    </div>
  );
}

// ─── Modal Base ───────────────────────────────────────────────────────────────
function ModalShell({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="card-title">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                <X size={16} className="text-muted" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ open, onClose, zones }: { open: boolean; onClose: () => void; zones: ZoneOption[] }) {
  const createUser = useCreateUser();
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema) as any,
    defaultValues: { role: 'Sales_manager', is_active: true },
  });
  const role = watch('role');

  const onSubmit = async (data: any) => {
    await createUser.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Create User">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {([
          { label: 'Full Name *', field: 'full_name', placeholder: 'Rajesh Kumar' },
          { label: 'Email *', field: 'email', placeholder: 'rajesh@matrix.com', type: 'email' },
          { label: 'Username *', field: 'username', placeholder: 'rajeshk' },
          { label: 'Password *', field: 'password', placeholder: '••••••••', type: 'password' },
        ]).map(({ label, field, placeholder, type }) => (
          <div key={field}>
            <label className="label">{label}</label>
            <input {...register(field as keyof CreateFormData)} type={type} placeholder={placeholder} className="input" />
            {errors[field as keyof CreateFormData] && (
              <p className="text-[12px] text-health-red mt-1">{errors[field as keyof CreateFormData]?.message as string}</p>
            )}
          </div>
        ))}
        <div>
          <label className="label">Role *</label>
          <select {...register('role')} className="input">
            <option value="Sales_manager">Sales Manager</option>
            <option value="matrix_manager">Matrix Manager</option>
          </select>
        </div>
        {role === 'Sales_manager' && (
          <div>
            <label className="label">Zone</label>
            <select {...register('zone_id', { setValueAs: (v) => v ? Number(v) : undefined })} className="input">
              <option value="">Select zone…</option>
              {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Designation</label>
          <input {...register('designation')} className="input" placeholder="Territory Manager" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={createUser.isPending} className="btn-primary">
            {createUser.isPending ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, zones }: { user: User | null; onClose: () => void; zones: ZoneOption[] }) {
  const updateUser = useUpdateUser(user?.user_id ?? 0);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<EditFormData>({
    resolver: zodResolver(editSchema) as any,
    values: user ? {
      full_name: user.full_name,
      email: user.email,
      role: user.role as 'matrix_manager' | 'Sales_manager',
      zone_id: user.zone_id ?? undefined,
      phone: user.phone ?? '',
      designation: user.designation ?? '',
      is_active: user.is_active,
    } : undefined,
  });
  const role = watch('role');

  const onSubmit = async (data: any) => {
    await updateUser.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <ModalShell open={!!user} onClose={onClose} title={`Edit — ${user?.full_name ?? ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Full Name *</label>
          <input {...register('full_name')} className="input" placeholder="Rajesh Kumar" />
          {errors.full_name && <p className="text-[12px] text-health-red mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="label">Email *</label>
          <input {...register('email')} type="email" className="input" />
          {errors.email && <p className="text-[12px] text-health-red mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Role *</label>
          <select {...register('role')} className="input">
            <option value="Sales_manager">Sales Manager</option>
            <option value="matrix_manager">Matrix Manager</option>
          </select>
        </div>
        {role === 'Sales_manager' && (
          <div>
            <label className="label">Zone</label>
            <select {...register('zone_id', { setValueAs: (v) => v ? Number(v) : undefined })} className="input">
              <option value="">— No zone —</option>
              {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Phone</label>
          <input {...register('phone')} className="input" placeholder="+91 9000000000" />
        </div>
        <div>
          <label className="label">Designation</label>
          <input {...register('designation')} className="input" placeholder="Territory Manager" />
        </div>
        <div className="flex items-center gap-3">
          <input {...register('is_active')} type="checkbox" id="is_active" className="w-4 h-4 accent-matrix-blue" />
          <label htmlFor="is_active" className="label mb-0 cursor-pointer">Active Account</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={updateUser.isPending} className="btn-primary">
            {updateUser.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    if (!user) return;
    setIsPending(true);
    try {
      await api.patch(`/admin/users/${user.user_id}`, { password: data.new_password });
      toast.success(`Password reset for ${user.full_name}`);
      reset();
      onClose();
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <ModalShell open={!!user} onClose={onClose} title={`Reset Password — ${user?.full_name ?? ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted">Enter a new password for <span className="font-semibold text-matrix-navy">{user?.email}</span>.</p>
        <div>
          <label className="label">New Password *</label>
          <input {...register('new_password')} type="password" className="input" placeholder="••••••••" />
          {errors.new_password && <p className="text-[12px] text-health-red mt-1">{errors.new_password.message}</p>}
        </div>
        <div>
          <label className="label">Confirm Password *</label>
          <input {...register('confirm_password')} type="password" className="input" placeholder="••••••••" />
          {errors.confirm_password && <p className="text-[12px] text-health-red mt-1">{errors.confirm_password.message}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={isPending} className="btn-primary bg-amber-500 hover:bg-amber-600">
            {isPending ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

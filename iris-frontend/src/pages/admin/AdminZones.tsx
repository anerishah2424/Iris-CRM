import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building2, Users, LayoutList } from 'lucide-react';
import { useZones, useAdminZones, useCreateZone, useUpdateZone } from '@/hooks/useAdmin';
import { EmptyState } from '@/components/common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { INDIAN_STATES } from '@/config/constants';
import type { Zone } from '@/types/shared';
import { useNavigate } from 'react-router-dom';
import api from '@/config/api';
import { toast } from 'sonner';

export default function AdminZones() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  
  const { data, isLoading, refetch } = useAdminZones();
  const zones: Zone[] = Array.isArray(data) ? data : [];

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete zone "${name}"? This will only work if no users or accounts are assigned.`)) {
      try {
        await api.delete(`/admin/zones/${id}`);
        toast.success('Zone deleted');
        refetch();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete zone');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Zone Management</h1>
          <p className="text-sm text-muted mt-1">Configure territories and sales manager assignments.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary shadow-lg shadow-matrix-blue/20">
          <Plus size={16} /> Create Zone
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-48" />)}
        </div>
      ) : zones.length === 0 ? (
        <EmptyState 
          icon={<MapPin size={40} />}
          title="No zones configured" 
          description="Create zones to begin organizing your sales territories." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.zone_id} className="card hover:shadow-xl transition-all duration-300 group border-t-4 border-t-matrix-blue">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-matrix-navy">{zone.zone_name}</h2>
                  {zone.sales_office && (
                    <div className="flex items-center gap-1.5 text-[12px] text-muted mt-0.5">
                      <Building2 size={12} /> {zone.sales_office}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditZone(zone)}
                    className="p-1.5 hover:bg-matrix-paleBlue text-muted hover:text-matrix-blue rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(zone.zone_id, zone.zone_name)}
                    className="p-1.5 hover:bg-red-50 text-muted hover:text-health-red rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-matrix-navy">{zone.sm_count ?? 0}</div>
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">SMs</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-matrix-navy">{zone.accounts_count ?? 0}</div>
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Accounts</div>
                </div>
              </div>

              {zone.states && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
                    <LayoutList size={10} /> Covered States
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(zone.states) ? zone.states : (zone.states as string).split(',')).slice(0, 4).map((s) => (
                      <span key={s} className="text-[10px] bg-matrix-lightBlue/40 text-matrix-blue px-2 py-0.5 rounded-full font-bold">
                        {s}
                      </span>
                    ))}
                    {(Array.isArray(zone.states) ? zone.states : (zone.states as string).split(',')).length > 4 && (
                      <span className="text-[10px] text-muted font-bold">
                        +{(Array.isArray(zone.states) ? zone.states : (zone.states as string).split(',')).length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={() => navigate(`/accounts?zone_id=${zone.zone_id}`)}
                className="w-full py-2 bg-matrix-paleBlue text-matrix-blue text-[13px] font-bold rounded-xl hover:bg-matrix-blue hover:text-white transition-all flex items-center justify-center gap-2"
              >
                View Zone Accounts
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateZoneModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditZoneModal zone={editZone} onClose={() => setEditZone(null)} />
    </div>
  );
}

function CreateZoneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createZone = useCreateZone();
  const { register, handleSubmit, reset } = useForm<{ zone_name: string; sales_office?: string; states: string[] }>();

  const onSubmit = async (data: any) => {
    await createZone.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Create New Zone">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Zone Name *</label>
          <input {...register('zone_name', { required: true })} className="input" placeholder="e.g. West Zone" />
        </div>
        <div>
          <label className="label">Sales Office</label>
          <input {...register('sales_office')} className="input" placeholder="e.g. Mumbai" />
        </div>
        <div>
          <label className="label">States (Covered Territories)</label>
          <select {...register('states')} multiple className="input h-48 focus:ring-matrix-blue">
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <p className="text-[11px] text-muted mt-1.5">Hold Ctrl (Cmd) to select multiple states.</p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={createZone.isPending} className="btn-primary">
            {createZone.isPending ? 'Creating…' : 'Create Zone'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditZoneModal({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  const updateZone = useUpdateZone(zone?.zone_id ?? 0);
  const { register, handleSubmit, reset } = useForm({
    values: zone ? {
      zone_name: zone.zone_name,
      sales_office: zone.sales_office ?? '',
      states: Array.isArray(zone.states) ? zone.states : (zone.states as string).split(','),
    } : undefined,
  });

  const onSubmit = async (data: any) => {
    await updateZone.mutateAsync(data);
    onClose();
  };

  return (
    <ModalShell open={!!zone} onClose={onClose} title={`Edit — ${zone?.zone_name}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Zone Name *</label>
          <input {...register('zone_name', { required: true })} className="input" />
        </div>
        <div>
          <label className="label">Sales Office</label>
          <input {...register('sales_office')} className="input" />
        </div>
        <div>
          <label className="label">States</label>
          <select {...register('states')} multiple className="input h-48">
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={updateZone.isPending} className="btn-primary">
            {updateZone.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border bg-matrix-paleBlue/20">
              <h2 className="text-xl font-bold text-matrix-navy">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                <X size={18} className="text-muted" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

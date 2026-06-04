import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';
import type { RenewalFilters } from '@/types/renewal';

export function useRenewals(filters: RenewalFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.renewals(filters),
    queryFn: () => api.get('/renewals', { params: filters }).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAccountRenewals(accountId: number | undefined) {
  return useQuery({
    queryKey: ['accounts', accountId, 'renewals'],
    queryFn: () =>
      api.get(`/accounts/${accountId}/renewals`).then((r) => r.data.data ?? r.data),
    enabled: !!accountId,
    staleTime: 30_000,
  });
}

export function useMarkRenewalReminded(renewalId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/renewals/${renewalId}/remind`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['renewals'] });
      toast.success('Marked as reminded');
    },
    onError: () => toast.error('Failed to update'),
  });
}

export function useCloseRenewal(renewalId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/renewals/${renewalId}`, { reminder_status: 'Closed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['renewals'] });
      toast.success('Renewal closed');
    },
    onError: () => toast.error('Failed to update'),
  });
}

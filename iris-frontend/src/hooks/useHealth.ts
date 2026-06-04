import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useAccountHealth(accountId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.accountHealth(accountId!),
    queryFn: () =>
      api.get(`/accounts/${accountId}/health`).then((r) => r.data.data ?? r.data),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

export function useAccountHealthHistory(accountId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.accountHealthHistory(accountId!),
    queryFn: () =>
      api.get(`/accounts/${accountId}/health/history`).then((r) => r.data.data ?? r.data),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

export function useRecalculateHealth(accountId: number) {
  const qc = useQueryClient();
  return useMutation({
    // Use the new nested per-account endpoint
    mutationFn: () =>
      api.post(`/accounts/${accountId}/health/recalculate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountHealth(accountId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountHealthHistory(accountId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.account(accountId) });
      toast.success('Health score recalculated');
    },
    onError: () => toast.error('Recalculation failed'),
  });
}


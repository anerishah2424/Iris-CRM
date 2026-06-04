import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';
import type { ReleaseFilters } from '@/types/release';

export function useReleases(filters: ReleaseFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.releases(filters),
    queryFn: () => api.get('/releases', { params: filters }).then((r) => r.data.data ?? r.data),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useReleaseMatches(releaseId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.releaseMatches(releaseId),
    queryFn: () =>
      api.get(`/releases/${releaseId}/matches`).then((r) => r.data.data ?? r.data),
    staleTime: 60_000,
  });
}

export function useAccountReleaseMatches(accountId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.accountReleases(accountId!),
    queryFn: () =>
      api.get(`/accounts/${accountId}/release-matches`).then((r) => r.data.data ?? r.data),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

export function useRecomputeReleaseMatches(releaseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/releases/${releaseId}/recompute`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.releaseMatches(releaseId) });
      qc.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Matches recomputed');
    },
    onError: () => toast.error('Recompute failed'),
  });
}

export function useCreateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/admin/releases', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Release added');
    },
    onError: () => toast.error('Failed to add release'),
  });
}

export function useUpdateReleaseMatch(matchId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      api.patch(`/releases/matches/${matchId}`, { reminder_status: status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Updated');
    },
    onError: () => toast.error('Failed to update'),
  });
}

import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => api.get('/dashboard').then((r) => r.data.data ?? r.data),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useDashboardOpportunities() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboardOpportunities,
    queryFn: () =>
      api.get('/dashboard/opportunities').then((r) => r.data.data ?? r.data),
    staleTime: 60_000,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () =>
      api.get('/dashboard/activity').then((r) => r.data.data ?? r.data),
    staleTime: 30_000,
  });
}

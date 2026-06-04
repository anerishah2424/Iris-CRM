import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useUsers(filters?: unknown) {
  return useQuery({
    queryKey: QUERY_KEYS.users(filters),
    queryFn: () => api.get('/admin/users', { params: filters as Record<string, unknown> }).then((r) => r.data.data ?? r.data),
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/admin/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
    },
    onError: () => toast.error('Failed to create user'),
  });
}

export function useUpdateUser(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.patch(`/admin/users/${userId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });
}

export function useZones() {
  return useQuery({
    queryKey: QUERY_KEYS.zones,
    queryFn: () => api.get('/zones').then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60_000,
  });
}

export function useAdminZones() {
  return useQuery({
    queryKey: ['admin-zones'],
    queryFn: () => api.get('/admin/zones').then((r) => r.data.data ?? r.data),
    staleTime: 30_000,
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/admin/zones', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['admin-zones'] });
      toast.success('Zone created');
    },
    onError: () => toast.error('Failed to create zone'),
  });
}

export function useUpdateZone(zoneId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.patch(`/admin/zones/${zoneId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['admin-zones'] });
      toast.success('Zone updated');
    },
    onError: () => toast.error('Failed to update zone'),
  });
}

export function useProducts(filters?: unknown) {
  return useQuery({
    queryKey: QUERY_KEYS.products(filters),
    queryFn: () => api.get('/products', { params: filters as Record<string, unknown> }).then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60_000,
  });
}

export function useAdminReleases(filters?: unknown) {
  return useQuery({
    queryKey: QUERY_KEYS.releases(filters),
    queryFn: () => api.get('/admin/releases', { params: filters as Record<string, unknown> }).then((r) => r.data.data ?? r.data),
    staleTime: 30_000,
  });
}

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';
import type { AccountFilters, CreateAccountPayload } from '@/types/account';

export function useAccounts(filters: AccountFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.accounts(filters),
    queryFn: () => api.get('/accounts', { params: filters }).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAccount(id: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.account(id!),
    queryFn: () => api.get(`/accounts/${id}`).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountPayload) => api.post('/accounts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Account created successfully');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create account');
    },
  });
}

export function useUpdateAccount(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateAccountPayload>) =>
      api.patch(`/accounts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.account(id) });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account updated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update account');
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Account deleted');
    },
    onError: () => toast.error('Failed to delete account'),
  });
}

export function useAccountProducts(accountId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.accountProducts(accountId!),
    queryFn: () =>
      api.get(`/accounts/${accountId}/products`).then((r) => r.data.data ?? r.data),
    enabled: !!accountId,
    staleTime: 30_000,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products', { params: { per_page: 500 } }).then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60_000,
  });
}

export function useAddAccountProduct(accountId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/accounts/${accountId}/products`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProducts(accountId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.account(accountId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountHealth(accountId) });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Product added to account');
    },
    onError: () => toast.error('Failed to add product'),
  });
}

export function useUpdateAccountProduct(accountId: number, installId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch(`/accounts/${accountId}/products/${installId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProducts(accountId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountHealth(accountId) });
      toast.success('Installed product updated');
    },
    onError: () => toast.error('Failed to update product'),
  });
}

export function useDeleteAccountProduct(accountId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (installId: number) => api.delete(`/accounts/${accountId}/products/${installId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountProducts(accountId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountHealth(accountId) });
      toast.success('Product removed from account');
    },
    onError: () => toast.error('Failed to remove product'),
  });
}

export function useLogVisit(accountId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { visit_type: string; visit_date: string; notes?: string; next_visit_date?: string }) =>
      api.post(`/accounts/${accountId}/visits`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.account(accountId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountHealth(accountId) });
      toast.success('Visit logged successfully');
    },
    onError: () => toast.error('Failed to log visit'),
  });
}

export function useSIPartners() {
  return useQuery({
    queryKey: QUERY_KEYS.siPartners,
    queryFn: () => api.get('/si-partners').then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60_000,
  });
}

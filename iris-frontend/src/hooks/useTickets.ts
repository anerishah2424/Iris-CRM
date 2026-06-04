import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';
import type { TicketFilters, CreateTicketPayload } from '@/types/ticket';

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.tickets(filters),
    queryFn: () => api.get('/tickets', { params: filters }).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAccountTickets(accountId: number | undefined, filters?: Partial<TicketFilters>) {
  return useQuery({
    queryKey: QUERY_KEYS.accountTickets(accountId!),
    queryFn: () =>
      api.get(`/accounts/${accountId}/tickets`, { params: filters }).then((r) => r.data.data ?? r.data),
    enabled: !!accountId,
    staleTime: 30_000,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketPayload) => api.post('/tickets', data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accountTickets(vars.account_id) });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Ticket created');
    },
    onError: () => toast.error('Failed to create ticket'),
  });
}

export function useUpdateTicketStatus(ticketId: number, accountId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      api.patch(`/tickets/${ticketId}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      if (accountId) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.accountTickets(accountId) });
      }
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });
}

export function useSyncTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/tickets/sync'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Tickets synced successfully');
    },
    onError: () => toast.error('Sync failed'),
  });
}

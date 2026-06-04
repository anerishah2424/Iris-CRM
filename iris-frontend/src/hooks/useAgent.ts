import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/config/api';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useLatestAgentRun(accountId: number | undefined, runType: string) {
  return useQuery({
    queryKey: QUERY_KEYS.agentLatest(accountId!, runType),
    queryFn: () =>
      api
        .get(`/agent/runs`, { params: { account_id: accountId, run_type: runType, limit: 1 } })
        .then((r) => {
          const data = r.data.data ?? r.data;
          return Array.isArray(data) ? data[0] ?? null : data;
        }),
    enabled: !!accountId,
    staleTime: 30_000,
  });
}

export function useRunAgent(accountId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { run_type: string; input_payload?: Record<string, unknown> }) =>
      api.post('/agent/run', { account_id: accountId, ...payload }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.agentLatest(accountId, vars.run_type) });
      toast.success('Analysis complete');
    },
    onError: () => toast.error('Agent run failed'),
  });
}

export function useRunProspectAnalysis() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/agent/prospect', payload).then((r) => r.data.data ?? r.data),
    onError: () => toast.error('Analysis failed'),
  });
}

// ─── AI Agent Doc Analysis ───────────────────────────────────────────────────
// Calls the external agentic AI server at port 5001.
export function useRunDocAnalysis() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const AGENT_BASE = 'http://localhost:5001';

      const res = await fetch(`${AGENT_BASE}/generate_proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Agent returned ${res.status}`);
      }

      // Step 2: download the generated file from the agent server
      const docRes = await fetch(`${AGENT_BASE}/download`);
      if (!docRes.ok) {
        throw new Error(`Could not download generated document (${docRes.status})`);
      }
      return docRes.blob();
    },
    onError: (err: Error) => toast.error(`AI Agent Error: ${err.message}`),
  });
}

// ─── AI Agent Market Analysis ────────────────────────────────────────────────
export function useRunMarketAnalysis() {
  return useMutation({
    mutationFn: async (payload: {
      company_name: string;
      industry: string;
      company_size: string;
      location: { state: string; city: string };
      budget_range: string;
    }) => {
      const AGENT_BASE = 'http://localhost:5001';

      const res = await fetch(`${AGENT_BASE}/latest_info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Agent returned ${res.status}`);
      }

      const json = await res.json();
      return json.data;
    },
    onError: (err: Error) => toast.error(`Market Analysis Error: ${err.message}`),
  });
}

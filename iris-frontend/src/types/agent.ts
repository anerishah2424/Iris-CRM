export interface Recommendation {
  product_name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'news_signal' | 'product_gap' | 'industry_benchmark' | 'release_upgrade';
  reason: string;
  suggested_quantity: number;
  unit_price?: number;
}

export interface AgentRun {
  run_id: number;
  account_id?: number;
  run_type: 'market_analysis' | 'proposal' | 'prospect_analysis';
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_payload?: Record<string, unknown>;
  output_payload?: AgentOutput;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  run_by_name?: string;
}

export interface AgentOutput {
  account_summary?: string;
  expansion_signals?: ExpansionSignal[];
  recommendations?: Recommendation[];
  risk_flags?: string[];
  suggested_next_action?: string;
  proposal?: ProposalData;
}

export interface ExpansionSignal {
  signal: string;
  source: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface ProposalData {
  executive_summary: string;
  line_items: ProposalLineItem[];
  subtotal: number;
  gst: number;
  total: number;
  justifications: Record<string, string>;
}

export interface ProposalLineItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

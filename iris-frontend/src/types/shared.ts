export interface Zone {
  zone_id: number;
  zone_name: string;
  states: string[];
  sales_office?: string;
  sm_count?: number;
  accounts_count?: number;
}

export interface SIPartner {
  si_id: number;
  si_name: string;
  city?: string;
  state?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface Opportunity {
  opportunity_id?: number;
  account_id: number;
  account_name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  due_date?: string;
  type: string;
}

export interface DashboardStats {
  total_accounts: number;
  critical_accounts: number;
  at_risk_accounts: number;
  open_tickets: number;
  renewals_due_30d: number;
  avg_health_score: number;
  upsell_opportunities: number;
  release_matches: number;
}

export interface VisitLog {
  visit_id: number;
  account_id: number;
  visit_type: string;
  visit_date: string;
  notes?: string;
  next_visit_date?: string;
  visited_by?: string;
  created_at: string;
}

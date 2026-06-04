import type { Ticket } from './ticket';

export interface HealthDeduction {
  reason: string;
  points: number;
  product_name?: string;
}

export interface AccountHealth {
  account_id: number;
  health_score: number;
  health_status: 'Healthy' | 'At-Risk' | 'Critical';
  breakdown: {
    base_score: number;
    total_deduction: number;
    deductions: HealthDeduction[];
    ticket_count: number;
    license_expiry_deduction: number;
  };
  open_tickets: Ticket[];
  recalculated_at: string;
}

export interface HealthHistoryEntry {
  log_id: number;
  account_id: number;
  health_score: number;
  health_status: 'Healthy' | 'At-Risk' | 'Critical';
  calculated_at: string;
}

export interface Ticket {
  ticket_id: number;
  account_id: number;
  account_name?: string;
  install_id?: number;
  product_name?: string;
  reference_number?: string;
  title: string;
  description?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category?: string;
  source: 'manual' | 'api';
  raised_by?: string;
  assigned_to?: string;
  sla_breach: boolean;
  raised_on: string;
  resolved_on?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketFilters {
  search?: string;
  account_id?: number;
  status?: string;
  priority?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface CreateTicketPayload {
  account_id: number;
  install_id?: number;
  title: string;
  description?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category?: string;
  raised_by?: string;
}

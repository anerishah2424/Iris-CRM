export interface Renewal {
  renewal_id: number;
  account_id: number;
  account_name?: string;
  account_city?: string;
  health_score?: number;
  health_status?: 'Healthy' | 'At-Risk' | 'Critical';
  install_id: number;
  product_name: string;
  domain: string;
  renewal_type: 'License' | 'AMC' | 'Warranty';
  expiry_date: string;
  days_remaining: number;
  si_name?: string;
  reminder_status: 'Pending' | 'Reminded' | 'Closed';
  created_at: string;
  updated_at: string;
}

export interface RenewalFilters {
  search?: string;
  bucket?: '0' | '30' | '60' | '90';
  domain?: string;
  renewal_type?: string;
  page?: number;
  per_page?: number;
}

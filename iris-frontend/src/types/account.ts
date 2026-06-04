export interface Account {
  account_id: number;
  account_name: string;
  industry: string;
  sub_industry?: string;
  city: string;
  state: string;
  zone_id: number;
  zone_name?: string;
  si_id?: number;
  si_name?: string;
  vad_company?: string;
  sales_manager_id?: number;
  sales_manager?: string;
  health_score: number;
  health_status: 'Healthy' | 'At-Risk' | 'Critical';
  open_tickets_count: number;
  nearest_expiry?: string;
  last_visit_date?: string;
  account_type: 'existing' | 'prospect';
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  gstin?: string;
  pan?: string;
  website?: string;
  address?: string;
  pincode?: string;
  notes?: string;
  created_on: string;
  updated_at: string;
}

export interface AccountFilters {
  search?: string;
  health_status?: string;
  industry?: string;
  zone_id?: number;
  state?: string;
  account_type?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateAccountPayload {
  account_name: string;
  industry: string;
  sub_industry?: string;
  account_type: 'existing' | 'prospect';
  city: string;
  state: string;
  pincode?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  website?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  si_id?: number;
  notes?: string;
  products?: InstalledProductPayload[];
}

export interface InstalledProductPayload {
  product_id: number;
  quantity: number;
  installed_version?: string;
  license_expiry?: string;
  license_type?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface Release {
  release_id: number;
  product_id?: number;
  product_name: string;
  domain: string;
  new_version: string;
  release_title: string;
  description?: string;
  highlights: string[];
  release_date: string;
  is_active: boolean;
  match_criteria?: Record<string, unknown>;
  matched_accounts_count?: number;
  estimated_opportunity?: number;
  created_at: string;
}

export interface ReleaseMatch {
  match_id: number;
  release_id: number;
  account_id: number;
  account_name?: string;
  install_id: number;
  installed_version?: string;
  match_reason?: string;
  match_score: number;
  reminder_status: 'Pending' | 'Reminded' | 'Closed';
  created_at: string;
}

export interface ReleaseFilters {
  domain?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

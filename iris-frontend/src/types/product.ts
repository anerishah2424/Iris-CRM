export interface InstalledProduct {
  install_id: number;
  account_id: number;
  product_id: number;
  product_name: string;
  domain: string;
  category: string;
  quantity: number;
  installed_version?: string;
  install_date?: string;
  hardware_age_years?: number;
  license_expiry?: string;
  license_type?: string;
  license_status: 'Active' | 'Expiring Soon' | 'Expired' | 'Discontinued';
  warranty_expiry?: string;
  amc_end_date?: string;
  series?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  product_id: number;
  sap_code?: string;
  product_name: string;
  domain: string;
  category: string;
  series?: string;
  deployment_type?: string;
  unit_price?: number;
  description?: string;
  status?: string;
}

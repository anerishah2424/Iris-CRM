export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'matrix_manager' | 'Sales_manager';
  zone_id?: number;
  zone_name?: string;
  phone?: string;
  designation?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: 'matrix_manager' | 'Sales_manager';
  zone_id?: number;
  phone?: string;
  designation?: string;
  is_active?: boolean;
}

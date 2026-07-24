export interface CompanyPublic {
  name: string;
  logo_path: string;
}

export interface CompanyInfo {
  id: number;
  name: string;
  logo_path: string;
  tax_id: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  updated_at: string;
}
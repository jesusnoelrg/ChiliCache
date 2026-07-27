export interface CompanyPublic {
  name: string;
  logo_path: string;
  primary_color: string;
  secondary_color: string;
}

export interface CompanyInfo {
  id: number;
  name: string;
  logo_path: string;
  tax_id: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  primary_color: string;
  secondary_color: string;
  updated_at: string;
}

export interface UpdateCompanyInfo {
  name: string | null;
  logo_path: string | null | undefined;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  primary_color: string;
  secondary_color: string;
}
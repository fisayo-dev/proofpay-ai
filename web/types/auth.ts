export type AccountRole = "vendor" | "buyer";

export type SignupVendorPayload = {
  full_name: string;
  email: string;
  password: string;
  role?: AccountRole;
  business_name: string;
  category: string;
  phone: string;
  social_handle: string;
  bank_account_name: string;
};

export type SignupVendorResponse = {
  user_id?: string | null;
  vendor_id?: string | null;
  role: AccountRole;
  full_name: string;
  email: string;
  business_name?: string;
  trust_score?: number | null;
  created_at?: string | null;
};

export type LoginPayload = {
  email: string;
  password?: string;
};

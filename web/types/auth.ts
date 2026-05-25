export type SignupVendorPayload = {
  full_name: string;
  email: string;
  password: string;
  business_name: string;
  category: string;
  phone: string;
  social_handle: string;
  bank_account_name: string;
};

export type SignupVendorResponse = {
  vendor_id: string;
  full_name: string;
  email: string;
  business_name: string;
  trust_score: number;
  created_at: string;
};

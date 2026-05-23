export const vendorFieldNames = [
  "first_name",
  "last_name",
  "email",
  "password",
  "business_name",
  "category",
  "phone",
  "social_handle",
  "bank_account_name",
] as const;

export type VendorSignupFieldName = (typeof vendorFieldNames)[number];

export type VendorSignupState = {
  success: boolean;
  message: string;
  fields: Record<VendorSignupFieldName, string>;
  errors: Partial<Record<VendorSignupFieldName, string>>;
};

export const initialVendorSignupState: VendorSignupState = {
  success: false,
  message: "",
  fields: {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    business_name: "",
    category: "",
    phone: "",
    social_handle: "",
    bank_account_name: "",
  },
  errors: {},
};

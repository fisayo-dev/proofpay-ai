export type CreatePaymentRequestPayload = {
  vendor_id: string;
  item_name: string;
  item_description: string;
  amount_kobo: number;
  currency: string;
  delivery_method: string;
  expected_delivery_date: string;
};

export type CreatePaymentRequestResponse = {
  id?: string;
  vendor_id?: string;
  item_name?: string;
  item_description?: string;
  amount_kobo?: number;
  currency?: string;
  public_url: string;
  delivery_method?: string;
  expected_delivery_date?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type PublicProductResponse = {
  payment_request_id: string;
  payment_status: string;
  kora_reference: string;
  public_slug: string;
  seller: {
    business_name: string;
    category: string;
    social_handle: string;
  };
  item: {
    name: string;
    description: string;
    amount: number;
    currency: string;
  };
  trust: {
    score: number;
    verdict: string;
    reasons: string[];
    model_version: string;
  };
};


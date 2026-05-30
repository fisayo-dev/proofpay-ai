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

export type PaymentStatusResponse = {
  payment_request_id: string;
  kora_reference: string;
  status: string;
  amount: number;
  currency: string;
  item_name: string;
  buyer_name: string | null;
  created_at: string;
  error_message?: string | null;
  message?: string | null;
  transaction?: {
    payment_status?: string | null;
    webhook_verified?: boolean;
    paid_at?: string | null;
    payment_method?: string | null;
    error_message?: string | null;
    message?: string | null;
  } | null;
  [key: string]: unknown;
};




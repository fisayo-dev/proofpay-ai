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

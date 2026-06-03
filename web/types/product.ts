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
    image_url?: string | null;
  };
  trust: {
    score: number;
    verdict: string;
    reasons: string[];
    model_version: string;
  };
};

export type BuyerPublicPageProps = {
  product: {
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
      image_url?: string | null;
    };
    trust: {
      score: number;
      verdict: string;
      reasons: string[];
      model_version: string;
    };
  };
  paymentConfig: {
    payment_request_id: string;
    kora_reference: string;
    checkout_config: {
      key: string;
      reference: string;
      amount: number;
      currency: string;
      customer: { name: string; email: string };
      notification_url: string;
    };
  };
};

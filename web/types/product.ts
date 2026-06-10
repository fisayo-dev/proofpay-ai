export type PublicProductResponse = {
  payment_request_id: string;
  payment_status: string;
  kora_reference: string;
  public_slug: string;
  seller: {
    business_name: string;
    category: string;
    social_handle: string;
    badge?: VendorBadge;
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
    ai_summary?: string;
    ai_recommendation?: string;
    ai_powered?: boolean;
    ai_engine?: string;
    ai_model?: string | null;
    anomaly_warnings?: string[];
    history?: TrustHistoryPoint[];
    prediction?: TrustPrediction;
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
      badge?: VendorBadge;
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
      ai_summary?: string;
      ai_recommendation?: string;
      ai_powered?: boolean;
      ai_engine?: string;
      ai_model?: string | null;
      anomaly_warnings?: string[];
      history?: TrustHistoryPoint[];
      prediction?: TrustPrediction;
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

export type VendorBadge = {
  key: string;
  label: string;
  icon: string;
  description: string;
};

export type TrustHistoryPoint = {
  score: number;
  verdict: string;
  created_at: string;
  payment_request_id?: string | null;
};

export type TrustPrediction = {
  current_score: number;
  predicted_score: number;
  delta: number;
  message: string;
};

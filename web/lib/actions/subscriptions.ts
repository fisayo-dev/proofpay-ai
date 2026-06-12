import api from "@/lib/axios";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";

export type CreateSubscriptionPaymentRequestPayload = {
  vendor_id: string;
  plan: "free" | "pro";
  amount_kobo: number;
  currency: string;
};

export type CreateSubscriptionPaymentRequestResponse = {
  payment_request_id: string;
  kora_reference: string;
  status: string;
  checkout_config: Record<string, unknown>;
  [key: string]: unknown;
};

export const createSubscriptionPaymentRequest = async (
  data: CreateSubscriptionPaymentRequestPayload,
): Promise<CreateSubscriptionPaymentRequestResponse> => {
  try {
    const response = await api.post<CreateSubscriptionPaymentRequestResponse>(
      "/subscriptions/payment-request",
      data,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "Could not create subscription payment request. Please try again.",
      ),
    );
  }
};

import api from "@/lib/axios";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import {
  CreatePaymentRequestPayload,
  CreatePaymentRequestResponse,
  PaymentStatusResponse,
} from "@/types/payment-request";
import { PublicProductResponse } from "@/types/product";

export const createPaymentRequest = async (
  data: CreatePaymentRequestPayload,
): Promise<CreatePaymentRequestResponse> => {
  try {
    const response = await api.post<CreatePaymentRequestResponse>(
      "/payment-requests",
      data,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not create the payment request. Please try again.",
      ),
    );
  }
};

export const getPublicProduct = async (
  productSlug: string,
): Promise<PublicProductResponse> => {
  try {
    const response = await api.get(`/public/r/${productSlug}`);
    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not load this payment request right now. Please try again.",
      ),
    );
  }
};

export const getPaymentConfigUrl = async (paymentRequestId: string) => {
  try {
    const response = await api.get(`/payments/kora/config/${paymentRequestId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not prepare checkout right now. Please try again.",
      ),
    );
  }
};

export const getPaymentStatus = async (
  paymentId: string,
): Promise<PaymentStatusResponse> => {
  try {
    const response = await api.get<PaymentStatusResponse>(
      `/payments/${paymentId}/status`,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not check the payment status right now. Please try again.",
      ),
    );
  }
};

export const createImageUpload = async (
  imageUrl: string,
): Promise<{ image_url: string; storage: string }> => {
  try {
    const response = await api.post<{ image_url: string; storage: string }>(
      "/uploads/image",
      {
        image_url: imageUrl,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not validate this product image. Please try another image URL.",
      ),
    );
  }
};

export const reconcilePayment = async (
  paymentRequestId: string,
  koraReference?: string,
) => {
  try {
    const response = await api.post(
      `/payments/${paymentRequestId}/reconcile`,
      {
        kora_reference: koraReference,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not confirm this payment yet. Please wait while we check again.",
      ),
    );
  }
};

export const verifyKoraCheckoutPayment = async (
  paymentRequestId: string,
  koraReference?: string,
) => {
  try {
    const response = await api.post(
      `/payments/${paymentRequestId}/verify-checkout`,
      {
        kora_reference: koraReference,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not confirm this payment yet. Please wait while we check again.",
      ),
    );
  }
};

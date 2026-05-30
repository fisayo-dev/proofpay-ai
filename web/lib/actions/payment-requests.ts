import api from "@/lib/axios";
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
  } catch (err) {
    throw new Error("Failed to create payment request: " + err);
  }
};

export const getPublicProduct = async (
  productSlug: string,
): Promise<PublicProductResponse> => {
  try {
    const response = await api.get(`/public/r/${productSlug}`);
    return response.data;
  } catch (err) {
    throw new Error("Failed to fetch public product: " + err);
  }
};

export const getPaymentConfigUrl = async (paymentRequestId: string) => {
  try {
    const response = await api.get(`/payments/kora/config/${paymentRequestId}`);
    return response.data;
  } catch (err) {
    throw new Error("Failed to fetch payment config: " + err);
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
  } catch (err) {
    throw new Error("Failed to fetch payment status: " + err);
  }
};

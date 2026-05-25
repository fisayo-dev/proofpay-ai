import api from "@/lib/axios";
import {
  CreatePaymentRequestPayload,
  CreatePaymentRequestResponse,
  PublicProductResponse,
} from "@/types/payment-request";

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

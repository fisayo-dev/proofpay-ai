import api from "@/lib/axios";
import {
  CreatePaymentRequestPayload,
  CreatePaymentRequestResponse,
} from "@/types/payment-request";

const createPaymentRequest = async (
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

export default createPaymentRequest;

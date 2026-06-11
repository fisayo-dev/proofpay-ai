import {
  LoginPayload,
  SignupVendorPayload,
  SignupVendorResponse,
} from "@/types/auth";
import { setSession } from "@/lib/session";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import api from "../axios";

const signupVendor = async (
  data: SignupVendorPayload,
): Promise<SignupVendorResponse> => {
  try {
    const response = await api.post<SignupVendorResponse>("/auth/signup", data);

    setSession({
      user_id: response.data.user_id,
      vendor_id: response.data.vendor_id,
      role: response.data.role,
      full_name: response.data.full_name,
      email: response.data.email,
      business_name: response.data.business_name || "",
      trust_score: response.data.trust_score ?? null,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not create your vendor account. Please check your details and try again.",
      ),
    );
  }
};

export const login = async (
  data: LoginPayload,
): Promise<SignupVendorResponse> => {
  try {
    const response = await api.post<SignupVendorResponse>("/auth/login", data);

    setSession({
      user_id: response.data.user_id,
      vendor_id: response.data.vendor_id,
      role: response.data.role,
      full_name: response.data.full_name,
      email: response.data.email,
      business_name: response.data.business_name || "",
      trust_score: response.data.trust_score ?? null,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getFriendlyApiErrorMessage(
        error,
        "We could not log you in. Please check your details and try again.",
      ),
    );
  }
};

export default signupVendor;

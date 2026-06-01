import { SignupVendorPayload, SignupVendorResponse } from "@/types/auth";
import { setSession } from "@/lib/session";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import api from "../axios";

const signupVendor = async (
  data: SignupVendorPayload,
): Promise<SignupVendorResponse> => {
  try {
    const response = await api.post<SignupVendorResponse>("/vendors", data);

    setSession({
      vendor_id: response.data.vendor_id,
      full_name: response.data.full_name,
      email: response.data.email,
      business_name: response.data.business_name,
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

export default signupVendor;

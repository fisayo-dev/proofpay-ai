import { SignupVendorPayload, SignupVendorResponse } from "@/types/auth";
import { setSession } from "@/lib/session";
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
  } catch(err) {
    throw new Error("Failed to signup vendor: " + err);
  }
  
};

export default signupVendor;

import { SignupVendorPayload, SignupVendorResponse } from "@/types/auth";
import api from "../axios";

const signupVendor = async (
  data: SignupVendorPayload,
): Promise<SignupVendorResponse> => {
  try {
    const response = await api.post<SignupVendorResponse>("/vendors", data);
    return response.data;
  } catch(err) {
    throw new Error("Failed to signup vendor: " + err);
  }
  
};

export default signupVendor;

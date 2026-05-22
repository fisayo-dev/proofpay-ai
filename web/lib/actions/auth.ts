import { SignupVendorPayload } from "@/types/auth";
import api from "../axios";

const signupVendor = async (data: SignupVendorPayload) => {
  try {
    const response = await api.post("/vendors", data);
    return response.data;
  } catch(err) {
    throw new Error("Failed to signup vendor: " + err);
  }
  
};

export default signupVendor;

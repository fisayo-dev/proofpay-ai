import api from "../axios";

const signupVendor = async (data: any) => {
  try {
    const response = await api.post("/vendors", data);
    return response.data;
  } catch(err) {
    throw new Error("Failed to signup vendor: " + err);
  }
  
};

export default signupVendor;
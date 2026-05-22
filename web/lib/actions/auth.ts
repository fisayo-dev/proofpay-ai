import api from "../axios";

const signupVendor = async (data: any) => {
  try {
    await api.post("/vendors", data);
  } catch (error) {
    throw error;
  }
};

export default signupVendor;

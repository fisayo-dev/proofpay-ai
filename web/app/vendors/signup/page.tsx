import { Suspense } from "react";

import VendorSignupForm from "@/components/auth/vendor-signup-form";

const VendorSignupPage = () => {
  return (
    <Suspense fallback={null}>
      <VendorSignupForm />
    </Suspense>
  );
};

export default VendorSignupPage;

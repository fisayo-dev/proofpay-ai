import type { Metadata } from "next";

import { VendorSignupForm } from "./vendor-signup-form";

export const metadata: Metadata = {
  title: "Vendor Signup | ProofPay AI",
  description:
    "Create a ProofPay AI vendor profile with your business and payout details.",
};

export default function VendorSignupPage() {
  return <VendorSignupForm />;
}

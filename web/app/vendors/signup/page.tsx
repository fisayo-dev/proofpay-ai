import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  CircleCheckBig,
  Store,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Vendor Signup | ProofPay AI",
  description:
    "Create a ProofPay AI vendor profile with your business and payout details.",
};

const formFields = [
  {
    id: "business_name",
    label: "Business name",
    placeholder: "Favour Fits",
    type: "text",
  },
  {
    id: "category",
    label: "Category",
    placeholder: "Fashion",
    type: "text",
  },
  {
    id: "phone",
    label: "Phone",
    placeholder: "+234 801 234 5678",
    type: "tel",
  },
  {
    id: "social_handle",
    label: "Social handle",
    placeholder: "@favourfits",
    type: "text",
  },
  {
    id: "bank_account_name",
    label: "Bank account name",
    placeholder: "Favour Fits Ventures",
    type: "text",
  },
] as const;

export default function VendorSignupPage() {
  return (
    <main className="">
      <div className="mx-auto grid py-10 pb-20 sm:pb-24">
        <section className="grid md:flex justify-between md:space-x-8 space-y-6">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to home
            </Link>

            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Create your vendor profile.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Keep it simple. Add the basic details ProofPay AI needs to
                register your store and match your payout identity.
              </p>
            </div>
          </div>

          <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
            <CardHeader className="space-y-2 px-5 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="size-5 text-primary" />
                Vendor details
              </CardTitle>
              <CardDescription className="leading-6">
                Start selling your products{" "}
                <b className="text-primary">securely</b>
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 sm:px-6">
              <form className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 py-4">
                  {formFields.map((field) => (
                    <label
                      key={field.id}
                      htmlFor={field.id}
                      className="space-y-2"
                    >
                      <span className="block text-sm font-medium">
                        {field.label}
                      </span>
                      <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        autoComplete="off"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" className="w-full">
                    Create profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

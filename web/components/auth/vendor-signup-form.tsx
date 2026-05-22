"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Store, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "profile",
    title: "Profile details",
    description: "Set up your login and account identity.",
    icon: UserRound,
  },
  {
    id: "vendor",
    title: "Vendor details",
    description: "Add the business information tied to payouts.",
    icon: Store,
  },
] as const;

const profileFields = [
  {
    id: "first_name",
    label: "First name",
    placeholder: "Favour",
    type: "text",
    autoComplete: "given-name",
  },
  {
    id: "last_name",
    label: "Last name",
    placeholder: "Okafor",
    type: "text",
    autoComplete: "family-name",
  },
  {
    id: "email",
    label: "Email",
    placeholder: "favour@example.com",
    type: "email",
    autoComplete: "email",
  },
  {
    id: "password",
    label: "Password",
    placeholder: "Create a strong password",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

const vendorFields = [
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

const VendorSignupForm = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const isProfileStep = currentStep === 0;
  const activeFields = isProfileStep ? profileFields : vendorFields;
  const activeStep = steps[currentStep];
  const ActiveStepIcon = activeStep.icon;

  return (
    <main>
      <div className="mx-auto grid gap-10 pb-20 sm:pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch w-full justify-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isComplete = currentStep > index;

            return (
              <div key={step.id} className="grid items-center gap-3">
                <div
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                    isActive
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center border rounded-full text-sm font-semibold transition-colors",
                      isComplete
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary/50 bg-background text-primary"
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {isComplete ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <section className="grid gap-6  md:justify-between md:gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Signup as a Vendor
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Keep it simple. Start with your account details, then finish
                with the business information ProofPay AI needs for your store.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)] md:max-w-2xl md:flex-1">
              <CardHeader className="space-y-5 px-5 sm:px-6">
                <h2 className="text-3xl font-medium ">
                  {currentStep == 0
                    ? "We want to know you? "
                    : "Complete your seller profile"}
                </h2>
              </CardHeader>

              <CardContent className="px-5 sm:px-6">
                <form className="space-y-7">
                  <div className="grid gap-4 py-4 sm:grid-cols-2">
                    {activeFields.map((field) => (
                      <label
                        key={field.id}
                        htmlFor={field.id}
                        className={cn(
                          "space-y-2",
                          field.id === "bank_account_name" && "sm:col-span-2",
                        )}
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
                          className="text-sm"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Step {currentStep + 1} of {steps.length}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {!isProfileStep ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(0)}
                        >
                          Back
                        </Button>
                      ) : null}

                      {isProfileStep ? (
                        <Button type="button" onClick={() => setCurrentStep(1)}>
                          Continue to vendor details
                        </Button>
                      ) : (
                        <Button type="submit">Start selling</Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
};

export default VendorSignupForm;

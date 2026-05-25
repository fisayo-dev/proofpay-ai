"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import signupVendor from "@/lib/actions/auth";
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

const VendorSignupForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isProfileStep = currentStep === 0;
  const resetMessages = () => {
    setErrors({});
    setServerError("");
  };

  const handleContinue = () => {
    resetMessages();

    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) {
      newErrors.first_name = "First name is required.";
    }
    if (!lastName.trim()) {
      newErrors.last_name = "Last name is required.";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    } else if (password.trim().length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCurrentStep(1);
  };

  const handleBack = () => {
    resetMessages();
    setCurrentStep(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    const newErrors: Record<string, string> = {};
    if (!businessName.trim()) {
      newErrors.business_name = "Business name is required.";
    }
    if (!category.trim()) {
      newErrors.category = "Category is required.";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone is required.";
    }
    if (!socialHandle.trim()) {
      newErrors.social_handle = "Social handle is required.";
    }
    if (!bankAccountName.trim()) {
      newErrors.bank_account_name = "Bank account name is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const vendor = await signupVendor({
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password: password.trim(),
        business_name: businessName.trim(),
        category: category.trim(),
        phone: phone.trim(),
        social_handle: socialHandle.trim(),
        bank_account_name: bankAccountName.trim(),
      });

      localStorage.setItem("vendor_id", vendor.vendor_id);
      toast.success("Vendor account created successfully.");
      router.push("/vendors/new-product");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to create vendor account.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange =
    (setter: (value: string) => void, field?: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      if (field && errors[field]) {
        const copy = { ...errors };
        delete copy[field];
        setErrors(copy);
      }
      if (serverError) setServerError("");
    };

  return (
    <main className="grid md:grid-cols-2 items-center md:gap-10 justify-between">
      <div className="mx-auto grid gap-10 pb-20 sm:pb-24">
        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Signup as a Vendor
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Keep it simple. Start with your account details, then finish with
            the business information ProofPay AI needs for your store.
          </p>
        </div>
        <div className="grid w-full gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isComplete = currentStep > index;

            return (
              <div key={step.id} className="grid items-center gap-3">
                <div
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                    isActive ?
                      "border-primary/40 bg-primary/5"
                    : "border-border/70 bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                      isComplete ?
                        "border-primary bg-primary text-primary-foreground"
                      : isActive ?
                        "border-primary/50 bg-background text-primary"
                      : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {isComplete ?
                      <Check className="size-4" />
                    : <Icon className="size-4" />}
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
      </div>
      <div className="space-y-4">
        <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)] md:max-w-2xl md:flex-1">
          <CardHeader className="space-y-5 px-5 sm:px-6">
            <h2 className="text-3xl font-medium">
              {isProfileStep ?
                "We want to know you?"
              : "Complete your seller profile"}
            </h2>
          </CardHeader>

          <CardContent className="px-5 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* per-field error messages shown under each input */}

              {isProfileStep ?
                <div className="grid gap-4 py-4 ">
                  <label htmlFor="first_name" className="space-y-2">
                    <span className="block text-sm font-medium">
                      First name
                    </span>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      placeholder="Favour"
                      autoComplete="given-name"
                      className="text-sm"
                      value={firstName}
                      onChange={handleInputChange(setFirstName, "first_name")}
                    />
                    {errors.first_name ? (
                      <p className="text-xs text-destructive">{errors.first_name}</p>
                    ) : null}
                  </label>

                  <label htmlFor="last_name" className="space-y-2">
                    <span className="block text-sm font-medium">Last name</span>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      placeholder="Okafor"
                      autoComplete="family-name"
                      className="text-sm"
                      value={lastName}
                      onChange={handleInputChange(setLastName, "last_name")}
                    />
                    {errors.last_name ? (
                      <p className="text-xs text-destructive">{errors.last_name}</p>
                    ) : null}
                  </label>

                  <label htmlFor="email" className="space-y-2">
                    <span className="block text-sm font-medium">Email</span>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="favour@example.com"
                      autoComplete="email"
                      className="text-sm"
                      value={email}
                      onChange={handleInputChange(setEmail, "email")}
                    />
                    {errors.email ? (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    ) : null}
                  </label>

                  <label htmlFor="password" className="space-y-2">
                    <span className="block text-sm font-medium">Password</span>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      className="text-sm"
                      value={password}
                      onChange={handleInputChange(setPassword, "password")}
                    />
                    {errors.password ? (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    ) : null}
                  </label>
                </div>
              : <div className="grid gap-4 py-4 sm:grid-cols-2">
                  <label htmlFor="business_name" className="space-y-2">
                    <span className="block text-sm font-medium">
                      Business name
                    </span>
                    <Input
                      id="business_name"
                      name="business_name"
                      type="text"
                      placeholder="Favour Fits"
                      className="text-sm"
                      value={businessName}
                      onChange={handleInputChange(setBusinessName, "business_name")}
                    />
                    {errors.business_name ? (
                      <p className="text-xs text-destructive">{errors.business_name}</p>
                    ) : null}
                  </label>

                  <label htmlFor="category" className="space-y-2">
                    <span className="block text-sm font-medium">Category</span>
                    <Input
                      id="category"
                      name="category"
                      type="text"
                      placeholder="Fashion"
                      className="text-sm"
                      value={category}
                      onChange={handleInputChange(setCategory, "category")}
                    />
                    {errors.category ? (
                      <p className="text-xs text-destructive">{errors.category}</p>
                    ) : null}
                  </label>

                  <label htmlFor="phone" className="space-y-2">
                    <span className="block text-sm font-medium">Phone</span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+234 801 234 5678"
                      className="text-sm"
                      value={phone}
                      onChange={handleInputChange(setPhone, "phone")}
                    />
                    {errors.phone ? (
                      <p className="text-xs text-destructive">{errors.phone}</p>
                    ) : null}
                  </label>

                  <label htmlFor="social_handle" className="space-y-2">
                    <span className="block text-sm font-medium">
                      Social handle
                    </span>
                    <Input
                      id="social_handle"
                      name="social_handle"
                      type="text"
                      placeholder="@favourfits"
                      className="text-sm"
                      value={socialHandle}
                      onChange={handleInputChange(setSocialHandle, "social_handle")}
                    />
                    {errors.social_handle ? (
                      <p className="text-xs text-destructive">{errors.social_handle}</p>
                    ) : null}
                  </label>

                  <label
                    htmlFor="bank_account_name"
                    className="space-y-2 sm:col-span-2"
                  >
                    <span className="block text-sm font-medium">
                      Bank account name
                    </span>
                    <Input
                      id="bank_account_name"
                      name="bank_account_name"
                      type="text"
                      placeholder="Favour Fits Ventures"
                      className="text-sm"
                      value={bankAccountName}
                      onChange={handleInputChange(setBankAccountName, "bank_account_name")}
                    />
                    {errors.bank_account_name ? (
                      <p className="text-xs text-destructive">{errors.bank_account_name}</p>
                    ) : null}
                  </label>
                </div>
              }

              {serverError ? (
                <div className="text-sm text-destructive">{serverError}</div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {!isProfileStep ?
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  : null}

                  {isProfileStep ?
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleContinue}
                    >
                      Continue to vendor details
                    </Button>
                  : <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating account..." : "Start selling"}
                    </Button>
                  }
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default VendorSignupForm;

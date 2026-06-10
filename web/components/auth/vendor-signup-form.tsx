"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogIn, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import signupVendor, { login } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type AccountType = "vendor" | "buyer";
type AuthMode = "signup" | "login";

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
  const [accountType, setAccountType] = useState<AccountType>("vendor");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [vendorErrors, setVendorErrors] = useState<Record<string, string>>({});
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [vendorTouched, setVendorTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isProfileStep = currentStep === 0;
  
  const resetMessages = () => {
    setProfileErrors({});
    setVendorErrors({});
    setServerError("");
    setProfileTouched({});
    setVendorTouched({});
  };

  const routeAfterAuth = (role: AccountType) => {
    if (role === "buyer") {
      router.push("/#store");
      return;
    }

    router.push("/vendors/profile");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    const newErrors: Record<string, string> = {};
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors);
      setProfileTouched({ email: true, password: true });
      return;
    }

    setIsSubmitting(true);

    try {
      const account = await login({
        email: email.trim(),
        password: password.trim(),
      });
      toast.success("Logged in successfully.");
      routeAfterAuth(account.role);
    } catch (error) {
      setServerError(
        getFriendlyApiErrorMessage(
          error,
          "We could not log you in. Please check your details and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
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
      setProfileErrors(newErrors);
      setProfileTouched({
        first_name: true,
        last_name: true,
        email: true,
        password: true,
      });
      return;
    }

    if (accountType === "buyer") {
      setIsSubmitting(true);
      try {
        await signupVendor({
          role: "buyer",
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          password: password.trim(),
          business_name: "",
          category: "",
          phone: "",
          social_handle: "",
          bank_account_name: "",
        });
        toast.success("Buyer account created successfully.");
        routeAfterAuth("buyer");
      } catch (error) {
        setServerError(
          getFriendlyApiErrorMessage(
            error,
            "We could not create your account. Please check your details and try again.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // clear touched/errors when moving to next step
    setProfileErrors({});
    setProfileTouched({});
    // also clear any vendor errors/touched so step 2 doesn't show stale errors
    setVendorErrors({});
    setVendorTouched({});
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
    } else if (!/^[a-zA-Z0-9_]+$/.test(socialHandle.trim())) {
      newErrors.social_handle = "Only letters, numbers, and underscores allowed.";
    }
    if (!bankAccountName.trim()) {
      newErrors.bank_account_name = "Bank account name is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setVendorErrors(newErrors);
      setVendorTouched({
        business_name: true,
        category: true,
        phone: true,
        social_handle: true,
        bank_account_name: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await signupVendor({
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password: password.trim(),
        role: "vendor",
        business_name: businessName.trim(),
        category: category.trim(),
        phone: phone.trim(),
        social_handle: socialHandle.trim(),
        bank_account_name: bankAccountName.trim(),
      });

      toast.success("Vendor account created successfully.");
      routeAfterAuth("vendor");
    } catch (error) {
      setServerError(
        getFriendlyApiErrorMessage(
          error,
          "We could not create your vendor account. Please check your details and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange =
    (setter: (value: string) => void, field?: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = field === "social_handle"
        ? event.target.value.replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "")
        : event.target.value;
      setter(value);
      if (field) {
        const isVendorField = field.startsWith("business_") || field === "category" || field === "phone" || field === "social_handle" || field === "bank_account_name";
        if (isVendorField) {
          if (vendorErrors[field]) {
            const copy = { ...vendorErrors };
            delete copy[field];
            setVendorErrors(copy);
          }
        } else {
          if (profileErrors[field]) {
            const copy = { ...profileErrors };
            delete copy[field];
            setProfileErrors(copy);
          }
        }
      }
      if (field) {
        if (field.startsWith("business_") || field === "category" || field === "phone" || field === "social_handle" || field === "bank_account_name") {
          setVendorTouched((t) => ({ ...t, [field]: true }));
        } else {
          setProfileTouched((t) => ({ ...t, [field]: true }));
        }
      }
      if (serverError) setServerError("");
    };

  return (
    <main className="grid md:grid-cols-2 items-center md:gap-10 justify-between py-10">
      <div className="mx-auto grid gap-10 pb-20 sm:pb-24">
        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {authMode === "login" ? "Login to ProofPay" : "Create your ProofPay account"}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Choose buyer if you want to shop safely, or vendor if you want to
            create trusted payment requests and track your seller metrics.
          </p>
          <div className="flex w-fit rounded-full border border-border/70 bg-muted/30 p-1">
            {(["signup", "login"] as AuthMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthMode(mode);
                  setCurrentStep(0);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors",
                  authMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        {authMode === "signup" ? (
          <div className="grid w-full gap-4">
            {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isComplete = currentStep > index;
            const disabledVendorStep = accountType === "buyer" && index === 1;

            return (
              <div
                key={step.id}
                className={cn("grid items-center gap-3", disabledVendorStep && "opacity-45")}
              >
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
        ) : null}
      </div>
      <div className="space-y-4">
        <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)] md:max-w-2xl md:flex-1">
          <CardHeader className="space-y-5 px-5 sm:px-6">
            <h2 className="text-3xl font-medium">
              {isProfileStep ?
                authMode === "login" ? "Welcome back" : "We want to know you?"
              : "Complete your seller profile"}
            </h2>
          </CardHeader>

          <CardContent className="px-5 sm:px-6">
            <form onSubmit={authMode === "login" ? handleLogin : handleSubmit} className="space-y-7">
              {/* per-field error messages shown under each input */}

              {isProfileStep ?
                <div className="grid gap-4 py-4 ">
                  {authMode === "signup" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["vendor", "buyer"] as AccountType[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setAccountType(role)}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left transition-colors",
                            accountType === role
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/70 bg-muted/20 hover:bg-muted/40",
                          )}
                        >
                          <span className="block text-sm font-semibold capitalize">
                            {role}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {role === "vendor"
                              ? "Create products and track seller trust."
                              : "Shop from trusted vendors faster."}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {authMode === "signup" ? (
                    <>
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
                      {profileErrors.first_name && profileTouched.first_name ? (
                        <p className="text-xs mt-1 text-destructive">{profileErrors.first_name}</p>
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
                      {profileErrors.last_name && profileTouched.last_name ? (
                        <p className="text-xs mt-1 text-destructive">{profileErrors.last_name}</p>
                      ) : null}
                  </label>
                    </>
                  ) : null}

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
                      {profileErrors.email && profileTouched.email ? (
                        <p className="text-xs mt-1 text-destructive">{profileErrors.email}</p>
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
                      {profileErrors.password && profileTouched.password ? (
                        <p className="text-xs mt-1 text-destructive">{profileErrors.password}</p>
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
                      {vendorErrors.business_name && vendorTouched.business_name ? (
                        <p className="text-xs mt-1 text-destructive">{vendorErrors.business_name}</p>
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
                      {vendorErrors.category && vendorTouched.category ? (
                        <p className="text-xs mt-1 text-destructive">{vendorErrors.category}</p>
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
                      {vendorErrors.phone && vendorTouched.phone ? (
                        <p className="text-xs mt-1 text-destructive">{vendorErrors.phone}</p>
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
                      {vendorErrors.social_handle && vendorTouched.social_handle ? (
                        <p className="text-xs mt-1 text-destructive">{vendorErrors.social_handle}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Letters, numbers, and underscores only.
                      </p>
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
                      {vendorErrors.bank_account_name && vendorTouched.bank_account_name ? (
                        <p className="text-xs mt-1 text-destructive">{vendorErrors.bank_account_name}</p>
                      ) : null}
                  </label>
                </div>
              }

              {serverError ? (
                <div className="text-sm text-destructive">{serverError}</div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {authMode === "login"
                    ? "Use the email you signed up with."
                    : `Step ${currentStep + 1} of ${accountType === "buyer" ? 1 : steps.length}`}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {authMode === "login" ? null : !isProfileStep ?
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  : null}

                  {authMode === "login" ? (
                    <Button type="submit" disabled={isSubmitting}>
                      <LogIn className="size-4" />
                      {isSubmitting ? "Logging in..." : "Login"}
                    </Button>
                  ) : isProfileStep ?
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleContinue}
                    >
                      {isSubmitting
                        ? "Creating account..."
                        : accountType === "buyer"
                          ? "Create buyer account"
                          : "Continue to vendor details"}
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

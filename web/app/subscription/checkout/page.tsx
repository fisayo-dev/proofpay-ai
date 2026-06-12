"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCachedSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { createSubscriptionPaymentRequest } from "@/lib/actions/subscriptions";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";

const SUBSCRIPTION_PLANS = {
  pro: {
    name: "Pro",
    price: 1500,
    currency: "NGN",
    description: "Upgrade to Pro for ₦1,500/month",
  },
} as const;

type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

const SubscriptionCheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get("plan") || "pro") as PlanKey;
  
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS[planParam] || SUBSCRIPTION_PLANS.pro;

  useEffect(() => {
    // Redirect to signup if not logged in
    if (session === null) {
      router.push("/vendors/signup");
    }
    // Redirect to profile if already a vendor on free plan (or eventually check if they're on pro)
    // This is optional - you might want to allow re-subscriptions
  }, [session, router]);

  if (!session) {
    return null;
  }

  const isVendor = session.role === "vendor";

  if (!isVendor) {
    return (
      <main className="app-container flex min-h-[calc(100vh-5rem)] items-center justify-center py-8 sm:py-12">
        <Card className="w-full max-w-xl border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
          <CardHeader className="items-center space-y-4 px-5 text-center sm:px-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-muted/30">
              <AlertCircle className="size-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Only vendors can upgrade
              </CardTitle>
              <p className="text-sm leading-7 text-muted-foreground">
                You need a vendor account to subscribe to a plan.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex gap-3 px-5 pb-6 sm:px-8">
            <Button asChild variant="outline" className="flex-1">
              <a href="/vendors/signup">Create vendor account</a>
            </Button>
            <Button asChild className="flex-1">
              <a href="/">Return home</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleStartCheckout = async () => {
    if (!session.vendor_id) {
      setError("Vendor ID not found. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const paymentRequest = await createSubscriptionPaymentRequest({
        vendor_id: session.vendor_id,
        plan: planParam,
        amount_kobo: plan.price * 100, // Convert naira to kobo
        currency: plan.currency,
      });

      // Redirect to payment processing page
      router.push(`/payments/callback/${paymentRequest.payment_request_id}`);
    } catch (err) {
      const friendlyError = getFriendlyApiErrorMessage(
        err,
        "Could not start the subscription checkout. Please try again.",
      );
      setError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app-container flex min-h-[calc(100vh-5rem)] items-center justify-center py-8 sm:py-12">
      <Card className="w-full max-w-xl border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
        <CardHeader className="space-y-4 px-5 sm:px-8">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Upgrade to {plan.name}
            </CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {plan.description}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-5 pb-6 sm:px-8">
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex gap-3">
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">What's included:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>2% transaction fee (vs 3% for free)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Verified vendor badge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Full analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Unlimited products listed</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Monthly subscription</span>
              <span className="text-2xl font-bold">₦{plan.price.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your subscription will renew automatically each month. You can cancel anytime from your account settings.
            </p>
          </div>

          <Button
            onClick={handleStartCheckout}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <a href="/pricing">Cancel</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default SubscriptionCheckoutPage;

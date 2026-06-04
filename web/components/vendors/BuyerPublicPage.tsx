"use client";

import Image from "next/image";
import Script from "next/script";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  ImageIcon,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Store,
  User2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { verifyKoraCheckoutPayment } from "@/lib/actions/payment-requests";
import { cn } from "@/lib/utils";
import { BuyerPublicPageProps } from "@/types/product";

declare global {
  interface Window {
    Korapay?: {
      initialize: (config: Record<string, unknown>) => void;
    };
  }
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 1);
};

const getTrustTone = (score: number) => {
  const tone =
    score >= 80
      ? "trusted"
      : score >= 55 && score < 80
        ? "moderate"
        : score >= 30 && score < 55
          ? "high risk"
          : score >= 0 && score < 30
            ? "Manual Review"
            : "low";

  if (tone === "trusted") {
    return {
      badgeClassName:
        "border-success/30 bg-success/12 text-success dark:bg-success/18",
      panelClassName: "border-success/20 bg-success/5",
      Icon: BadgeCheck,
      label: "Trusted",
      tone,
    };
  }

  if (tone === "moderate") {
    return {
      badgeClassName:
        "border-warning/30 bg-warning/15 text-warning-foreground dark:bg-warning/20",
      panelClassName: "border-warning/20 bg-warning/5",
      Icon: ShieldCheck,
      label: "Moderate",
      tone,
    };
  }

  if (tone === "high risk") {
    return {
      badgeClassName:
        "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/15",
      panelClassName: "border-destructive/20 bg-destructive/5",
      Icon: AlertTriangle,
      label: "High risk",
      tone,
    };
  }

  if (tone === "Manual Review") {
    return {
      badgeClassName:
        "border-warning/35 bg-warning/15 text-warning-foreground dark:bg-warning/20",
      panelClassName: "border-warning/20 bg-warning/5",
      Icon: AlertTriangle,
      label: "Manual Review",
      tone,
    };
  }

  return {
    badgeClassName: "border-border bg-muted text-muted-foreground",
    panelClassName: "border-border bg-muted/20",
    Icon: AlertTriangle,
    label: "Low",
    tone,
  };
};

const getTrustScoreStyle = (score: number) => {
  if (score >= 80) {
    return {
      label: "Trusted",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    };
  }

  if (score >= 55 && score < 80) {
    return {
      label: "Moderate",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }

  if (score >= 30 && score < 55) {
    return {
      label: "High risk",
      className:
        "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
    };
  }

  if (score >= 0 && score < 30) {
    return {
      label: "Manual Review",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }

  return {
    label: "Low",
    className: "border-border bg-muted text-muted-foreground",
  };
};

const TrustScorePill = ({ score }: { score: number }) => {
  const style = getTrustScoreStyle(score);

  return (
    <div
      className={cn(
        "flex items-center  gap-5 rounded-full border px-3 py-1.5 text-sm font-semibold tracking-tight",
        style.className,
      )}
    >
      <span>{score}%</span>
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-80">
        {style.label}
      </span>
    </div>
  );
};

const BuyerPublicPage = ({ product, paymentConfig }: BuyerPublicPageProps) => {
  const [toggleReason, setToggleReason] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isKoraScriptReady, setIsKoraScriptReady] = useState(false);
  const trustTone = getTrustTone(product.trust.score);
  const TrustIcon = trustTone.Icon;
  const formattedAmount = formatCurrency(
    product.item.amount,
    product.item.currency,
  );
  const callbackUrl = `/payments/callback/${paymentConfig.payment_request_id}`;

  const redirectToCallback = () => {
    window.location.assign(callbackUrl);
  };

  const confirmCheckoutThenRedirect = async () => {
    try {
      await verifyKoraCheckoutPayment(
        paymentConfig.payment_request_id,
        paymentConfig.kora_reference,
      );
    } catch (error) {
      console.error("Kora checkout callback verification failed", error);
    } finally {
      redirectToCallback();
    }
  };

  const handleCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = buyerName.trim();
    const email = buyerEmail.trim();

    if (!fullName) {
      setCheckoutError("Enter your full name to continue.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCheckoutError("Enter a valid email address to continue.");
      return;
    }

    if (!window.Korapay || !isKoraScriptReady) {
      setCheckoutError(
        "Kora checkout is still loading. Try again in a moment.",
      );
      return;
    }

    setCheckoutError("");
    setIsCheckoutDialogOpen(false);

    window.Korapay.initialize({
      ...paymentConfig.checkout_config,
      customer: {
        ...paymentConfig.checkout_config.customer,
        name: fullName,
        email,
      },
      onClose: redirectToCallback,
      onSuccess: confirmCheckoutThenRedirect,
      onFailed: redirectToCallback,
      onPending: redirectToCallback,
    });
  };

  return (
    <main className="bg-background">
      <Script
        src="https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsKoraScriptReady(true)}
        onError={() =>
          setCheckoutError(
            "Kora checkout could not load. Refresh and try again.",
          )
        }
      />
      <section className="app-container py-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)]">
              {product.item.image_url && product.item.image_url.trim() ? (
                <div className="relative aspect-4/3 w-full bg-muted sm:aspect-video">
                  <Image
                    src={product.item.image_url}
                    alt={`${product.item.name} product preview`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 720px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-4/3 w-full items-center justify-center bg-muted sm:aspect-video">
                  <ImageIcon className="size-16 text-muted-foreground/40" />
                </div>
              )}

              <div className="grid gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-2 rounded-md px-2.5 py-1"
                  >
                    <Store className="size-3.5" />
                    {product.seller.business_name}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="rounded-md px-2.5 py-1 text-muted-foreground"
                  >
                    {product.seller.category}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                    {product.item.name.length > 50
                      ? `${product.item.name.slice(0, 47)}...`
                      : product.item.name}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {product.item.description.length > 160
                      ? `${product.item.description.slice(0, 157)}...`
                      : product.item.description}
                  </p>
                </div>

                <div className="grid gap-3 border-t border-border/70 pt-5 sm:flex justify-between">
                  <div className="flex items-center gap-3">
                    <PackageCheck className="size-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Product checked</p>
                      <p className="text-xs text-muted-foreground">
                        Request reviewed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="size-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Secure checkout</p>
                      <p className="text-xs text-muted-foreground">
                        Powered by Kora
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Card
              className={cn(
                "border border-border/70 bg-card shadow-[0_24px_80px_-56px_rgba(15,23,42,0.3)]",
                trustTone.panelClassName,
              )}
            >
              <CardHeader className="gap-4 px-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-fit gap-2 rounded-md",
                        trustTone.badgeClassName,
                      )}
                    >
                      <TrustIcon className="size-3.5" />
                      <span>{trustTone.label}</span>
                    </Badge>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl sm:text-3xl">
                        {product.trust.verdict}
                      </CardTitle>
                      <CardDescription className="max-w-2xl text-sm leading-7">
                        ProofPay AI reviewed seller signals, payment context,
                        and request details before sending you to checkout.
                      </CardDescription>
                    </div>
                  </div>

                  <TrustScorePill score={product.trust.score} />
                </div>
              </CardHeader>

              <CardContent className="grid gap-3 px-5 pb-5 sm:px-6">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setToggleReason(!toggleReason)}
                  aria-expanded={toggleReason}
                >
                  <span className="font-semibold">
                    Why this score? ({product.trust.reasons.length} signals
                    checked)
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      toggleReason && "rotate-180",
                    )}
                  />
                </button>
                {toggleReason ? (
                  <div className="grid gap-2">
                    {product.trust.reasons.slice(0, 4).map((reason) => (
                      <div
                        key={reason}
                        className="rounded-lg border border-border/60 bg-background px-4 py-3"
                      >
                        <p className="text-sm leading-6 text-foreground/90">
                          {reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card
              id="checkout"
              className="border border-border/70 bg-card shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)]"
            >
              <CardHeader className="gap-4 px-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-2xl">Checkout summary</CardTitle>
                    <CardDescription>
                      Confirm the request before payment.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 pb-5 sm:px-6">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Total due
                  </p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">
                    {formattedAmount}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3">
                    <Store className="size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Seller</p>
                      <p className="truncate text-sm font-medium">
                        {product.seller.business_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3">
                    <Building2 className="size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="truncate text-sm font-medium">
                        {product.seller.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3">
                    <User2 className="size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Social handle
                      </p>
                      <p className="truncate text-sm font-medium">
                        @{product.seller.social_handle}
                      </p>
                    </div>
                  </div>
                </div>

                <AlertDialog
                  open={isCheckoutDialogOpen}
                  onOpenChange={(open) => {
                    setIsCheckoutDialogOpen(open);

                    if (open) {
                      setCheckoutError("");
                    }
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button className="w-full">
                      <span>Buy now</span>
                      <ArrowRight />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <form onSubmit={handleCheckout} className="grid gap-4">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Checkout details</AlertDialogTitle>
                        <AlertDialogDescription>
                          Enter your details so Kora can attach them to this
                          payment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="grid gap-3">
                        <label className="grid gap-1.5 text-sm font-medium">
                          <span>Full name</span>
                          <Input
                            value={buyerName}
                            onChange={(event) =>
                              setBuyerName(event.target.value)
                            }
                            placeholder="Jane Doe"
                            autoComplete="name"
                            aria-invalid={checkoutError.includes("full name")}
                          />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium">
                          <span>Email</span>
                          <Input
                            type="email"
                            value={buyerEmail}
                            onChange={(event) =>
                              setBuyerEmail(event.target.value)
                            }
                            placeholder="jane@example.com"
                            autoComplete="email"
                            aria-invalid={checkoutError.includes("email")}
                          />
                        </label>

                        {checkoutError ? (
                          <p className="text-sm text-destructive">
                            {checkoutError}
                          </p>
                        ) : null}
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">
                          Cancel
                        </AlertDialogCancel>
                        <Button type="submit">
                          Proceed to checkout
                          <ArrowRight />
                        </Button>
                      </AlertDialogFooter>
                    </form>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default BuyerPublicPage;

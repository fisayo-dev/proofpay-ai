"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  ShieldCheck,
  ShoppingBag,
  Store,
  User2,
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
import { cn } from "@/lib/utils";
import { BuyerPublicPageProps } from "@/types/product";
import { useState } from "react";

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
};

const getTrustTone = (score: number) => {
  if (score >= 70) {
    return {
      badgeClassName:
        "border-success/30 bg-success/12 text-success dark:bg-success/18",
      panelClassName:
        "border-success/20 bg-linear-to-br from-success/10 via-background to-background",
      Icon: BadgeCheck,
      label: "Strong trust signal",
    };
  }

  if (score >= 40) {
    return {
      badgeClassName:
        "border-warning/30 bg-warning/15 text-warning-foreground dark:bg-warning/20",
      panelClassName:
        "border-warning/20 bg-linear-to-br from-warning/10 via-background to-background",
      Icon: ShieldCheck,
      label: "Moderate trust signal",
    };
  }

  return {
    badgeClassName:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/15",
    panelClassName: "border-destructive/10",
    Icon: AlertTriangle,
    label: "Higher-risk payment",
  };
};

const getTrustScoreStyle = (score: number) => {
  if (score >= 70) {
    return {
      label: "Trusted",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    };
  }

  if (score >= 40) {
    return {
      label: "Moderate",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }

  return {
    label: "Low",
    className:
      "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  };
};

const TrustScorePill = ({ score }: { score: number }) => {
  const style = getTrustScoreStyle(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold tracking-tight",
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
  const trustTone = getTrustTone(product.trust.score);
  const TrustIcon = trustTone.Icon;
  const formattedAmount = formatCurrency(
    product.item.amount,
    product.item.currency,
  );

  return (
    <main className="relative overflow-hidden">
      <div className="absolute left-1/2 top-40 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <section className="app-container py-5 sm:py-7">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-primary/20 bg-primary/10 text-primary">
                  <ShoppingBag className="size-3.5" />
                  <span>AI-powered payment</span>
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sold by <b className="text-primary">{product.seller.business_name}</b>
                  </p>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                    {product.item.name.length > 50
                      ? `${product.item.name.slice(0, 47)}...`
                      : product.item.name}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {product.item.description.length > 100
                      ? `${product.item.description.slice(0, 97)}...`
                      : product.item.description}
                  </p>
                </div>
              </div>
            </div>

            <Card
              className={cn(
                "border shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]",
                trustTone.panelClassName,
              )}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className={cn("gap-2", trustTone.badgeClassName)}
                    >
                      <TrustIcon className="size-3.5" />
                      <span>{trustTone.label}</span>
                    </Badge>
                    <CardTitle className="text-2xl sm:text-3xl">
                      {product.trust.verdict}
                    </CardTitle>
                    <CardDescription className="max-w-2xl text-sm leading-7">
                      ProofPay AI reviewed this payment request using seller
                      profile data and transaction context before checkout.
                    </CardDescription>
                  </div>

                  <div className="bg-background/10 flex items-center gap-2">
                    <TrustScorePill score={product.trust.score} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-3">
                <div
                  className="flex cursor-pointer items-center justify-between px-2"
                  onClick={() => setToggleReason(!toggleReason)}
                >
                  <h2 className="font-semibold">
                    Reasons {product.trust.reasons.length}
                  </h2>
                  <ChevronDown
                    className={`size-4 ${toggleReason && "rotate-180"}`}
                  />
                </div>
                <div className="grid gap-1">
                  {toggleReason &&
                    product.trust.reasons.map((reason) => (
                      <div
                        key={reason}
                        className="border border-border/60 bg-background/75 px-3 py-2 rounded-xl"
                      >
                        <p className="text-sm leading-6 text-foreground/90">
                          {reason}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24">
            <Card
              id="checkout"
              className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 size-12 text-primary flex items-center justify-center text-2xl font-extrabold">
                    ₦
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Checkout summary</CardTitle>
                    <CardDescription>
                      Review the key details before paying.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-3xl border border-border/70 bg-muted/30 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    You will pay
                  </p>
                  <p className="mt-2 text-4xl font-semibold">
                    {formattedAmount}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3">
                    <Store className="mt-0.5 size-6 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {product.seller.business_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3">
                    <Building2 className="mt-0.5 size-6 shrink-0 text-primary" />
                    <div className="space-y-1">
                      {/*<p className="text-sm font-medium">Category</p>*/}
                      <p className="text-sm text-muted-foreground">
                        {product.seller.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3">
                    <User2 className="mt-0.5 size-6 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        @{product.seller.social_handle}
                      </p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href={`#checkout-action-${product.public_slug}`}>
                    <span>Buy now</span>
                    <ArrowRight />
                  </Link>
                </Button>

                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-1 text-sm text-muted-foreground">
                  All payments are Powered by{" "}
                  <Link
                    href="https://www.korahq.com"
                    target="__blank"
                    className="font-bold hover:underline"
                  >
                    Kora
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BuyerPublicPage;

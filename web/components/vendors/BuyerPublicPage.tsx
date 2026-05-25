import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
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

type BuyerPublicPageProps = {
  product: {
    payment_request_id: string;
    payment_status: string;
    kora_reference: string;
    public_slug: string;
    seller: {
      business_name: string;
      category: string;
      social_handle: string;
    };
    item: {
      name: string;
      description: string;
      amount: number;
      currency: string;
    };
    trust: {
      score: number;
      verdict: string;
      reasons: string[];
      model_version: string;
    };
  };
};

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
    panelClassName:
      "border-destructive/20 bg-linear-to-br from-destructive/10 via-background to-background",
    Icon: AlertTriangle,
    label: "Higher-risk payment",
  };
};

const getStatusTone = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return "border-success/30 bg-success/12 text-success dark:bg-success/18";
    case "created":
    case "pending":
      return "border-primary/20 bg-primary/10 text-primary";
    default:
      return "border-border bg-muted/60 text-foreground";
  }
};

const BuyerPublicPage = ({ product }: BuyerPublicPageProps) => {
  const trustTone = getTrustTone(product.trust.score);
  const TrustIcon = trustTone.Icon;
  const formattedAmount = formatCurrency(
    product.item.amount,
    product.item.currency,
  );

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(45,103,255,0.18),transparent_55%)]" />
      <div className="absolute left-1/2 top-40 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <section className="app-container py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-primary/20 bg-primary/10 text-primary">
                  <ShoppingBag className="size-3.5" />
                  <span>Public payment request</span>
                </Badge>
                <Badge
                  variant="outline"
                  className={getStatusTone(product.payment_status)}
                >
                  {product.payment_status}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sold by {product.seller.business_name}
                  </p>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                    {product.item.name}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {product.item.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-3xl border border-border/70 bg-background/80 p-5 shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)] backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Amount to pay
                    </p>
                    <p className="text-3xl font-semibold sm:text-4xl">
                      {formattedAmount}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border/70" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Kora reference
                    </p>
                    <p className="font-medium">{product.kora_reference}</p>
                  </div>
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
                <div className="flex flex-wrap items-start justify-between gap-4">
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

                  <div className="min-w-32 rounded-3xl border border-border/70 bg-background/85 px-5 py-4 text-right backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Trust score
                    </p>
                    <p className="mt-2 text-4xl font-semibold">
                      {product.trust.score}
                    </p>
                    <p className="text-sm text-muted-foreground">/ 100</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-3">
                {product.trust.reasons.map((reason) => (
                  <div
                    key={reason}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/75 px-4 py-3"
                  >
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-sm leading-6 text-foreground/90">
                      {reason}
                    </p>
                  </div>
                ))}
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
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <CircleDollarSign className="size-5" />
                  </div>
                  <div className="space-y-1">
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    Reference: {product.kora_reference}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-border/60 px-4 py-3">
                    <Store className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Seller</p>
                      <p className="text-sm text-muted-foreground">
                        {product.seller.business_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-border/60 px-4 py-3">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-sm text-muted-foreground">
                        {product.seller.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-border/60 px-4 py-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Seller handle</p>
                      <p className="text-sm text-muted-foreground">
                        {product.seller.social_handle}
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

                <div
                  id={`checkout-action-${product.public_slug}`}
                  className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
                >
                  Checkout is ready for the payment flow connection tied to
                  this request. Use the reference above for the next payment
                  step.
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground">
                  <p>Request ID: {product.payment_request_id}</p>
                  <p>Public slug: {product.public_slug}</p>
                  <p>Model: {product.trust.model_version}</p>
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

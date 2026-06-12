import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BadgeCheck, Package, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vendors, store_products } from "@/constants/home";
import { nairaFormatter } from "@/utils/store";

type VendorProfilePageProps = {
  params: Promise<{
    vendorId: string;
  }>;
};

const getBadge = (score: number) => {
  if (score >= 85) return { label: "Top Seller", icon: Award };
  if (score >= 65) return { label: "Verified", icon: BadgeCheck };
  return { label: "Rising Star", icon: Sparkles };
};

export default async function VendorProfilePage({
  params,
}: VendorProfilePageProps) {
  const { vendorId } = await params;
  const vendor = vendors.find((item) => item.id === vendorId);

  if (!vendor) {
    notFound();
  }

  const sellerProducts = store_products.filter(
    (product) =>
      product.vendor.business_name.toLowerCase() ===
      vendor.business_name.toLowerCase(),
  );
  const badge = getBadge(vendor.score);
  const BadgeIcon = badge.icon;

  return (
    <section className="mx-auto max-w-6xl space-y-8 pb-20 sm:pb-24">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative size-24 overflow-hidden rounded-full border bg-muted">
                <Image
                  src={vendor.profile_picture}
                  alt={`${vendor.business_name} profile image`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-4xl font-semibold tracking-tight">
                    {vendor.business_name}
                  </h1>
                  <Badge variant="outline" className="gap-1">
                    <BadgeIcon className="size-3.5" />
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {vendor.category} / {vendor.social_handle}
                </p>
                <p className="max-w-2xl leading-7 text-muted-foreground">
                  {vendor.summary}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Trust score
              </p>
              <p className="mt-2 text-3xl font-semibold">{vendor.score}/100</p>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Completed sales
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {vendor.completed_transactions}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Verdict
              </p>
              <p className="mt-2 text-3xl font-semibold">{vendor.verdict}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="size-5 text-primary" />
              Trust evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {vendor.reasons.map((reason) => (
              <div
                key={reason}
                className="rounded-lg border border-border/70 px-4 py-3 text-sm"
              >
                {reason}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Products from {vendor.business_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Open a listed product to review the buyer checkout and trust context.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {sellerProducts.map((product) => (
            <Link
              key={product.id}
              href={
                product.public_slug
                  ? `/r/${product.public_slug}`
                  : `/#store`
              }
              className="block rounded-xl border border-border/70 bg-card p-4 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={product.image || "/images/products/ceramic-mug.jpg"}
                  alt={product.payment_request.item_name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 space-y-2">
                <Badge variant="outline" className="gap-1">
                  <Package className="size-3.5" />
                  {product.trust.verdict}
                </Badge>
                <h3 className="text-lg font-semibold">
                  {product.payment_request.item_name}
                </h3>
                <p className="font-semibold">
                  {nairaFormatter.format(product.payment_request.amount)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

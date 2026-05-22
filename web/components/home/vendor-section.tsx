import Image from "next/image";
import { AlertTriangle, ArrowRight, ShieldCheck, Users2 } from "lucide-react";
import { vendors } from "@/constants/home";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const verdictStyles = {
  Trusted: {
    badgeClassName: "bg-primary text-primary-foreground",
    accentClassName: "text-primary",
    ringClassName: "ring-success/20",
    icon: ShieldCheck,
  },
  Caution: {
    badgeClassName: "bg-warning text-warning-foreground",
    accentClassName: "text-warning",
    ringClassName: "ring-warning/20",
    icon: AlertTriangle,
  },
  "Manual Review Needed": {
    badgeClassName: "bg-destructive text-destructive-foreground",
    accentClassName: "text-destructive",
    ringClassName: "ring-destructive/20",
    icon: AlertTriangle,
  },
} as const;

const VendorSection = () => {
  const featuredVendor = vendors[0];
  const otherVendors = vendors.slice(1,4);
  const FeaturedIcon = verdictStyles[featuredVendor.verdict].icon;

  return (
    <section id="vendors" className="py-20 sm:py-24">
      <div className="grid md:grid-cols-12 gap-10 lg:items-start">
        <div className="md:col-span-7 space-y-8">
          <div className="space-y-4">
            
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Check vendor trust before you approve a payment.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              ProofPay AI surfaces the signals that matter most so trusted sellers
              stand out fast and risky ones get a closer look.
            </p>
          </div>

          <Card className="overflow-hidden border border-border/70 bg-background pt-0 shadow-[0_24px_80px_-40px_rgba(14,30,86,0.24)]">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-18 w-18 overflow-hidden rounded-full ring-1 ring-border/70 shadow-sm">
                    <Image
                      src={featuredVendor.profile_picture}
                      alt={featuredVendor.business_name}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {featuredVendor.business_name}
                      </h3>
                      <Badge
                        className={
                          verdictStyles[featuredVendor.verdict].badgeClassName
                        }
                      >
                        {featuredVendor.verdict}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {featuredVendor.category} / {featuredVendor.social_handle}
                    </p>
                  </div>
                </div>

                <div className="grid w-full md:max-w-56 grid-cols-2 gap-3 sm:w-auto">
                  <div className="rounded-2xl border border-border/70 bg-background p-4 text-center">
                    <p className="text-2xl font-semibold text-primary">
                      {featuredVendor.score}
                    </p>
                    <p className="text-xs text-primary">Trust score</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background p-4 text-center">
                    <p className="text-2xl font-semibold">
                      {featuredVendor.completed_transactions}
                    </p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                </div>
              </div>
            </div>

            <CardHeader className="space-y-4 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FeaturedIcon
                  className={cn(
                    "size-4",
                    verdictStyles[featuredVendor.verdict].accentClassName
                  )}
                />
                <span>{featuredVendor.confidence}</span>
              </div>
              <CardTitle className="text-2xl">{featuredVendor.summary}</CardTitle>
              <CardDescription className="text-sm leading-7">
                Strong identity checks, stable payments, and clean order history.
              </CardDescription>
            </CardHeader>

          </Card>
        </div>

        <div className="grid md:col-span-5 gap-4 grid-cols-1">
          {otherVendors.map((vendor) => {
            const vendorStyle = verdictStyles[vendor.verdict];
            const VendorIcon = vendorStyle.icon;

            return (
              <Card
                key={vendor.id}
                size="sm"
                className="border border-border/70 bg-background shadow-[0_20px_60px_-42px_rgba(14,30,86,0.24)]"
              >
                <CardHeader className="space-y-2 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-border/70">
                        <Image
                          src={vendor.profile_picture}
                          alt={vendor.business_name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>

                      <div>
                        <CardTitle className="truncate text-base">
                          {vendor.business_name}
                        </CardTitle>
                        <CardDescription className="truncate text-xs">
                          {vendor.category} / {vendor.social_handle}
                        </CardDescription>
                      </div>
                    </div>

                    <span className={`${vendorStyle.badgeClassName} rounded-full p-2 h-8 w-8 flex items-center justify-center`}>
                      {vendor.score}
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-foreground/90">
                    {vendor.summary}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 px-5 pb-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Users2 className="size-3.5" />
                      {vendor.completed_transactions} sales
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <VendorIcon
                        className={cn("size-3.5", vendorStyle.accentClassName)}
                      />
                      {vendor.verdict}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                    <span className="text-muted-foreground">
                      {vendor.confidence}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      Review profile
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VendorSection;

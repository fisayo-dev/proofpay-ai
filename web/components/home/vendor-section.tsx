import Image from "next/image";
import { AlertTriangle, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { vendors } from "@/constants/home";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const verdictStyles = {
  Trusted: {
    badgeClassName: "border-primary/25 bg-primary/10 text-primary",
    iconClassName: "text-primary",
    icon: ShieldCheck,
  },
  Caution: {
    badgeClassName: "border-warning/35 bg-warning/15 text-warning-foreground",
    iconClassName: "text-warning",
    icon: AlertTriangle,
  },
  "Manual Review Needed": {
    badgeClassName: "border-destructive/30 bg-destructive/10 text-destructive",
    iconClassName: "text-destructive",
    icon: AlertTriangle,
  },
} as const;

const filters = ["Reputation", "Trusted", "Caution", "Manual Review"] as const;

const VendorSection = () => {
  const displayedVendors = vendors.slice(0, 6);

  return (
    <section id="vendors" className="pt-20 sm:pt-24">
      <div className="mx-auto space-y-2 text-center justify-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Vendors
        </h2>
        <p className="mx-auto text-sm leading-7 text-muted-foreground sm:text-base">
          Review seller identity, reputation, and payment history before
          approving a request.
        </p>
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto pb-1 text-sm lg:pb-0 mt-4 mx-auto w-full ">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={cn(
              "shrink-0 rounded-full px-5 py-2 font-medium text-foreground/80 transition hover:bg-muted",
              filter === "Trusted" &&
                "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {displayedVendors.map((vendor, index) => {
          const vendorStyle = verdictStyles[vendor.verdict];
          const VendorIcon = vendorStyle.icon;

          return (
            <article
              key={index}
              className={cn(
                "min-w-0 rounded-xl p-4 transition border border-gray-200 bg-card hover:bg-white/90 cursor-pointer hover:shadow-[0_18px_50px_-38px_rgba(14,30,86,0.45)]",
              )}
            >
              <div className="flex items-start gap-4">
                <Avatar className="size-20 shadow-sm">
                  <AvatarImage
                    src={vendor.profile_picture}
                    alt={`${vendor.business_name} vendor avatar`}
                  />
                  <AvatarFallback>
                    {vendor.business_name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">
                      {vendor.business_name}
                    </h3>
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {vendor.category} / {vendor.social_handle}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="rounded-md text-[11px]">
                      {vendor.score}/100
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 rounded-md text-[11px]",
                        vendorStyle.badgeClassName,
                      )}
                    >
                      <VendorIcon
                        className={cn("size-3", vendorStyle.iconClassName)}
                      />
                      {vendor.verdict}
                    </Badge>
                    <Badge variant="outline" className="rounded-md text-[11px]">
                      {vendor.completed_transactions} sales
                    </Badge>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default VendorSection;

"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { vendors } from "@/constants/home";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useHomeGsap } from "./use-home-gsap";

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
  const rootRef = useRef<HTMLElement>(null);
  const displayedVendors = vendors.slice(0, 6);

  useHomeGsap(rootRef, (gsap, _ScrollTrigger, prefersReducedMotion) => {
    if (prefersReducedMotion) {
      gsap.set("[data-vendor-animate]", { clearProps: "all" });
      return;
    }

    const cards = gsap.utils.toArray<HTMLElement>("[data-vendor-card]");

    gsap
      .timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 72%",
          end: "bottom 40%",
          toggleActions: "play none none reverse",
        },
      })
      .from("[data-vendor-heading]", {
        autoAlpha: 0,
        y: 18,
        duration: 0.55,
      })
      .from(
        "[data-vendor-filter]",
        {
          autoAlpha: 0,
          x: (index) => (index % 2 === 0 ? -34 : 34),
          rotate: (index) => (index % 2 === 0 ? -4 : 4),
          duration: 0.55,
          stagger: 0.06,
        },
        "-=0.25",
      )
      .from(
        cards,
        {
          autoAlpha: 0,
          y: 44,
          clipPath: "inset(18% 0% 18% 0% round 18px)",
          duration: 0.7,
          stagger: { each: 0.09, grid: "auto", from: "center" },
        },
        "-=0.15",
      )
      .from(
        "[data-vendor-avatar]",
        {
          scale: 0.65,
          rotate: -10,
          duration: 0.5,
          stagger: { each: 0.05, from: "random" },
          ease: "back.out(1.9)",
        },
        "-=0.45",
      );

    gsap.to("[data-vendor-filter-active]", {
      boxShadow: "0 10px 32px -18px rgba(0, 102, 204, 0.9)",
      scale: 1.04,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    const cleanupHandlers: Array<() => void> = [];

    cards.forEach((card) => {
      const badges = card.querySelectorAll("[data-vendor-badge]");
      const avatar = card.querySelector("[data-vendor-avatar]");

      const handleMouseEnter = () => {
        gsap.to(card, {
          y: -7,
          scale: 1.015,
          duration: 0.25,
          ease: "power2.out",
        });
        gsap.to(avatar, {
          rotate: 5,
          scale: 1.05,
          duration: 0.25,
          ease: "back.out(2)",
        });
        gsap.to(badges, {
          y: -2,
          stagger: 0.04,
          duration: 0.22,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(avatar, {
          rotate: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(badges, {
          y: 0,
          stagger: 0.03,
          duration: 0.25,
          ease: "power2.out",
        });
      };

      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseleave", handleMouseLeave);
      cleanupHandlers.push(() => {
        card.removeEventListener("mouseenter", handleMouseEnter);
        card.removeEventListener("mouseleave", handleMouseLeave);
      });
    });

    return () => cleanupHandlers.forEach((cleanup) => cleanup());
  }, []);

  return (
    <section ref={rootRef} id="vendors" className="pt-20 sm:pt-24">
      <div
        data-vendor-animate
        data-vendor-heading
        className="mx-auto space-y-2 text-center justify-center"
      >
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
            data-vendor-animate
            data-vendor-filter
            data-vendor-filter-active={filter === "Trusted" ? "" : undefined}
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
              data-vendor-animate
              data-vendor-card
              className={cn(
                "min-w-0 rounded-xl p-4 transition border border-gray-200 bg-card hover:bg-white/90 cursor-pointer hover:shadow-[0_18px_50px_-38px_rgba(14,30,86,0.45)]",
              )}
            >
              <div className="flex items-start gap-4">
                <Avatar data-vendor-avatar className="size-20 shadow-sm">
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
                    <Badge
                      data-vendor-badge
                      variant="outline"
                      className="rounded-md text-[11px]"
                    >
                      {vendor.score}/100
                    </Badge>
                    <Badge
                      data-vendor-badge
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
                    <Badge
                      data-vendor-badge
                      variant="outline"
                      className="rounded-md text-[11px]"
                    >
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

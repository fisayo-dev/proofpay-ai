"use client";

import { Award, BadgeCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { vendors } from "@/constants/home";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useHomeGsap } from "./use-home-gsap";

const getVerificationBadge = (score: number) => {
  if (score >= 80) {
    return {
      label: "Top seller",
      Icon: Award,
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
  }
  if (score >= 65) {
    return {
      label: "Verified",
      Icon: BadgeCheck,
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    };
  }
  return {
    label: "Rising star",
    Icon: Sparkles,
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
};

const filters = ["Reputation", "Trusted", "Caution", "Manual Review"] as const;
type VendorFilter = (typeof filters)[number];
const initialRevealSpeed = 2;

const filterDescriptions: Record<VendorFilter, string> = {
  Reputation: "Ranked by trust score and completed sales history.",
  Trusted: "Vendors with strong trust scores and healthy transaction history.",
  Caution: "Vendors buyers should review more carefully before paying.",
  "Manual Review": "Vendors with limited or risky signals that need extra checks.",
};

const VendorSection = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [activeFilter, setActiveFilter] = useState<VendorFilter>("Reputation");
  const displayedVendors = useMemo(() => {
    if (activeFilter === "Reputation") {
      return [...vendors]
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.completed_transactions - a.completed_transactions,
        )
        .slice(0, 6);
    }

    const targetVerdict =
      activeFilter === "Manual Review" ? "Manual Review Needed" : activeFilter;

    return vendors
      .filter((vendor) => vendor.verdict === targetVerdict)
      .slice(0, 6);
  }, [activeFilter]);

  useHomeGsap(rootRef, (gsap, ScrollTrigger, prefersReducedMotion) => {
    if (prefersReducedMotion) {
      gsap.set("[data-vendor-animate]", { clearProps: "all" });
      return;
    }

    const cards = gsap.utils.toArray<HTMLElement>("[data-vendor-card]");

    const revealTrigger = ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top 78%",
      once: true,
      onEnter: () => {
        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              gsap.set("[data-vendor-animate]", {
                clearProps: "opacity,visibility,transform",
              });
            },
          })
          .from("[data-vendor-heading]", {
            autoAlpha: 0,
            y: 18,
            duration: 0.55 / initialRevealSpeed,
          })
          .from(
            "[data-vendor-filter]",
            {
              autoAlpha: 0,
              x: (index) => (index % 2 === 0 ? -34 : 34),
              rotate: (index) => (index % 2 === 0 ? -4 : 4),
              duration: 0.55 / initialRevealSpeed,
              stagger: 0.06 / initialRevealSpeed,
            },
            "-=0.25",
          )
          .from(
            cards,
            {
              autoAlpha: 0,
              y: 34,
              scale: 0.96,
              duration: 0.65 / initialRevealSpeed,
              stagger: {
                each: 0.08 / initialRevealSpeed,
                grid: "auto",
                from: "center",
              },
            },
            "-=0.15",
          )
          .from(
            "[data-vendor-avatar]",
            {
              scale: 0.72,
              rotate: -8,
              duration: 0.45 / initialRevealSpeed,
              stagger: { each: 0.05 / initialRevealSpeed, from: "random" },
              ease: "back.out(1.9)",
            },
            "-=0.4",
          );
      },
    });

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

    return () => {
      revealTrigger.kill();
      cleanupHandlers.forEach((cleanup) => cleanup());
    };
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
      <div className="flex justify-center gap-2 overflow-x-hidden pb-1 text-sm lg:pb-0 mt-4 mx-auto w-full ">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            data-vendor-animate
            data-vendor-filter
            data-vendor-filter-active={filter === activeFilter ? "" : undefined}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2 font-medium text-foreground/80 transition hover:bg-muted",
              filter === activeFilter &&
                "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {filter}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        {filterDescriptions[activeFilter]}
      </p>

      <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {displayedVendors.map((vendor, index) => {
          const verification = getVerificationBadge(vendor.score);
          const VerificationIcon = verification.Icon;

          return (
            <Link
              href={`/vendors/${vendor.id}`}
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
                        verification.className,
                      )}
                    >
                      <VerificationIcon className="size-3" />
                      {verification.label}
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
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default VendorSection;

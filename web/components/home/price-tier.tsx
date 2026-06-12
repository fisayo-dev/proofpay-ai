"use client";

import { BadgeCheck, ChartNoAxesColumn, CreditCard, Package, Rocket } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useHomeGsap } from "./use-home-gsap";

const tiers = [
  {
    name: "Free",
    price: 0,
    fee: "3%",
    badge: "Basic",
    badgeIcon: BadgeCheck,
    analytics: "None",
    products: "3 – 4",
    popular: false,
  },
  {
    name: "Pro",
    price: 1500,
    fee: "1%",
    badge: "Verified",
    badgeIcon: Rocket,
    analytics: "Full dashboard",
    products: "Unlimited",
    popular: true,
  },
] as const;

const PriceTier = () => {
  const rootRef = useRef<HTMLElement>(null);

  useHomeGsap(rootRef, (gsap, _ScrollTrigger, prefersReducedMotion) => {
    if (prefersReducedMotion) {
      gsap.set("[data-price-animate]", { clearProps: "all" });
      return;
    }

    const cards = gsap.utils.toArray<HTMLElement>("[data-price-card]");

    gsap
      .timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 72%",
          end: "bottom 35%",
          toggleActions: "play none none reverse",
        },
      })
      .from("[data-price-kicker]", {
        autoAlpha: 0,
        y: 18,
        duration: 0.55,
      })
      .from(
        "[data-price-copy]",
        { autoAlpha: 0, y: 18, duration: 0.65, filter: "blur(6px)" },
        "-=0.3",
      )
      .from(
        cards,
        {
          autoAlpha: 0,
          y: 48,
          duration: 0.75,
          stagger: { each: 0.15, from: "start" },
        },
        "-=0.25",
      );

    cards.forEach((card) => {
      const handleMouseEnter = () => {
        gsap.to(card, {
          y: -8,
          duration: 0.28,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      };

      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseleave", handleMouseLeave);
    });
  }, []);

  return (
    <section ref={rootRef} id="pricing" className="pt-20 sm:pt-24">
      <div className="grid gap-10 lg:items-start">
        <div className="mx-auto space-y-4 text-center">
          <h2
            data-price-animate
            data-price-kicker
            className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Simple, transparent pricing.
          </h2>
          <p
            data-price-animate
            data-price-copy
            className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base"
          >
            Start for free, upgrade as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {tiers.map((tier) => {
            const BadgeIcon = tier.badgeIcon;

            return (
              <Card
                key={tier.name}
                data-price-animate
                data-price-card
                data-popular={tier.popular || undefined}
                className="relative border border-border/70 bg-background shadow-[0_18px_50px_-36px_rgba(14,30,86,0.32)] data-popular:border-primary/40 data-popular:shadow-[0_0_0_1px_var(--primary)] z-0 overflow-visible"
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs z-20">
                    Most popular
                  </Badge>
                )}
                <CardHeader className="gap-3 px-5 pb-0 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{tier.name}</span>
                    <BadgeIcon className="size-5 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {tier.price === 0 ? "Free" : `₦${tier.price.toLocaleString()}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 px-5 py-6">
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-medium">{tier.fee}</span>{" "}
                      <span className="text-muted-foreground">
                        per transaction
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BadgeIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      Trust badge:{" "}
                      <span className="font-medium">{tier.badge}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ChartNoAxesColumn className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      Analytics:{" "}
                      <span className="font-medium">{tier.analytics}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Package className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      Products listed:{" "}
                      <span className="font-medium">{tier.products}</span>
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="px-5 py-6">
                  {tier.price === 0 ?
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <Link href="/vendors/signup" title="Get started free">Get started free</Link>
                    </Button>
                  : <Button asChild className="w-full">
                      <Link href="/subscription/checkout?plan=pro" title="Upgrade to Pro">Upgrade to Pro</Link>
                    </Button>
                  }
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PriceTier;

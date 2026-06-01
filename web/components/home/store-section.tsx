"use client";

import Image from "next/image";
import { WalletIcon } from "lucide-react";
import { useRef } from "react";
import { store_products } from "@/constants/home";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { nairaFormatter } from "@/utils/store";
import { useHomeGsap } from "./use-home-gsap";

const StoreSection = () => {
  const rootRef = useRef<HTMLElement>(null);

  useHomeGsap(rootRef, (gsap, _ScrollTrigger, prefersReducedMotion) => {
    if (prefersReducedMotion) {
      gsap.set("[data-store-animate]", { clearProps: "all" });
      return;
    }

    const cards = gsap.utils.toArray<HTMLElement>("[data-store-card]");

    gsap.to("[data-store-glow]", {
      xPercent: 18,
      yPercent: -12,
      scale: 1.18,
      duration: 3.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap
      .timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 70%",
          end: "bottom 35%",
          toggleActions: "play none none reverse",
        },
      })
      .from("[data-store-heading]", {
        autoAlpha: 0,
        y: 20,
        duration: 0.6,
      })
      .from(
        cards,
        {
          autoAlpha: 0,
          y: 70,
          rotateZ: (index) => [-3, 2, -1][index] ?? 0,
          scale: 0.92,
          duration: 0.8,
          stagger: 0.12,
          ease: "back.out(1.35)",
        },
        "-=0.2",
      )
      .from(
        "[data-store-image]",
        {
          scale: 1.18,
          duration: 1,
          stagger: 0.12,
          ease: "power2.out",
        },
        "-=0.75",
      )
      .from(
        "[data-store-verdict]",
        {
          autoAlpha: 0,
          x: 18,
          scale: 0.8,
          duration: 0.45,
          stagger: 0.08,
          ease: "back.out(2)",
        },
        "-=0.45",
      )
      .from(
        "[data-store-button]",
        {
          autoAlpha: 0,
          y: 18,
          duration: 0.45,
          stagger: 0.08,
        },
        "-=0.3",
      );

    gsap.to(cards, {
      y: (index) => (index % 2 === 0 ? -18 : 18),
      ease: "none",
      scrollTrigger: {
        trigger: rootRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
      },
      stagger: 0.05,
    });

    const cleanupHandlers: Array<() => void> = [];

    cards.forEach((card) => {
      const image = card.querySelector("[data-store-image]");
      const badges = card.querySelectorAll("[data-store-badge]");

      const handleMouseEnter = () => {
        gsap.to(card, {
          y: -10,
          rotateZ: 0,
          scale: 1.015,
          duration: 0.28,
          ease: "power2.out",
        });
        gsap.to(image, {
          scale: 1.08,
          duration: 0.45,
          ease: "power2.out",
        });
        gsap.to(badges, {
          y: -2,
          stagger: 0.04,
          duration: 0.25,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: "power2.out",
        });
        gsap.to(image, {
          scale: 1,
          duration: 0.45,
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
    <section ref={rootRef} id="store" className="relative pt-20 sm:pt-24">
      <div
        data-store-glow
        className="absolute inset-x-0 top-8 -z-10 mx-auto h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />

      <div data-store-animate data-store-heading className="space-y-5 text-center">
        <div className="space-y-3">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Shop verified products with trust signals attached to every order.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Each listing highlights the vendor, order amount, delivery method,
            and ProofPay AI trust verdict so buyers can review the essentials
            before paying.
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {store_products.map((product) => (
          <Card
            key={product.id}
            data-store-animate
            data-store-card
            className="group/card overflow-hidden border border-border/70 bg-background/80 pt-0 shadow-[0_20px_60px_-30px_rgba(14,30,86,0.35)] backdrop-blur-sm"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              <Image
                data-store-image
                src={product.image}
                alt={product.payment_request.item_name}
                fill
                className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/75 to-transparent px-4 py-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                    {product.vendor.category}
                  </p>
                  <p className="text-lg font-semibold">
                    {nairaFormatter.format(product.payment_request.amount)}
                  </p>
                </div>
                <Badge className="bg-primary text-success-foreground">
                  {product.trust.verdict}
                </Badge>
              </div>
            </div>

            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">
                    {product.payment_request.item_name}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    Sold by{" "}
                    <span className="font-bold text-primary">
                      {product.vendor.business_name}
                    </span>
                  </CardDescription>
                </div>
                <Badge
                  data-store-verdict
                  data-store-badge
                  variant="secondary"
                  className="shrink-0"
                >
                  {product.trust.score}/100
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge data-store-badge variant="outline">
                  {product.vendor.social_handle}
                </Badge>
                <Badge data-store-badge variant="outline">
                  {product.vendor.completed_transactions} completed sales
                </Badge>
              </div>
            </CardHeader>

            <CardFooter className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/40">
              <Button data-store-button className="w-full">
                <WalletIcon />
                <span>Purchase securely</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default StoreSection;

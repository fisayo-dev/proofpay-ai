"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Sparkles, TrendingUp } from "lucide-react";
import { store_products, type StoreProduct } from "@/constants/home";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { nairaFormatter } from "@/utils/store";
import api from "@/lib/axios";
import { useHomeGsap } from "./use-home-gsap";

type BuyerRecommendations = {
  summary: {
    summary: string;
    ai_powered: boolean;
  };
  popular: StoreProduct[];
  most_trusted: StoreProduct[];
  latest: StoreProduct[];
};

const hasImage = (src?: string | null): src is string => !!src;

const ProductImage = ({ product }: { product: StoreProduct }) => {
  const [errored, setErrored] = useState(false);

  if (!hasImage(product.image) || errored) {
    return (
      <div
        data-store-image
        className="flex h-full w-full items-center justify-center bg-muted"
      >
        <ImageIcon className="size-14 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      data-store-image
      src={product.image}
      alt={product.payment_request.item_name}
      className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
      onError={() => setErrored(true)}
    />
  );
};

const StoreSection = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [liveProducts, setLiveProducts] = useState<StoreProduct[]>([]);
  const [recommendations, setRecommendations] =
    useState<BuyerRecommendations | null>(null);

  useEffect(() => {
    let ignore = false;

    api
      .get<{ products: StoreProduct[] }>("/public/store-products")
      .then((response) => {
        if (!ignore && response.data.products?.length) {
          setLiveProducts(response.data.products);
        }
      })
      .catch(() => {
        if (!ignore) setLiveProducts([]);
      });

    api
      .get<BuyerRecommendations>("/public/recommendations")
      .then((response) => {
        if (!ignore) setRecommendations(response.data);
      })
      .catch(() => {
        if (!ignore) setRecommendations(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const products = useMemo(
    () => {
      const source = liveProducts.length > 0 ? liveProducts : store_products;
      const seen = new Set<string>();

      return source.filter((product) => {
        const key = [
          product.vendor.id || product.vendor.business_name,
          product.payment_request.item_name.trim().toLowerCase(),
          product.payment_request.amount,
        ].join("|");

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    [liveProducts],
  );

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

      <div
        data-store-animate
        className="mx-auto mt-8 grid max-w-5xl gap-4 rounded-2xl border border-primary/15 bg-primary/[0.03] p-4 shadow-[0_18px_60px_-40px_rgba(14,30,86,0.4)] sm:p-5 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="flex gap-3">
          <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">AI buyer recommendations</h3>
              <Badge variant={recommendations?.summary.ai_powered ? "default" : "secondary"}>
                {recommendations?.summary.ai_powered ? "AI guided" : "Data guided"}
              </Badge>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              {recommendations?.summary.summary ||
                "ProofPay ranks products using trust score, completed sales, and recent listings so buyers can start with safer options."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          {(recommendations?.most_trusted?.length
            ? recommendations.most_trusted.slice(0, 2)
            : products.slice(0, 2)
          ).map((product) => (
            <Link
              key={`rec-${product.id}`}
              href={product.public_slug ? `/r/${product.public_slug}` : "#store"}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-4 py-3 transition hover:border-primary/40"
            >
              <div>
                <p className="font-medium">{product.payment_request.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.vendor.business_name} · {product.vendor.completed_transactions} sales
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <TrendingUp className="size-3" />
                {product.trust.score}/100
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {products.map((product) => {
          const href = product.public_slug
            ? `/r/${product.public_slug}`
            : `/vendors/${product.vendor.id || product.id.split("-").slice(0, 2).join("-")}`;

          return (
          <Link
            key={product.id}
            href={href}
            title={`View ${product.payment_request.item_name} product details`}
            data-store-animate
            data-store-card
            className="group/card block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
          >
          <Card
            className="h-full overflow-hidden border border-border/70 bg-background/80 pt-0 shadow-[0_20px_60px_-30px_rgba(14,30,86,0.35)] backdrop-blur-sm transition group-hover/card:-translate-y-1 group-hover/card:shadow-[0_24px_70px_-34px_rgba(14,30,86,0.45)]"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              <ProductImage product={product} />
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
                <Badge data-store-badge variant="secondary">
                  {product.public_slug ? "Open checkout" : "View vendor"}
                </Badge>
              </div>
            </CardHeader>

          </Card>
          </Link>
          );
        })}
      </div>
    </section>
  );
};

export default StoreSection;

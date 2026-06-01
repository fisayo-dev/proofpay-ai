"use client";

import { Badge } from "../ui/badge";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowUpRight, ShoppingCart } from "lucide-react";
import NetBackground from "@/utils/net-background";
import Link from "next/link";
import { useRef } from "react";
import { useHomeGsap } from "./use-home-gsap";

const Hero = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleWords = [
    "Verify",
    "your",
    "favourite",
    "vendors",
    "before",
    "making",
    "payments.",
  ];

  useHomeGsap(rootRef, (gsap, ScrollTrigger, prefersReducedMotion) => {
    if (prefersReducedMotion) {
      gsap.set("[data-hero-animate]", { clearProps: "all" });
      return;
    }

    const heroTimeline = gsap.timeline({
      defaults: { duration: 0.8, ease: "power3.out" },
    });

    heroTimeline
      .from("[data-hero-badge]", {
        autoAlpha: 0,
        y: -20,
        scale: 0.9,
        rotate: -3,
      })
      .from(
        ".hero-word",
        {
          autoAlpha: 0,
          yPercent: 120,
          rotateX: -70,
          transformOrigin: "50% 100%",
          stagger: { each: 0.055, from: "center" },
        },
        "-=0.35",
      )
      .from(
        "[data-hero-copy]",
        { autoAlpha: 0, y: 24, filter: "blur(8px)" },
        "-=0.25",
      )
      .from(
        "[data-hero-action]",
        {
          autoAlpha: 0,
          y: 22,
          scale: 0.92,
          stagger: 0.12,
          ease: "back.out(1.8)",
        },
        "-=0.25",
      )
      .from(
        "[data-hero-chip]",
        {
          autoAlpha: 0,
          scale: 0.65,
          y: 28,
          stagger: 0.1,
          ease: "elastic.out(1, 0.7)",
        },
        "-=0.6",
      );

    gsap.to("[data-hero-chip]", {
      y: (index) => (index % 2 === 0 ? -14 : 14),
      x: (index) => (index === 1 ? 10 : -8),
      rotate: (index) => (index - 1) * 4,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.25,
    });

    gsap.to("[data-hero-net]", {
      yPercent: 18,
      scale: 1.08,
      ease: "none",
      scrollTrigger: {
        trigger: rootRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
      animation: gsap.to("[data-hero-content]", {
        yPercent: 10,
        autoAlpha: 0.45,
        ease: "none",
      }),
    });
  }, []);

  return (
    <div ref={rootRef} className="relative overflow-hidden">
      <div data-hero-net>
        <NetBackground />
      </div>

      <div
        data-hero-content
        className="relative h-100 grid place-content-center gap-6 px-4 text-center"
      >
        <Badge
          data-hero-animate
          data-hero-badge
          className="pr-5 mx-auto bg-background text-foreground border border-foreground/30"
        >
          <Image
            alt="Kora Icon"
            height={32}
            width={32}
            src="/images/kora-logo.png"
          />
          <span>Payments Powered by Kora</span>
        </Badge>

        <div className="grid space-y-4">
          <h2 className="text-4xl sm:text-5xl md:text-6xl max-w-5xl md:max-w-4xl font-semibold">
            {titleWords.map((word) => (
              <span
                key={word}
                className="inline-block overflow-hidden align-bottom"
              >
                <span
                  className={`hero-word inline-block pr-2 ${
                    word === "favourite" ? "text-primary font-extrabold" : ""
                  }`}
                >
                  {word}
                </span>
              </span>
            ))}
          </h2>

          <p
            data-hero-animate
            data-hero-copy
            className="text-muted-foreground sm:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Discover trusted vendors, avoid scams, and shop with confidence
            using real customer insights and verified business information.
          </p>
        </div>

        <div className="grid md:flex items-center justify-center gap-2 md:gap-4">
          <Link data-hero-animate data-hero-action href="/vendors/signup">
            <Button>
              <ShoppingCart />
              <span>Start Shopping</span>
            </Button>
          </Link>

          <Link data-hero-animate data-hero-action href="/vendors/signup">
            <Button variant="outline">
              <ArrowUpRight />
              <span>Sell your products</span>
            </Button>
          </Link>
        </div>
      </div>

      <div
        data-hero-animate
        data-hero-chip
        className="pointer-events-none absolute left-5 top-32 hidden rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-medium shadow-lg shadow-primary/5 backdrop-blur md:block"
      >
        98 trust score
      </div>
      <div
        data-hero-animate
        data-hero-chip
        className="pointer-events-none absolute right-8 top-48 hidden rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-medium shadow-lg shadow-primary/5 backdrop-blur lg:block"
      >
        Vendor verified
      </div>
      <div
        data-hero-animate
        data-hero-chip
        className="pointer-events-none absolute bottom-14 left-1/2 hidden -translate-x-1/2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-medium shadow-lg shadow-primary/5 backdrop-blur sm:block"
      >
        Secure Kora checkout
      </div>
    </div>
  );
};

export default Hero;

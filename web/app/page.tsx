"use client";

import { useSyncExternalStore } from "react";
import { getCachedSession } from "@/lib/session";
import Faq from "@/components/home/faq";
import Features from "@/components/home/features";
import Hero from "@/components/home/hero";
import PriceTier from "@/components/home/price-tier";
import { SiteFooter } from "@/components/home/site-footer";
import StoreSection from "@/components/home/store-section";
import VendorSection from "@/components/home/vendor-section";

export default function Home() {
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );

  return (
    <div>
      <Hero />
      <Features />
      <VendorSection />
      <StoreSection />
      {!session && <PriceTier />}
      <PriceTier />
      <Faq />
      <SiteFooter />
    </div>
  );
}

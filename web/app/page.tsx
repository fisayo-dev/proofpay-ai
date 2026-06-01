import Features from "@/components/home/features";
import Hero from "@/components/home/hero";
import { SiteFooter } from "@/components/home/site-footer";
import StoreSection from "@/components/home/store-section";
import VendorSection from "@/components/home/vendor-section";

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <VendorSection />
      <StoreSection />
      <SiteFooter />
    </div>
  );
}

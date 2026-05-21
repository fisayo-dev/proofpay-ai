import { Badge } from "../ui/badge";
import Image from "next/image";
import { Button } from "../ui/button";
import { Compass, ShoppingCart } from "lucide-react";
import NetBackground from "@/utils/net-background";

const Hero = () => {
  return (
    <div className="">
      <NetBackground />
      <div className="h-100 grid place-content-center text-center gap-6">
        <Badge className="pr-5 mx-auto bg-background text-foreground border border-foreground/30">
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
            Verify your{" "}
            <span className="text-primary font-extrabold">favourite</span>{" "}
            vendors before making payments.
          </h2>

          <p className="text-muted-foreground sm:text-base max-w-2xl mx-auto leading-relaxed">
            Discover trusted vendors, avoid scams, and shop with confidence
            using real customer insights and verified business information.
          </p>
        </div>

        <div className="grid md:flex items-center justify-center gap-2 md:gap-4">
          <Button>
            <ShoppingCart className="text-white" />
            <span>Start Shopping</span>
          </Button>

          <Button variant="outline">
            <Compass />
            <span>Explore Store</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;

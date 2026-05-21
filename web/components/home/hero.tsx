import { Badge } from "../ui/badge";
import Image from "next/image";
import { Button } from "../ui/button";
import { GlassWaterIcon, Lightbulb, ShoppingCart } from "lucide-react";

const Hero = () => {
  return (
    <div className="">
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
        <div className="grid space-y-2">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium max-w-5xl md:max-w-4xl">
            Verify your{" "}
            <span className="text-primary font-extrabold">favourite</span>{" "}
            vendors before making payments.
          </h2>
          <p>Lorem ispum</p>
        </div>
        <div className="grid md:flex items-center justify-center gap-2 md:gap-4">
          <Button>
            <ShoppingCart className="text-white" />
            <span>Start Shopping</span>
          </Button>
          <Button variant="outline">
            <Lightbulb />
            <span>Explore store</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;

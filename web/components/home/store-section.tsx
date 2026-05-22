import Image from "next/image";
import { WalletIcon } from "lucide-react";
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

const StoreSection = () => {
  return (
    <section id="store" className="relative pt-20 sm:pt-24">
      <div className="absolute inset-x-0 top-8 -z-10 mx-auto h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="space-y-5 text-center">
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
            className="overflow-hidden border border-border/70 bg-background/80 pt-0 shadow-[0_20px_60px_-30px_rgba(14,30,86,0.35)] backdrop-blur-sm"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              <Image
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
                <Badge className="bg-success text-success-foreground">
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
                <Badge variant="secondary" className="shrink-0">
                  {product.trust.score}/100
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{product.vendor.social_handle}</Badge>
                <Badge variant="outline">
                  {product.vendor.completed_transactions} completed sales
                </Badge>
              </div>
            </CardHeader>

            <CardFooter className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/40">
              <Button className="w-full">
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

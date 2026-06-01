import {
  BadgeCheck,
  FileSearch,
  Gauge,
  LockKeyhole,
  MessageSquareWarning,
  ReceiptText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Vendor identity checks",
    description:
      "Match business details, social handles, and profile signals before a buyer commits money.",
    icon: BadgeCheck,
    stat: "Verified profiles",
  },
  {
    title: "Trust score at a glance",
    description:
      "Show a clear score with the evidence behind it, so good vendors are easy to recognize.",
    icon: Gauge,
    stat: "0-100 rating",
  },
  {
    title: "Payment request review",
    description:
      "Review the item, amount, vendor, and delivery method together before the checkout step.",
    icon: ReceiptText,
    stat: "Order context",
  },
  {
    title: "Risk signals",
    description:
      "Flag incomplete profiles, unusual amounts, disputes, and thin transaction history early.",
    icon: MessageSquareWarning,
    stat: "Early warnings",
  },
  {
    title: "Buyer-ready summaries",
    description:
      "Turn payment history and vendor behavior into concise explanations buyers can act on.",
    icon: FileSearch,
    stat: "Plain evidence",
  },
  {
    title: "Secure payment flow",
    description:
      "Keep checkout tied to the reviewed vendor and order details through a focused payment path.",
    icon: LockKeyhole,
    stat: "Kora powered",
  },
] as const;

const Features = () => {
  return (
    <section id="features" className="pt-20 sm:pt-24">
      <div className="grid gap-10 lg:items-start">
        <div className="mx-auto space-y-4 text-center">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything a buyer needs to judge a vendor before paying.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Proof Pay keeps the decision practical: who is selling, what is
            being paid for, how strong the trust evidence is, and what needs a
            second look.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="border border-border/70 bg-background shadow-[0_18px_50px_-36px_rgba(14,30,86,0.32)]"
              >
                <CardHeader className="gap-4 px-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-primary">
                      <FeatureIcon className="size-5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="leading-6">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="px-5">
                  <div className="border-t border-border/70 pt-4 text-sm font-medium text-foreground">
                    {feature.stat}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

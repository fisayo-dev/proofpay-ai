"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrainCircuit, Lightbulb } from "lucide-react";
import { getCachedSession } from "@/lib/session";
import { getVendorAvatarUrl } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/axios";

type VendorAnalytics = {
  trust_score: number;
  completed_transactions: number;
  total_requests: number;
  paid_count: number;
  pending_count: number;
  failed_count: number;
  dispute_count: number;
  completion_rate: number;
  average_amount_naira: number;
  average_time_to_payment_seconds: number | null;
  badge?: {
    label: string;
    icon: string;
    description: string;
  };
};

type VendorAIAdvice = {
  summary: string;
  suggestions: string[];
  ai_powered: boolean;
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "No paid data yet";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getStatusBarWidth = (count: number, total: number) => {
  if (total <= 0) return 0;
  return clampPercent(Math.round((count / total) * 100));
};

const ProfilePage = () => {
  const router = useRouter();
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [aiAdvice, setAiAdvice] = useState<VendorAIAdvice | null>(null);

  useEffect(() => {
    if (session === null) {
      router.push("/vendors/signup");
    }
  }, [session, router]);

  useEffect(() => {
    if (!session?.vendor_id) return;

    let ignore = false;
    api
      .get<VendorAnalytics>(`/vendors/${session.vendor_id}/analytics`)
      .then((response) => {
        if (!ignore) setAnalytics(response.data);
      })
      .catch(() => {
        if (!ignore) setAnalytics(null);
      });

    api
      .get<VendorAIAdvice>(`/vendors/${session.vendor_id}/ai-advice`)
      .then((response) => {
        if (!ignore) setAiAdvice(response.data);
      })
      .catch(() => {
        if (!ignore) setAiAdvice(null);
      });

    return () => {
      ignore = true;
    };
  }, [session?.vendor_id]);

  if (!session) return null;

  const avatarUrl = getVendorAvatarUrl([
    session.vendor_id || session.user_id || "",
    session.business_name || session.role,
    session.full_name,
  ]);
  const isVendor = session.role === "vendor";
  const trustScore = clampPercent(
    Math.round(analytics?.trust_score ?? session.trust_score ?? 0),
  );
  const completionPercent = clampPercent(
    Math.round((analytics?.completion_rate ?? 0) * 100),
  );
  const paidCount = analytics?.paid_count ?? 0;
  const pendingCount = analytics?.pending_count ?? 0;
  const failedCount = analytics?.failed_count ?? 0;
  const disputeCount = analytics?.dispute_count ?? 0;
  const totalRequests =
    analytics?.total_requests ?? paidCount + pendingCount + failedCount;
  const statusTotal = Math.max(
    totalRequests,
    paidCount + pendingCount + failedCount,
    1,
  );
  const averageOrderValue = analytics?.average_amount_naira ?? 0;
  const averagePaymentTime =
    analytics?.average_time_to_payment_seconds ?? null;
  const statusBreakdown = [
    {
      label: "Paid",
      count: paidCount,
      className: "bg-emerald-500",
      textClassName: "text-emerald-700",
    },
    {
      label: "Pending",
      count: pendingCount,
      className: "bg-amber-500",
      textClassName: "text-amber-700",
    },
    {
      label: "Failed",
      count: failedCount,
      className: "bg-red-500",
      textClassName: "text-red-700",
    },
  ];

  return (
    <section className="mx-auto space-y-6 pb-20 sm:pb-24">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Profile
        </h1>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          {isVendor
            ? "Your vendor account, trust score, and payment performance."
            : "Your buyer account details."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] items-start">
      <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <Avatar className="size-16 sm:size-20 shadow-sm">
              <AvatarImage
                src={avatarUrl}
                alt={`${session.full_name} account avatar`}
              />
              <AvatarFallback>
                {session.full_name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-medium">
              {session.full_name}
            </CardTitle>
            {isVendor && analytics?.badge ? (
              <Badge variant="outline" className="w-fit">
                {analytics.badge.label}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            <div>
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </span>
              <span>{session.email}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Business name
              </span>
              <span>{session.business_name || "Buyer account"}</span>
            </div>
            {session.role === "vendor" && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subscription
                </span>
                <span className="flex items-center gap-2">
                  {session.subscription_plan === "pro" ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Pro Plan
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
                      Free Plan
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {isVendor ? (
            <div className="flex gap-3 flex-col sm:flex-row">
              <Button variant="outline" onClick={() => router.push("/vendors/products")}>
                View Products
              </Button>
              <Button onClick={() => router.push("/vendors/new-product")}>
                Create new product
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => router.push("/#store")}>
              Browse store
            </Button>
          )}
        </CardContent>
      </Card>

      {isVendor ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Trust score
                </p>
                <p className="mt-2 text-3xl font-semibold">{trustScore}/100</p>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Completion rate
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {completionPercent}%
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Paid requests
                </p>
                <p className="mt-2 text-3xl font-semibold">{paidCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Pending requests
                </p>
                <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary/3">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BrainCircuit className="size-4" />
                  </span>
                  <div>
                    <CardTitle className="text-xl">ProofPay AI Advisor</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Tailored suggestions to improve buyer trust and conversion.
                    </p>
                  </div>
                </div>
                <Badge variant={aiAdvice?.ai_powered ? "default" : "secondary"}>
                  {aiAdvice?.ai_powered ? "AI powered" : "Data guided"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm leading-7 text-muted-foreground">
                AI-powered suggestions to improve your vendor profile.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(aiAdvice?.suggestions?.length
                  ? aiAdvice.suggestions
                  : [
                      "Keep your profile complete and consistent with your bank account name.",
                      "Complete more small Kora-verified transactions to build history.",
                      "Use clear item photos, delivery method, and buyer communication.",
                    ]
                ).map((suggestion) => (
                  <div
                    key={suggestion}
                    className="flex gap-3 rounded-lg border border-border/70 bg-background p-4 text-sm leading-6"
                  >
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-xl">Trust performance</CardTitle>
                <p className="text-sm text-muted-foreground">
                  A quick view of how buyers should read this vendor account.
                </p>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Current trust score</span>
                    <span className="font-semibold">{trustScore}/100</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${trustScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <span>0 riskier</span>
                    <span>50 review</span>
                    <span>100 trusted</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Completed transactions
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {analytics?.completed_transactions ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Total requests
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {totalRequests}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-xl">Request status breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Paid, pending, and failed payment requests.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4">
                {statusBreakdown.map((status) => {
                  const width = getStatusBarWidth(status.count, statusTotal);

                  return (
                    <div key={status.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{status.label}</span>
                        <span className={status.textClassName}>
                          {status.count} / {statusTotal}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${status.className}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Disputes</span>
                    <span className="font-semibold text-destructive">
                      {disputeCount}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Lower dispute count improves buyer confidence and future
                    trust scoring.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Average order value
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  NGN {averageOrderValue.toLocaleString()}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{
                      width: `${clampPercent(Math.round(averageOrderValue / 1000))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Visual scale increases as average order value rises.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Average time to payment
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatDuration(averagePaymentTime)}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${averagePaymentTime ? clampPercent(100 - Math.round(averagePaymentTime / 60)) : 8}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Faster payment completion creates a stronger sales signal.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
      </div>
    </section>
  );
};

export default ProfilePage;

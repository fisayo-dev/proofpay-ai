"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "No paid data yet";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

const ProfilePage = () => {
  const router = useRouter();
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);

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

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-20 sm:pb-24">
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

      <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-20 shadow-sm">
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
          </div>

          {isVendor ? (
            <Button variant="outline" onClick={() => router.push("/vendors/new-product")}>
              Create new product
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push("/#store")}>
              Browse store
            </Button>
          )}
        </CardContent>
      </Card>

      {isVendor ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Trust score
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {analytics?.trust_score ?? session.trust_score ?? 0}/100
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Completion rate
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {Math.round((analytics?.completion_rate ?? 0) * 100)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Paid requests
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {analytics?.paid_count ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Pending requests
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {analytics?.pending_count ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 sm:col-span-2">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Average order value
              </p>
              <p className="mt-2 text-3xl font-semibold">
                NGN {(analytics?.average_amount_naira ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 sm:col-span-2">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Average time to payment
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatDuration(analytics?.average_time_to_payment_seconds ?? null)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
};

export default ProfilePage;

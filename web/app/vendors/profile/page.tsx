"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCachedSession } from "@/lib/session";
import { getVendorAvatarUrl } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ProfilePage = () => {
  const router = useRouter();
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );

  useEffect(() => {
    if (session === null) {
      router.push("/vendors/signup");
    }
  }, [session, router]);

  if (!session) return null;

  const avatarUrl = getVendorAvatarUrl([
    session.vendor_id || session.user_id || "",
    session.business_name || session.role,
    session.full_name,
  ]);
  const isVendor = session.role === "vendor";

  return (
    <section className="mx-auto max-w-2xl space-y-6 pb-20 sm:pb-24">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Profile
        </h1>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          Your vendor account details.
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
    </section>
  );
};

export default ProfilePage;

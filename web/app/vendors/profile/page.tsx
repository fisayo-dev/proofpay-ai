"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCachedSession } from "@/lib/session";
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
          <CardTitle className="text-3xl font-medium">
            {session.full_name}
          </CardTitle>
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
              <span>{session.business_name}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Vendor ID
              </span>
              <span className="font-mono text-xs">{session.vendor_id}</span>
            </div>
          </div>

          <Button variant="outline" onClick={() => router.push("/vendors/new-product")}>
            Create new product
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default ProfilePage;

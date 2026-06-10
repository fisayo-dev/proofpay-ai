"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RequestErrorStateProps = {
  title: string;
  description: string;
  retryLabel?: string;
  homeLabel?: string;
  homeHref?: string;
  onRetry?: () => void;
};

const RequestErrorState = ({
  title,
  description,
  retryLabel = "Try again",
  homeLabel = "Go home",
  homeHref = "/",
  onRetry,
}: RequestErrorStateProps) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }

    window.location.reload();
  };

  return (
    <section className="app-container flex min-h-[calc(100vh-5rem)] items-center justify-center py-8 sm:py-12">
      <Card className="w-full max-w-2xl border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
        <CardHeader className="items-center space-y-4 px-5 text-center sm:px-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-muted/30">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="mx-auto max-w-lg text-sm leading-7">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 px-5 pb-6 sm:flex-row sm:justify-center sm:px-8">
          <Button type="button" onClick={handleRetry}>
            <RotateCcw className="size-4" />
            {retryLabel}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={homeHref}>
              <Home className="size-4" />
              {homeLabel}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default RequestErrorState;

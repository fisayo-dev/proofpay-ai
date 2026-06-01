"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { getPaymentStatus } from "@/lib/actions/payment-requests";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentStatusResponse } from "@/types/payment-request";

type PaymentState = "loading" | "pending" | "success" | "failed";

type PaymentCallbackStatusProps = {
  paymentId: string;
};

const POLL_INTERVAL_MS = 4000;

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
};

const normalizeStatus = (payment?: PaymentStatusResponse | null) => {
  return (
    payment?.transaction?.payment_status ||
    payment?.status ||
    "pending"
  ).toLowerCase();
};

const getPaymentState = (
  payment: PaymentStatusResponse | null,
  requestError: string,
): PaymentState => {
  if (requestError) {
    return "failed";
  }

  if (!payment) {
    return "loading";
  }

  const status = normalizeStatus(payment);

  if (["success", "successful", "paid", "completed"].includes(status)) {
    return "success";
  }

  if (["failed", "failure", "cancelled", "canceled", "error"].includes(status)) {
    return "failed";
  }

  return "pending";
};

const getFailureMessage = (
  payment: PaymentStatusResponse | null,
  requestError: string,
) => {
  return (
    payment?.transaction?.error_message ||
    payment?.transaction?.message ||
    payment?.error_message ||
    payment?.message ||
    requestError ||
    "This payment could not be completed."
  );
};

const PaymentCallbackStatus = ({ paymentId }: PaymentCallbackStatusProps) => {
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [requestError, setRequestError] = useState("");
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const paymentState = useMemo(
    () => getPaymentState(payment, requestError),
    [payment, requestError],
  );

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const pollPaymentStatus = async () => {
      try {
        const nextPayment = await getPaymentStatus(paymentId);

        if (!isMounted) {
          return;
        }

        setPayment(nextPayment);
        setRequestError("");
        setLastCheckedAt(new Date());

        const nextState = getPaymentState(nextPayment, "");

        if (nextState === "pending") {
          timeoutId = setTimeout(pollPaymentStatus, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRequestError(
          getFriendlyApiErrorMessage(
            error,
            "We could not check the payment status right now. Please try again.",
          ),
        );
        setLastCheckedAt(new Date());
      }
    };

    pollPaymentStatus();

    return () => {
      isMounted = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [paymentId]);

  const statusLabel = normalizeStatus(payment);
  const isPolling = paymentState === "loading" || paymentState === "pending";
  const formattedAmount = payment
    ? formatCurrency(payment.amount, payment.currency)
    : null;

  const stateCopy = {
    loading: {
      Icon: Loader2,
      iconClassName: "text-primary animate-spin",
      title: "Checking payment",
      description: "We are confirming the latest status for this transaction.",
    },
    pending: {
      Icon: Clock3,
      iconClassName: "text-primary",
      title: "Payment pending",
      description:
        "Your payment is still being processed. This page will keep checking automatically.",
    },
    success: {
      Icon: CheckCircle2,
      iconClassName: "text-primary",
      title: "Payment successful",
      description:
        "Your payment has been confirmed. The vendor can now process your order.",
    },
    failed: {
      Icon: AlertCircle,
      iconClassName: "text-destructive",
      title: "Payment failed",
      description: getFailureMessage(payment, requestError),
    },
  }[paymentState];

  const StatusIcon = stateCopy.Icon;

  return (
    <main className="app-container flex min-h-[calc(100vh-5rem)] items-center justify-center py-8 sm:py-12">
      <Card className="w-full max-w-2xl border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
        <CardHeader className="items-center space-y-4 px-5 text-center sm:px-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-muted/30">
            <StatusIcon className={` size-9 ${stateCopy.iconClassName}`} />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              {stateCopy.title}
            </CardTitle>
            <CardDescription className="mx-auto max-w-lg text-sm leading-7">
              {stateCopy.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-5 pb-6 sm:px-8">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ReceiptText className="mt-1 size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Payment request
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold">
                    {payment?.item_name || "Payment confirmation"}
                  </p>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">{formattedAmount || "..."}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{statusLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reference</p>
                    <p className="truncate font-medium">
                      {payment?.kora_reference || paymentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last checked</p>
                    <p className="font-medium">
                      {lastCheckedAt
                        ? lastCheckedAt.toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isPolling ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Checking again shortly</span>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Button asChild>
              <Link href="/">Return home</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RotateCcw className="size-4" />
              Check again
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default PaymentCallbackStatus;

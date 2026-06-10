"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "react-confetti";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import {
  getPaymentStatus,
  verifyKoraCheckoutPayment,
} from "@/lib/actions/payment-requests";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import { toPng } from "html-to-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
const MAX_VERIFY_ATTEMPTS = 3;

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 1);
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

  if (
    ["failed", "failure", "cancelled", "canceled", "error"].includes(status)
  ) {
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
  const verifyAttemptsRef = useRef(0);

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
        // console.log("Payment status: ", nextPayment);

        if (!isMounted) {
          return;
        }

        setPayment(nextPayment);
        setRequestError("");
        setLastCheckedAt(new Date());

        let nextState = getPaymentState(nextPayment, "");

        if (
          nextState === "pending" &&
          verifyAttemptsRef.current < MAX_VERIFY_ATTEMPTS
        ) {
          try {
            verifyAttemptsRef.current += 1;
            await verifyKoraCheckoutPayment(
              paymentId,
              nextPayment.kora_reference,
            );
            const verifiedPayment = await getPaymentStatus(paymentId);

            if (!isMounted) {
              return;
            }

            setPayment(verifiedPayment);
            setLastCheckedAt(new Date());
            nextState = getPaymentState(verifiedPayment, "");
          } catch {
            nextState = "pending";
          }
        }

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

  const showConfetti = paymentState === "success";

  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const captureAndDownload = useCallback(async () => {
    if (!receiptRef.current || !payment) return;

    try {
      const dataUrl = await toPng(receiptRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#fff",
      });
      const link = document.createElement("a");
      link.download = `receipt-${payment.kora_reference || paymentId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // fallback — image capture failed, user can still see the receipt
    }
  }, [payment, paymentId]);

  useEffect(() => {
    if (!showReceipt) return;
    const id = setTimeout(() => {
      captureAndDownload();
    }, 500);
    return () => clearTimeout(id);
  }, [showReceipt, captureAndDownload]);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="app-container flex min-h-[calc(100vh-5rem)] items-center justify-center py-8 sm:py-12">
      {showConfetti && windowSize.width > 0 ? (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={350}
          recycle={false}
          gravity={0.2}
          initialVelocityY={{ min: -20, max: -10 }}
          colors={[
            "#2563eb",
            "#7c3aed",
            "#06b6d4",
            "#10b981",
            "#f59e0b",
            "#ef4444",
          ]}
          style={{ position: "fixed" }}
        />
      ) : null}
      <Card className="w-full max-w-xl border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
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
            {payment && paymentState === "success" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReceipt(true)}
              >
                <ReceiptText className="size-4" />
                Download receipt
              </Button>
            ) : null}
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

      <AlertDialog open={showReceipt} onOpenChange={setShowReceipt}>
        <AlertDialogContent
          className="sm:max-w-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Receipt preview</AlertDialogTitle>
            <AlertDialogDescription>
              Your receipt will be downloaded automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div
            ref={receiptRef}
            className="rounded-xl border bg-white p-5 text-sm text-gray-900"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <div className="text-center">
              <p className="text-base font-semibold">Payment Receipt</p>
              <p className="text-xs text-gray-500">{payment?.item_name}</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold">{formattedAmount}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Status</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  {statusLabel}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Reference</span>
                <span className="max-w-[180px] truncate font-medium">
                  {payment?.kora_reference || paymentId}
                </span>
              </div>
              {payment?.buyer_name ? (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Paid by</span>
                  <span className="font-medium">{payment.buyer_name}</span>
                </div>
              ) : null}
              {payment?.transaction?.payment_method ? (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium">{payment.transaction.payment_method}</span>
                </div>
              ) : null}
              {payment?.transaction?.paid_at ? (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Paid at</span>
                  <span className="font-medium">
                    {new Date(payment.transaction.paid_at).toLocaleString("en-NG")}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">
                  {payment ? new Date(payment.created_at).toLocaleString("en-NG") : ""}
                </span>
              </div>
            </div>
            <div className="mt-4 border-t-2 border-dashed pt-3 text-center text-xs text-gray-400">
              ProofPay &bull; {payment?.payment_request_id}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={captureAndDownload}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default PaymentCallbackStatus;

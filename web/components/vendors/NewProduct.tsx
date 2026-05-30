"use client";

import { ChangeEvent, FormEvent, useSyncExternalStore, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Plus,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { createPaymentRequest } from "@/lib/actions/payment-requests";
import { getCachedVendorId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DELIVERY_METHODS = [
  "CU hostel delivery",
  "Campus pickup",
  "Lagos city dispatch",
  "Nationwide courier",
] as const;

const CURRENCY = "NGN";
const DEFAULT_DELIVERY_METHOD = DELIVERY_METHODS[0];

type CreatedProduct = {
  name: string;
  description: string;
  publicUrl: string;
};

const getDefaultExpectedDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);

  return date.toISOString().split("T")[0];
};

const NewProductComponent = () => {
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<string>(
    DEFAULT_DELIVERY_METHOD,
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    getDefaultExpectedDate,
  );
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const vendorId = useSyncExternalStore(
    () => () => {},
    () => getCachedVendorId(),
    () => null,
  );

  const amountKobo = (() => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return 0;
    }

    return Math.round(parsedAmount * 100);
  })();

  const formattedAmount = (() => {
    if (!amountKobo) {
      return "NGN 0";
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: 2,
    }).format(amountKobo / 100);
  })();

  const resetMessages = () => {
    setErrorMessage("");
  };

  const getPublicUrl = (publicUrl: string) => {
    try {
      return new URL(publicUrl, window.location.origin).toString();
    } catch {
      return publicUrl;
    }
  };

  const handleCopyPublicUrl = async () => {
    if (!createdProduct) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdProduct.publicUrl);
      toast.success("Public URL copied to clipboard.");
    } catch {
      toast.error("Could not copy the public URL.");
    }
  };

  const handleCreateAnotherProduct = () => {
    setCreatedProduct(null);
    resetMessages();
  };

  const handleInputChange =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(event.target.value);
      if (errorMessage) {
        resetMessages();
      }
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!vendorId) {
      setErrorMessage("Vendor ID is missing. Sign up again to continue.");
      return;
    }

    if (!itemName.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }

    if (!itemDescription.trim()) {
      setErrorMessage("Item description is required.");
      return;
    }

    if (!amount.trim() || amountKobo <= 0) {
      setErrorMessage("Enter a valid amount in naira.");
      return;
    }

    if (!deliveryMethod.trim()) {
      setErrorMessage("Delivery method is required.");
      return;
    }

    if (!expectedDeliveryDate) {
      setErrorMessage("Expected delivery date is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createPaymentRequest({
        vendor_id: vendorId,
        item_name: itemName.trim(),
        item_description: itemDescription.trim(),
        amount_kobo: amountKobo,
        currency: CURRENCY,
        delivery_method: deliveryMethod,
        expected_delivery_date: expectedDeliveryDate,
      });

      setCreatedProduct({
        name: itemName.trim(),
        description: itemDescription.trim(),
        publicUrl: getPublicUrl(res.public_url),
      });
      setItemName("");
      setItemDescription("");
      setAmount("");
      setDeliveryMethod(DEFAULT_DELIVERY_METHOD);
      setExpectedDeliveryDate(getDefaultExpectedDate());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create product.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdProduct) {
    return (
      <section className="mx-auto flex max-w-xl justify-center pb-20 sm:pb-24">
        <Card className="w-full border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
          <CardHeader className="items-center space-y-4 px-5 text-center sm:px-8">
            <div className="flex size-28 items-center justify-center rounded-full mx-auto bg-primary/10">
              <CheckCircle2 className="size-12 md:size-16 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-medium">
                Product request created
              </CardTitle>
              <CardDescription className="text-sm leading-7">
                Your public payment request is live and ready to share.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-5 pb-6 sm:px-8">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Product
              </p>
              <h2
                className="text-2xl font-semibold tracking-tight"
                title={createdProduct.name}
              >
                {createdProduct.name}
              </h2>
              <p
                className="line-clamp-3 text-sm leading-7 text-muted-foreground"
                title={createdProduct.description}
              >
                {createdProduct.description}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="public_url" className="block text-sm font-medium">
                Public URL
              </label>
              <div className="flex gap-2">
                {createdProduct.publicUrl && (
                  <div className="border px-5 py-2 rounded-full w-full flex items-center justify-between">
                    <span className="text-sm truncate">
                      {createdProduct.publicUrl}
                    </span>
                    <div className="flex items-center gap-1 hover:cursor-pointer hover:bg-muted p-2 rounded-full">
                      <Copy className="size-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="w-full">
                <a
                  href={createdProduct.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit public page
                  <ExternalLink className="size-4" />
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCreateAnotherProduct}
              >
                <Plus className="size-4" />
                Create another product
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 pb-20 sm:pb-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Create a product request your buyer can trust.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Publish the item, set the delivery expectation, and generate a clean
            payment request tied to your vendor profile.
          </p>

          <div className="grid gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
            <p className="flex items-center text-xs font-medium text-muted-foreground">
              <Lock className="text-xs mr-2 size-4" />
              <span>SECURE PAYMENT</span>
            </p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground  sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="font-semibold text-foreground text-xl">
                  {itemName.trim() || "Untitled product"}
                </p>
                <span>
                  {itemDescription.length > 200
                    ? itemDescription.slice(0, 200) + "..."
                    : itemDescription}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-between text-sm">
              <div className="flex items-center">
                <Truck className="mr-2 size-4 text-primary" />
                <p>{deliveryMethod}</p>
              </div>
              <span className=" font-semibold text-foreground text-right">
                {formattedAmount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
        <CardHeader className="space-y-3 px-5 sm:px-6">
          <CardTitle className="text-3xl font-medium">New product</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-7">
            Create a payment request for a single item.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-5 pb-6 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="item_name" className="space-y-2 sm:col-span-2">
                <span className="block text-sm font-medium">Item name</span>
                <Input
                  id="item_name"
                  name="item_name"
                  type="text"
                  className="text-sm"
                  placeholder="Black hoodie"
                  value={itemName}
                  onChange={handleInputChange(setItemName)}
                />
              </label>

              <label
                htmlFor="item_description"
                className="space-y-2 sm:col-span-2"
              >
                <span className="block text-sm font-medium">
                  Item description
                </span>
                <Textarea
                  id="item_description"
                  name="item_description"
                  placeholder="Oversized black hoodie, size L"
                  className="min-h-32 rounded-2xl px-5 py-3 text-sm resize-none"
                  value={itemDescription}
                  onChange={handleInputChange(setItemDescription)}
                />
              </label>

              <label htmlFor="amount" className="space-y-2">
                <span className="block text-sm font-medium">
                  Amount in naira
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  className="text-sm"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="7500"
                  value={amount}
                  onChange={handleInputChange(setAmount)}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium">Currency</span>
                <Input value={CURRENCY} disabled />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium">
                  Delivery method
                </span>
                <Select
                  value={deliveryMethod}
                  onValueChange={(value) => {
                    setDeliveryMethod(value);
                    if (errorMessage) {
                      resetMessages();
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-2xl border-input px-5 py-6">
                    <SelectValue placeholder="Choose a delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label htmlFor="expected_delivery_date" className="space-y-2">
                <span className="block text-sm font-medium">
                  Expected delivery date
                </span>
                <Input
                  id="expected_delivery_date"
                  name="expected_delivery_date"
                  type="date"
                  className="text-sm"
                  value={expectedDeliveryDate}
                  onChange={handleInputChange(setExpectedDeliveryDate)}
                />
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !vendorId}
              className="w-full"
            >
              {isSubmitting ? "Creating product..." : "Create product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default NewProductComponent;

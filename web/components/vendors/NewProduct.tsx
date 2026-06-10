"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  useState,
} from "react";
import Confetti from "react-confetti";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Lock,
  MessageCircle,
  Plus,
  QrCode,
  Send,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import {
  createImageUpload,
  createPaymentRequest,
} from "@/lib/actions/payment-requests";
import { getCachedVendorId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QRCodeCanvas } from "qrcode.react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_DELIVERY_METHOD, MAX_IMAGE_BYTES, CURRENCY, DELIVERY_METHODS, SUPPORTED_IMAGE_TYPES } from "@/constants/products";


type CreatedProduct = {
  name: string;
  description: string;
  publicUrl: string;
  imageUrl?: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>(
    DEFAULT_DELIVERY_METHOD,
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    getDefaultExpectedDate,
  );
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(
    {name: "Oraimo headphone", description: "Sleek oraimo headphones", publicUrl: "https://"}
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vendorId = useSyncExternalStore(
    () => () => {},
    () => getCachedVendorId(),
    () => null,
  );

  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadQr = useCallback(() => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "proofpay-qr.png";
    a.click();
  }, []);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleShareToWhatsApp = () => {
    if (!createdProduct) return;
    const text = encodeURIComponent(
      `I just created a payment request for "${createdProduct.name}" on ProofPay. Pay securely here: ${createdProduct.publicUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleShareToTelegram = () => {
    if (!createdProduct) return;
    const text = encodeURIComponent(
      `I just created a payment request for "${createdProduct.name}" on ProofPay.`,
    );
    const url = encodeURIComponent(createdProduct.publicUrl);
    window.open(
      `https://t.me/share/url?url=${url}&text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
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

  const handleFileSelect = (file: File | null) => {
    if (file && !file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file.");
      return;
    }
    setImageFile(file);
    if (errorMessage) {
      resetMessages();
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

    if (imageFile && !SUPPORTED_IMAGE_TYPES.includes(imageFile.type)) {
      setErrorMessage("Upload a JPEG, PNG, or WebP product image.");
      return;
    }

    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Product image must be 5MB or smaller.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedImage = imageFile
        ? await createImageUpload(imageFile)
        : null;
      const uploadedImageUrl = uploadedImage?.image_url;
      const res = await createPaymentRequest({
        vendor_id: vendorId,
        item_name: itemName.trim(),
        item_description: itemDescription.trim(),
        amount_kobo: amountKobo,
        currency: CURRENCY,
        delivery_method: deliveryMethod,
        expected_delivery_date: expectedDeliveryDate,
        image_url: uploadedImageUrl,
      });

      setCreatedProduct({
        name: itemName.trim(),
        description: itemDescription.trim(),
        publicUrl: getPublicUrl(res.public_url),
        imageUrl: uploadedImageUrl ?? undefined,
      });
      setItemName("");
      setItemDescription("");
      setAmount("");
      setImageFile(null);
      setDeliveryMethod(DEFAULT_DELIVERY_METHOD);
      setExpectedDeliveryDate(getDefaultExpectedDate());
    } catch (error) {
      setErrorMessage(
        getFriendlyApiErrorMessage(
          error,
          "We could not create the payment request. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdProduct) {
    return (
      <>
        {windowSize.width > 0 ?
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
        : null}
        <section className="mx-auto flex max-w-xl justify-center pb-20 sm:pb-24">
          <AlertDialog>
          <Card className="w-full border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
            <CardHeader className="relative items-center space-y-4 px-5 text-center sm:px-8">
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="cursor-pointer absolute right-5 top-5 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <QrCode className="size-5" />
                </button>
              </AlertDialogTrigger>
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
                {createdProduct.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={createdProduct.imageUrl}
                    alt={createdProduct.name}
                    className="mb-3 h-44 w-full rounded-xl object-cover"
                  />
                )}
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
                <label
                  htmlFor="public_url"
                  className="block text-sm font-medium"
                >
                  Public URL
                </label>
                <div className="flex gap-2">
                  {createdProduct.publicUrl && (
                    <div className="border px-5 py-2 rounded-full w-full flex items-center justify-between">
                      <span className="text-sm truncate">
                        {createdProduct.publicUrl}
                      </span>
                      <div
                        onClick={() => handleCopyPublicUrl()}
                        className="flex items-center gap-1 hover:cursor-pointer hover:bg-muted p-2 rounded-full"
                      >
                        <Copy className="size-4" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Share via
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleShareToWhatsApp}
                  >
                    <MessageCircle className="size-4 text-[#25D366]" />
                    <span className="hidden sm:block">WhatsApp</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleShareToTelegram}
                  >
                    <Send className="size-4 text-[#0088cc]" />
                    <span className="hidden sm:block">Telegram</span>
                  </Button>
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

          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Scan to pay</AlertDialogTitle>
              <AlertDialogDescription>
                Scan this QR code with your phone to open the payment request
                instantly.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-center py-4">
              <QRCodeCanvas
                ref={qrRef}
                value={createdProduct.publicUrl}
                size={200}
                level="M"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={handleDownloadQr}>
                <Download className="size-4" />
                Download
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </section>
      </>
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
            {imageFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Product preview"
                className="h-40 w-full rounded-xl object-cover"
              />
            ) : null}
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

              <div className="space-y-2 sm:col-span-2">
                <span className="block text-sm font-medium">Product image</span>
                {imageFile ? (
                  <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Product preview"
                      className="h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                      <ImageIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{imageFile.name}</span>
                      <span className="shrink-0">
                        ({(imageFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 px-4 py-10 transition-colors hover:border-primary/50 hover:bg-muted/20"
                  >
                    <Upload className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      PNG, JPG or WebP
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleFileSelect(event.target.files?.[0] ?? null)
                  }
                />
              </div>

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
            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
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

import type { Metadata } from "next";
import { getPublicProduct } from "@/lib/actions/payment-requests";

type Props = {
  children: React.ReactNode;
  params: Promise<{ product_slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product_slug } = await params;

  try {
    const product = await getPublicProduct(product_slug);

    const title = `${product.item.name} | ProofPay AI`;
    const description =
      product.item.description ||
      product.trust.verdict ||
      "Verify before you pay with AI trust scoring.";
    const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://proofpay.ai"}/r/${product_slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: "website",
        siteName: "ProofPay AI",
        images: product.item.image_url
          ? [
              {
                url: product.item.image_url,
                width: 1200,
                height: 630,
                alt: product.item.name,
              },
            ]
          : [
              {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "ProofPay AI",
              },
            ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: product.item.image_url ? [product.item.image_url] : [],
      },
      alternates: { canonical: url },
      robots: { index: true, follow: true },
      other: {
        "product:price:amount": String(product.item.amount),
        "product:price:currency": product.item.currency,
        "product:trust:score": String(product.trust.score ?? ""),
        "product:trust:verdict": product.trust.verdict ?? "",
      },
    };
  } catch {
    return {
      title: "Payment Request | ProofPay AI",
      description:
        "Verify before you pay with AI trust scoring and Kora-powered payment requests.",
      robots: { index: false, follow: false },
    };
  }
}

const ProductLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default ProductLayout;

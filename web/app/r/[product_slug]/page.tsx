import BuyerPublicPage from "@/components/vendors/BuyerPublicPage";
import RequestErrorState from "@/components/shared/request-error-state";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import {
  getPaymentConfigUrl,
  getPublicProduct,
} from "@/lib/actions/payment-requests";

type ProductPageProps = {
  params: Promise<{
    product_slug: string;
  }>;
};

const ProductPage = async ({
  params,
}: ProductPageProps) => {
  const { product_slug } = await params;

  let product: Awaited<ReturnType<typeof getPublicProduct>>;
  let paymentConfig: Awaited<ReturnType<typeof getPaymentConfigUrl>>;

  try {
    product = await getPublicProduct(product_slug);
    paymentConfig = await getPaymentConfigUrl(product.payment_request_id);
  } catch (error) {
    return (
      <RequestErrorState
        title="We could not load this payment request"
        description={getFriendlyApiErrorMessage(
          error,
          "The payment request is temporarily unavailable. Please try again.",
        )}
        retryLabel="Try again"
        homeLabel="Return home"
      />
    );
  }

  return <BuyerPublicPage product={product} paymentConfig={paymentConfig} />;
};

export default ProductPage;

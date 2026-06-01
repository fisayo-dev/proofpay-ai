import BuyerPublicPage from "@/components/vendors/BuyerPublicPage";
import RequestErrorState from "@/components/shared/request-error-state";
import { getFriendlyApiErrorMessage } from "@/lib/api-error";
import {
  getPaymentConfigUrl,
  getPublicProduct,
} from "@/lib/actions/payment-requests";


const ProductPage = async ({
  params,
}: PageProps<"/r/[product_slug]">) => {
  const { product_slug } = await params;
  try {
    const product = await getPublicProduct(product_slug);
    const paymentConfig = await getPaymentConfigUrl(product.payment_request_id);

    return <BuyerPublicPage product={product} paymentConfig={paymentConfig} />;
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
};

export default ProductPage;

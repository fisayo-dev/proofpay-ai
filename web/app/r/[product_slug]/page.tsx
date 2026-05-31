import BuyerPublicPage from "@/components/vendors/BuyerPublicPage";
import { getPaymentConfigUrl, getPublicProduct } from "@/lib/actions/payment-requests";


const ProductPage = async ({
  params,
}: PageProps<"/r/[product_slug]">) => {
  const { product_slug } = await params;
  const product = await getPublicProduct(product_slug);
  const paymentConfig = await getPaymentConfigUrl(product.payment_request_id);

  return <BuyerPublicPage product={product} paymentConfig={paymentConfig} />;
};

export default ProductPage;

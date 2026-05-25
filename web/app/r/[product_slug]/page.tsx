import BuyerPublicPage from "@/components/vendors/BuyerPublicPage";
import { getPublicProduct } from "@/lib/actions/payment-requests";


const ProductPage = async ({
  params,
}: PageProps<"/r/[product_slug]">) => {
  const { product_slug } = await params;
  const product = await getPublicProduct(product_slug);

  return <BuyerPublicPage product={product} />;
};

export default ProductPage;

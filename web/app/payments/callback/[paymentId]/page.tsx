import PaymentCallbackStatus from "@/components/payments/PaymentCallbackStatus";

const PaymentCallbackPage = async ({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) => {
  const { paymentId } = await params;

  return <PaymentCallbackStatus paymentId={paymentId} />;
};

export default PaymentCallbackPage;

import { OrderApprovalModal } from "./order-approval-modal";
import { MerchantSignIn } from "./merchant-sign-in";

import { useMerchantAuth } from "@/lib/merchant-auth";
import { useOrderApprovalStore } from "@/lib/order-approval-store";

/** Opens the approval for the order in view, asking the merchant to sign in first. */
export const OrderApprovalHost = () => {
  const orderId = useOrderApprovalStore((state) => state.orderId);
  const close = useOrderApprovalStore((state) => state.close);
  const token = useMerchantAuth((state) => state.token);

  if (!orderId) return null;
  if (!token) return <MerchantSignIn onClose={close} />;

  return <OrderApprovalModal orderId={orderId} onClose={close} />;
};

import { useEffect } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { useOrderApprovalStore } from "@/lib/order-approval-store";

/**
 * The approval link an agent hands the merchant, which opens the order's modal
 * over the chat rather than standing as a page of its own.
 *
 * PayPal stamps its own reference on whoever it sends back, and checkouts
 * created before the return address moved still arrive here. That visitor is
 * the customer, not the merchant, so they go on to their own receipt.
 */
const OrderApprovalRoute = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const fromPayPal = Boolean(params.get("token"));

  useEffect(() => {
    if (id && !fromPayPal) useOrderApprovalStore.getState().open(id);
  }, [id, fromPayPal]);

  if (id && fromPayPal) {
    return (
      <Navigate
        replace
        to={`/pay/${encodeURIComponent(id)}?${params.toString()}`}
      />
    );
  }

  return <Navigate replace to="/chat" />;
};

export default OrderApprovalRoute;

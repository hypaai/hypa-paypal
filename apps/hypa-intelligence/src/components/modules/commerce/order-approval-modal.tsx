import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import {
  approvalLabels,
  formatApprovalAmount,
  lineTotal,
} from "@hypa/intelligence-core/payment-approval";
import {
  createPaymentLink,
  isPayPalUrl,
  type PaymentLink,
} from "@hypa/intelligence-core/payment-link";
import { Check, Copy, Share2 } from "@/lucide-compat";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api, getApiBaseURL } from "@/lib/api";
import { merchantToken } from "@/lib/merchant-auth";

type ApprovalOrder = {
  orderId: string;
  amount: string;
  currency: string;
  status: "draft" | "approved" | "paid" | "failed" | "cancelled";
  customer: { name: string; contact: string; language?: string | null };
  items: { name: string; qty: number; unitPrice: string }[];
  fee?: { amount: string; currency: string };
  merchantLanguage?: string | null;
};

/**
 * The merchant's approval modal, opened over the chat the order came from.
 * It shows only what the decision needs — who is paying, for what, and how
 * much — because approving here is what makes the order chargeable.
 */
export const OrderApprovalModal = ({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) => {
  const [order, setOrder] = useState<ApprovalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [polls, setPolls] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const labels = approvalLabels(order?.merchantLanguage);
  const money = (amount: string, currency = order?.currency ?? "") =>
    formatApprovalAmount(amount, currency, order?.merchantLanguage);

  const load = useCallback(async () => {
    // The card's own endpoint, like the app's: it carries the merchant's language and the fee,
    // which the plain order record does not.
    const { data } = await api.get<ApprovalOrder>(
      `/commerce/orders/${encodeURIComponent(orderId)}/approval`,
    );

    setOrder(data);
  }, [orderId]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    load()
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : labels.failedBody);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // labels is derived from the order being loaded here.
  }, [orderId, load]);

  const act = async (run: () => Promise<unknown>, fallback: string) => {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      await run();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback);
    } finally {
      setWorking(false);
    }
  };

  const approve = () =>
    act(
      () =>
        api.post(`/commerce/orders/${encodeURIComponent(orderId!)}/approve`),
      labels.failedBody,
    );
  const cancel = () =>
    act(
      () => api.post(`/commerce/orders/${encodeURIComponent(orderId)}/cancel`),
      labels.failedBody,
    );

  /**
   * The customer pays, not the merchant: the server creates the checkout and
   * writes the message in the customer's language, and this hands that text
   * to whatever the merchant uses to reach them. The same order always gets
   * the same checkout back, so a merchant can send it as often as they need.
   */
  const shareLink = async () => {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const current = link ?? (await fetchLink());

      if (navigator.share) await navigator.share({ text: current.message });
      else await copyToClipboard(current.message);
      await load();
    } catch (cause) {
      // A merchant who closes the share sheet has not failed at anything.
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : labels.failedBody);
    } finally {
      setWorking(false);
    }
  };

  const copyLink = async () => {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const current = link ?? (await fetchLink());

      await copyToClipboard(current.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : labels.failedBody);
    } finally {
      setWorking(false);
    }
  };

  const fetchLink = async () => {
    const created = await createPaymentLink({
      baseUrl: getApiBaseURL(),
      token: merchantToken() ?? "",
      orderId,
    });

    if (!isPayPalUrl(created.checkoutUrl)) {
      throw new Error("The checkout link from the API is invalid.");
    }
    setLink(created);

    return created;
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 4000);
  };

  // The merchant waits from the moment the customer holds the link.
  const awaitingPayment = Boolean(link) && order?.status === "approved";

  // The merchant has nothing to press: once the link is out, the order watches
  // itself. Checks start quick and ease off, because each one asks PayPal.
  useEffect(() => {
    if (!awaitingPayment) return;
    const delay = polls < 5 ? 3000 : 10000;
    const timer = window.setTimeout(() => {
      setPolls((count) => count + 1);
      void load().catch(() => undefined);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [awaitingPayment, load, polls]);

  const status = order?.status;

  const note = error
    ? error
    : awaitingPayment
      ? `${copied ? `${labels.linkCopied} ` : ""}${labels.waitingBody}`
      : status === "draft"
        ? labels.reviewBody
        : status === "approved"
          ? labels.approvedBody
          : status === "paid"
            ? labels.paidBody
            : status === "cancelled"
              ? labels.cancelledBody
              : status === "failed"
                ? labels.failedBody
                : "";

  // A settled order says so in a chip, so the title stays the same question.
  const settled =
    status === "approved"
      ? labels.approved
      : status === "cancelled"
        ? labels.cancelled
        : status === "paid"
          ? labels.paid
          : status === "failed"
            ? labels.failed
            : null;

  const heading = loading
    ? labels.working
    : error
      ? labels.failedTitle
      : awaitingPayment
        ? labels.waitingTitle
        : status === "draft"
          ? labels.review
          : status === "approved"
            ? labels.approved
            : status === "paid"
              ? labels.paid
              : status === "cancelled"
                ? labels.cancelled
                : labels.failedTitle;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <div className="flex items-start gap-3 pr-6">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-bold tracking-tight">{heading}</DialogTitle>
            {order ? (
              <p className="truncate text-sm font-normal text-default-500">
                {order.customer.name} · {order.customer.contact}
              </p>
            ) : null}
          </div>
          {settled ? (
            <span className="shrink-0 rounded-full border border-divider px-2.5 py-1 text-xs font-semibold text-default-500">
              {settled}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-[18px]">
          {loading ? (
            <div className="h-28 animate-pulse rounded-[18px] bg-default-100 motion-reduce:animate-none" />
          ) : null}

          {/* One card for the money, so the merchant reads the charge in a single place. */}
          {order ? (
            <div className="rounded-[18px] border border-divider px-4 py-3.5">
              <ul className="space-y-3">
                {order.items.map((item, index) => (
                  <li
                    key={`${item.name}-${index}`}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">
                        {item.name}
                      </p>
                      <p className="text-[13px] tabular-nums text-default-400">
                        {item.qty} × {money(item.unitPrice)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[15px] tabular-nums text-default-500">
                      {money(lineTotal(item.qty, item.unitPrice))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-divider pt-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-default-500">
                    {labels.total}
                  </span>
                  <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums">
                    {money(order.amount)}
                  </span>
                </div>
                {order.fee ? (
                  <div className="mt-2 flex items-baseline justify-between gap-4 text-xs text-default-400">
                    <span>{labels.fee}</span>
                    <span className="tabular-nums">
                      {money(order.fee.amount, order.fee.currency)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {note ? (
            <div className="flex items-start gap-2">
              {awaitingPayment && !error ? (
                <span className="relative mt-[7px] flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
              ) : null}
              <p
                className={`text-sm leading-5 ${error ? "text-foreground" : "text-default-500"}`}
                role={error ? "alert" : undefined}
              >
                {note}
              </p>
            </div>
          ) : null}

          {!loading && order ? (
            <div className="flex flex-col gap-1">
              {status === "draft" ? (
                <>
                  <Button
                    className="h-[52px] text-base font-semibold"
                    color="primary"
                    isLoading={working}
                    radius="lg"
                    onPress={() => void approve()}
                  >
                    {labels.approve}
                  </Button>
                  <Button
                    className="h-11 font-medium text-default-500"
                    isDisabled={working}
                    radius="lg"
                    variant="light"
                    onPress={() => void cancel()}
                  >
                    {labels.cancel}
                  </Button>
                </>
              ) : null}
              {/* An approved order can be sent to the customer as often as needed. */}
              {status === "approved" ? (
                <>
                  <Button
                    className="h-[52px] text-base font-semibold"
                    color="primary"
                    isLoading={working}
                    radius="lg"
                    startContent={working ? undefined : <Share2 size={18} />}
                    onPress={() => void shareLink()}
                  >
                    {labels.sharePaymentLink}
                  </Button>
                  <Button
                    className="h-11 font-medium text-default-500"
                    isDisabled={working}
                    radius="lg"
                    startContent={
                      copied ? <Check size={15} /> : <Copy size={15} />
                    }
                    variant="light"
                    onPress={() => void copyLink()}
                  >
                    {copied ? labels.linkCopied : labels.copyLink}
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

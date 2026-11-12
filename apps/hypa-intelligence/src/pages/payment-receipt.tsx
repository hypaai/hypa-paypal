import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { formatApprovalAmount } from "@hypa/intelligence-core/payment-approval";
import { receiptLabels } from "@hypa/intelligence-core/payment-receipt";
import { Check, Loader2, Minus, X } from "@/lucide-compat";

import { api } from "@/lib/api";

type Receipt = {
  status: "draft" | "approved" | "paid" | "failed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | null;
  amount: string;
  currency: string;
  language: string;
  reference: string | null;
  merchant: string | null;
  paidAt: string | null;
};

/** PayPal takes seconds to settle, so the page waits with the customer. */
const POLL_MS = 3000;
const POLL_LIMIT = 8;

/**
 * Where PayPal returns the customer. They have no Hypa account and no reason
 * to meet the merchant's tools, so this page carries none of the app around
 * it. A payment still settling says exactly that: a customer told "received"
 * too early is a customer who pays twice.
 */
const PaymentReceiptPage = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // The capability token is embedded in our PayPal return URL; PayPal adds its
  // own order reference separately and that reference does not authorize reads.
  const [receiptToken] = useState(() => params.get("receipt") ?? "");
  const cancelled = params.get("checkout") === "cancel";

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(Boolean(id && receiptToken));
  const [checking, setChecking] = useState(false);
  const [polls, setPolls] = useState(0);
  const reconcileStarted = useRef(false);

  useLayoutEffect(() => {
    if (!params.has("receipt")) return;
    const next = new URLSearchParams(params);
    next.delete("receipt");
    navigate(
      {
        pathname: location.pathname,
        search: next.toString() ? `?${next}` : "",
        hash: location.hash,
      },
      { replace: true },
    );
  }, [location.hash, location.pathname, navigate, params]);

  const load = useCallback(async () => {
    if (!id || !receiptToken) return;
    const { data } = await api.get<Receipt>(
      `/commerce/receipt/${encodeURIComponent(id)}`,
      { headers: { "X-Receipt-Token": receiptToken } },
    );

    setReceipt(data);
  }, [id, receiptToken]);

  useEffect(() => {
    let active = true;

    const checkReceipt = async () => {
      if (id && receiptToken && !reconcileStarted.current) {
        reconcileStarted.current = true;
        await api
          .post(
            `/commerce/receipt/${encodeURIComponent(id)}/reconcile`,
            null,
            { headers: { "X-Receipt-Token": receiptToken } },
          )
          .catch(() => undefined);
      }
      await load().catch(() => undefined);
      if (active) setLoading(false);
    };
    void checkReceipt();

    return () => {
      active = false;
    };
  }, [load]);

  const settled =
    receipt?.paymentStatus === "paid" ||
    receipt?.status === "paid" ||
    receipt?.paymentStatus === "failed" ||
    receipt?.status === "failed" ||
    receipt?.status === "cancelled";

  const state = cancelled
    ? "cancelled"
    : loading
      ? "loading"
      : receipt?.paymentStatus === "paid" || receipt?.status === "paid"
        ? "paid"
        : receipt?.paymentStatus === "failed" || receipt?.status === "failed"
          ? "failed"
          : receipt?.status === "cancelled"
            ? "cancelled"
            : receipt
              ? "processing"
              : "unconfirmed";

  // Capture can land a moment after the customer does, so the page checks back.
  useEffect(() => {
    if (cancelled || loading || settled || polls >= POLL_LIMIT) return;
    const timer = window.setTimeout(() => {
      setPolls((count) => count + 1);
      void load().catch(() => undefined);
    }, POLL_MS);

    return () => window.clearTimeout(timer);
  }, [cancelled, load, loading, polls, settled]);

  const labels = receiptLabels(receipt?.language);
  const { Icon, title, body, spin } =
    state === "paid"
      ? {
          Icon: Check,
          title: labels.successTitle,
          body: labels.successBody,
          spin: false,
        }
      : state === "cancelled"
        ? {
            Icon: Minus,
            title: labels.cancelledTitle,
            body: labels.cancelledBody,
            spin: false,
          }
        : state === "failed"
          ? {
              Icon: X,
              title: labels.failedTitle,
              body: labels.failedBody,
              spin: false,
            }
          : state === "unconfirmed"
            ? {
                Icon: Loader2,
                title: labels.unconfirmedTitle,
                body: labels.unconfirmedBody,
                spin: false,
              }
            : {
                Icon: Loader2,
                title: labels.processingTitle,
                body: labels.processingBody,
                spin: true,
              };

  const check = () => {
    if (checking) return;
    setChecking(true);
    void load()
      .catch(() => undefined)
      .finally(() => setChecking(false));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              state === "paid"
                ? "bg-primary text-primary-foreground"
                : "border border-divider text-default-400"
            }`}
          >
            {loading ? (
              <Loader2 aria-hidden className="h-6 w-6 animate-spin" />
            ) : (
              <Icon
                aria-hidden
                className={
                  spin ? "animate-spin motion-reduce:animate-none" : ""
                }
                size={26}
                strokeWidth={2.5}
              />
            )}
          </div>

          {receipt ? (
            <p className="mt-6 text-[34px] font-bold leading-none tracking-tight tabular-nums">
              {formatApprovalAmount(
                receipt.amount,
                receipt.currency,
                receipt.language,
              )}
            </p>
          ) : null}

          {!loading ? (
            <>
              <h1 className="mt-3 text-lg font-semibold">{title}</h1>
              <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-default-500">
                {body}
              </p>
            </>
          ) : null}
        </div>

        {/* The details a customer needs if they ever have to ask about this payment. */}
        {!loading && receipt?.reference ? (
          <dl className="mt-8 divide-y divide-divider rounded-2xl border border-divider text-sm">
            {receipt?.merchant ? (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-default-500">{labels.paidTo}</dt>
                <dd className="truncate font-medium">{receipt.merchant}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-default-500">{labels.reference}</dt>
              <dd className="truncate font-mono text-xs">{receipt.reference}</dd>
            </div>
            {receipt?.paidAt ? (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-default-500">PayPal</dt>
                <dd className="text-default-500">
                  {new Date(receipt.paidAt).toLocaleString(receipt.language, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {!loading && (state === "processing" || state === "unconfirmed") ? (
          <button
            className="mt-4 h-11 w-full rounded-xl border border-divider text-sm font-medium transition hover:bg-default-100 disabled:opacity-60"
            disabled={checking}
            type="button"
            onClick={check}
          >
            {checking ? labels.processingTitle : labels.checkAgain}
          </button>
        ) : null}
      </div>
    </main>
  );
};

export default PaymentReceiptPage;

import { useState } from "react";
import { Check, Copy, Share2 } from "@/lucide-compat";

/**
 * A payment link as it appears in the merchant's chat. The merchant is not the
 * one paying, so the link is theirs to pass on rather than to open: one press
 * hands it to whatever they reach the customer with, the other copies it.
 */
export const PaymentLinkChip = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);
  // Desktop browsers without a share sheet fall back to copying alone.
  const canShare = typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      // A browser that refuses the clipboard leaves the link on screen.
    }
  };

  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ text: url });
    } catch {
      // The merchant closed the share sheet.
    }
  };

  return (
    <span className="inline-flex max-w-full items-center gap-1 align-middle">
      <button
        className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        type="button"
        onClick={() => void copy()}
      >
        {copied ? (
          <Check aria-hidden className="shrink-0" size={14} />
        ) : (
          <Copy aria-hidden className="shrink-0" size={14} />
        )}
        <span className="truncate">
          {copied ? "Payment link copied" : "Copy payment link"}
        </span>
      </button>
      {canShare ? (
        <button
          aria-label="Share payment link"
          className="inline-flex items-center rounded-full bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20"
          type="button"
          onClick={() => void share()}
        >
          <Share2 aria-hidden size={14} />
        </button>
      ) : null}
    </span>
  );
};

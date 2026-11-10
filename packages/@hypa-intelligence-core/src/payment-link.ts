/** PayPal checkout links, and nothing wearing PayPal's name. */
export function isPayPalUrl(href: string): boolean {
  try {
    const url = new URL(href);

    return (
      url.protocol === "https:" &&
      (url.hostname === "paypal.com" || url.hostname.endsWith(".paypal.com"))
    );
  } catch {
    return false;
  }
}

export interface PaymentLink {
  orderId: string;
  checkoutUrl: string;
  /** What to send the customer, written in the customer's language. */
  message: string;
  language: string;
}

interface McpEnvelope {
  error?: { message?: string };
  result?: {
    isError?: boolean;
    structuredContent?: unknown;
    content?: { text?: string }[];
  };
}

/**
 * The customer's payment link for an approved order, through the one `paypal`
 * tool. The server creates the checkout and writes the message, so every app
 * only has to hand the same text to the customer.
 */
export async function createPaymentLink(input: {
  baseUrl: string;
  token: string;
  orderId: string;
  fetch?: typeof globalThis.fetch;
}): Promise<PaymentLink> {
  const response = await (input.fetch ?? fetch)(`${input.baseUrl}/v2/mcp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.token}`,
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `payment-link-${input.orderId}`,
      method: "tools/call",
      params: {
        name: "paypal",
        arguments: { action: "send_payment_link", orderId: input.orderId },
      },
    }),
  });
  const raw = await response.text();
  let envelope: McpEnvelope | undefined;
  try {
    const jsonText = response.headers.get("content-type")?.includes("text/event-stream")
      ? raw.split(/\r?\n/).find((line) => line.startsWith("data:"))?.slice(5).trim()
      : raw;
    if (jsonText) envelope = JSON.parse(jsonText) as McpEnvelope;
  } catch {
    /* The error below presents a safe message for malformed MCP replies. */
  }
  if (!response.ok || envelope?.error || envelope?.result?.isError) {
    const message = envelope?.error?.message ?? envelope?.result?.content?.[0]?.text;
    throw new Error(message || "Could not prepare the customer payment link.");
  }
  let result = envelope?.result?.structuredContent;
  if (!result && envelope?.result?.content?.[0]?.text) {
    try {
      result = JSON.parse(envelope.result.content[0].text) as unknown;
    } catch {
      /* Fall through to the result shape error. */
    }
  }
  if (!result || typeof result !== "object") throw new Error("The payment link response was invalid.");
  const link = result as Partial<PaymentLink>;
  if (
    link.orderId !== input.orderId ||
    typeof link.checkoutUrl !== "string" ||
    typeof link.message !== "string"
  ) {
    throw new Error("The payment link response was incomplete.");
  }

  return link as PaymentLink;
}

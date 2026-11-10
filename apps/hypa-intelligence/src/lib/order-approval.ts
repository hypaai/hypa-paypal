/**
 * The order an approval link points at, whichever Hypa host the agent wrote
 * into the link. In the chat these open the approval modal in place, so the
 * merchant never leaves the conversation the order came from.
 */
export function approvalOrderId(href?: string): string | undefined {
  if (!href) return undefined;
  try {
    const { pathname } = new URL(href, window.location.origin);
    const match = /^\/orders\/([^/]+)\/approve\/?$/.exec(pathname);

    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

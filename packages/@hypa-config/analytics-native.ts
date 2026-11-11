import type { PostHogLike } from "./analytics-client";

/** The parts of posthog-react-native that Hypa uses. */
export interface NativePostHogClient {
  register(properties: Record<string, unknown>): void | Promise<void>;
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string): void;
  reset(): void;
  getDistinctId(): string;
}

/**
 * Lets createAnalytics drive the React Native SDK. `init` builds the client from
 * the key and host, and the other methods map to the SDK's own method names. The
 * web-only options createAnalytics passes along are ignored.
 */
export function nativePostHog(create: (key: string, host: string) => NativePostHogClient): PostHogLike {
  let client: NativePostHogClient | undefined;
  const adapter: PostHogLike = {
    init(key, options) {
      client = create(key, String(options.api_host));
      (options.loaded as ((posthog: PostHogLike) => void) | undefined)?.(adapter);
    },
    register: (properties) => void client?.register(properties),
    capture: (event, properties) => client?.capture(event, properties),
    identify: (id) => client?.identify(id),
    reset: () => client?.reset(),
    get_distinct_id: () => client?.getDistinctId() ?? "",
  };

  return adapter;
}

/**
 * Calls `onOpen` when the app comes back to the foreground after being away for
 * at least `minAwayMs` (30 minutes by default), so a person who leaves the app in
 * the background for days still counts as opening it. Pass it each app-state change.
 */
export function reopenTracker(onOpen: () => void, minAwayMs = 30 * 60 * 1000, now: () => number = Date.now) {
  let leftAt: number | null = null;

  return (state: string) => {
    if (state === "active") {
      if (leftAt !== null && now() - leftAt >= minAwayMs) onOpen();
      leftAt = null;
    } else if (leftAt === null) {
      leftAt = now();
    }
  };
}

/**
 * The user id inside a Hypa sign-in token (its `sub` claim), or null. The signature
 * is not checked: this only labels analytics, for apps that keep a token and no
 * user object.
 */
export function userIdFromToken(token?: string | null): string | null {
  const payload = token?.split(".")[1];

  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(base64));

    return typeof claims.sub === "string" && claims.sub ? claims.sub : null;
  } catch {
    return null;
  }
}


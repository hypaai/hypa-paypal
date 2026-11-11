import { router } from 'expo-router';

export const withReturnTo = (returnTo: string) => ({ returnTo });

/** Goes back when it can, so the page slides out. `returnTo` is only for a page opened with no history, like from a link. */
export const goBackOrReturnTo = (
  returnTo?: string | string[],
  fallback: string = '/chat'
) => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  const target = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  router.replace((target || fallback) as any);
};

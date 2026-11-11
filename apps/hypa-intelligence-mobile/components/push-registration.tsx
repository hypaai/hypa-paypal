import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSettings } from '@/context/settings-context';
import { registerForPush } from '@/lib/push';

/**
 * Keeps this phone registered for payment notifications while the merchant is signed in, and opens
 * the chat a notification came from when it is tapped (including when the tap launched the app).
 * It shows nothing.
 */
export function PushRegistration() {
  const { settings } = useSettings();
  const token = settings?.token?.trim() || undefined;
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (token) void registerForPush(token, { ask: false }).catch(() => undefined);
  }, [token]);

  useEffect(() => {
    const data = lastResponse?.notification.request.content.data as { chatId?: unknown } | undefined;

    if (typeof data?.chatId === 'string') {
      router.push({ pathname: '/chat/[id]', params: { id: data.chatId } });
    }
  }, [lastResponse]);

  return null;
}

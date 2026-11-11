import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { apiPost } from '@/api';
import { useBridgeNumber } from '@/hooks/use-bridge';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Gives the server this phone's push token, so it can say when a customer needs the owner. */
async function registerPhone() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Hypa Bridge', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  await apiPost('/v2/push/register', { token: data, platform: Platform.OS });
}

/** Renders nothing. Only a business with WhatsApp connected is asked for notifications, and a tap on one opens that customer. */
export function BridgePush() {
  const connected = !!useBridgeNumber().data;
  const tapped = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (connected) registerPhone().catch(() => undefined);
  }, [connected]);

  useEffect(() => {
    const threadId = tapped?.notification.request.content.data?.threadId;
    if (typeof threadId === 'string') router.navigate({ pathname: '/(dashboard)/chat', params: { customer: threadId } });
  }, [tapped]);

  return null;
}

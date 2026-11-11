import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URL } from '@/api';

// A payment arriving while the app is open still shows, so the merchant sees it either way.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * This phone's Expo push token, or null when the phone cannot have one or the merchant has not
 * allowed notifications. `ask` is the only place the permission prompt can appear.
 */
async function expoPushToken(ask: boolean): Promise<string | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted && ask) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Payments',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

async function post(path: string, authToken: string, body: object) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Push registration failed (${response.status})`);
}

/**
 * Tells the API which phone to notify when a customer pays. With `ask: false` it only registers a
 * phone whose owner has already allowed notifications, so opening the app never shows a prompt;
 * the prompt comes when the merchant approves an order and is about to wait for the payment.
 */
export async function registerForPush(authToken: string, { ask }: { ask: boolean }): Promise<boolean> {
  const token = await expoPushToken(ask);
  if (!token) return false;
  await post('/v2/push/register', authToken, { token, platform: Platform.OS });

  return true;
}

/** Signing out must stop this phone getting the account's payment notifications. */
export async function unregisterPush(authToken: string): Promise<void> {
  const token = await expoPushToken(false);
  if (token) await post('/v2/push/unregister', authToken, { token });
}

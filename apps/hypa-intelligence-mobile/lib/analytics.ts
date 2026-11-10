import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';
import { createAnalytics } from '@hypa/config/analytics-client';
import { nativePostHog } from '@hypa/config/analytics-native';

/** Product analytics: app opens and who the signed-in person is. Sends nothing without a key. */
export const analytics = createAnalytics(
  nativePostHog((key, host) => new PostHog(key, { host })),
  {
    app: 'hypa-intelligence-mobile',
    appVersion: Constants.expoConfig?.version,
    environment: __DEV__ ? 'development' : 'production',
    key: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  }
);

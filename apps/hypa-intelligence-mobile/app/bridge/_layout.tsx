import { Stack } from 'expo-router';

/** Hypa Bridge: the customer list, one conversation, and the business setup. */
export default function BridgeLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}

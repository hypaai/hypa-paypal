import { Stack } from 'expo-router';

/** Hypa Bridge: the business setup. Customers and their conversations live in the Chat tab. */
export default function BridgeLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}

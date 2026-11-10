import { Stack } from 'expo-router';

/** Profile opens as one sheet; Referral slides in from the right inside it. */
export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}

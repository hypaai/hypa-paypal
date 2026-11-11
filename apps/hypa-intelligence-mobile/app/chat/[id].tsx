import { Redirect, useLocalSearchParams } from 'expo-router';

/** Links to one chat (from the keyboard) open it in the Chat tab, not on top of it. */
export default function Conversation() {
  const params = useLocalSearchParams<{ id: string; camera?: string; draft?: string; photo?: string; photos?: string }>();
  return <Redirect href={{ pathname: '/chat', params }} />;
}

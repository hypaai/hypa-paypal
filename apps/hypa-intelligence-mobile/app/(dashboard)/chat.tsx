import { useLocalSearchParams } from 'expo-router';
import { CustomerChat } from '@/components/modules/bridge/customer-chat';
import { ChatScreen } from '@/components/modules/chat/chat-screen';

export default function Chat() {
  const params = useLocalSearchParams<{ id?: string; new?: string; draft?: string; camera?: string; photos?: string; photo?: string; customer?: string; history?: string }>();
  if (params.customer) return <CustomerChat id={params.customer} />;
  return (
    <ChatScreen
      id={params.id}
      resetKey={params.new}
      initialDraft={params.draft}
      openCamera={params.camera}
      fromPhotos={Boolean(params.photos)}
      openPhoto={params.photo}
      openHistory={Boolean(params.history)}
    />
  );
}

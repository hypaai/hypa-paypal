import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ArrowUp, Check } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { discardBridgeDraft, replyInBridgeThread, sendBridgeDraft, setBridgeMode } from '@/api/bridge';
import { DraftCard } from '@/components/modules/bridge/draft-card';
import { OrderCard } from '@/components/modules/bridge/order-card';
import Body from '@/components/shared/body';
import { BackButton } from '@/components/shared/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { FONTS } from '@/constants/fonts';
import { bridgeKeys, useBridgeNumber, useBridgeThread } from '@/hooks/use-bridge';
import { useThemeColors } from '@/hooks/use-theme-color';
import { dayLabel } from '@/lib/bridge';
import { goBackOrReturnTo } from '@/lib/navigation';
import { useToast } from '@/lib/toast';

const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** One customer's conversation, like a messaging app: their messages, what was sent, the reply waiting for approval, and a box to write. */
export default function BridgeThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const thread = useBridgeThread(id);
  const profile = useBridgeNumber().data?.profile;
  const scroller = useRef<ScrollView>(null);
  const [reply, setReply] = useState('');

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bridgeKeys.thread(id) }),
      queryClient.invalidateQueries({ queryKey: bridgeKeys.threads }),
    ]);
  const onError = (error: unknown) => Alert.alert('Could not do that', error instanceof Error ? error.message : 'Try again.');

  const name = thread.data?.customerName || 'the customer';
  const send = useMutation({
    mutationFn: (input: { draftId: string; text?: string }) => sendBridgeDraft(input.draftId, input.text),
    onSuccess: async (result) => {
      await refresh();
      if (result.status === 'template_sent') toast.showInfo('Message sent', `${name} last wrote over 24 hours ago, so only the approved message went out. Your reply goes when they answer.`);
      else toast.showSuccess('Sent', `Your reply went to ${name} on WhatsApp.`);
    },
    onError,
  });
  const discard = useMutation({
    mutationFn: discardBridgeDraft,
    onSuccess: async () => {
      await refresh();
      toast.showInfo('Reply discarded', 'Nothing was sent.');
    },
    onError,
  });
  const mode = useMutation({
    mutationFn: (next: 'agent' | 'owner') => setBridgeMode(id, next),
    onSuccess: async (_result, next) => {
      await refresh();
      toast.showInfo(next === 'owner' ? 'You are replying' : 'Assistant is back', next === 'owner' ? 'The assistant stays quiet until you hand back.' : 'It will draft replies again.');
    },
    onError,
  });
  const say = useMutation({
    mutationFn: () => replyInBridgeThread(id, reply.trim()),
    onSuccess: async () => {
      setReply('');
      await refresh();
    },
    onError,
  });

  const data = thread.data;
  const busy = send.isPending || discard.isPending || mode.isPending || say.isPending;
  const owner = data?.mode === 'owner';

  return (
    <Body showBackground={false} enableScroll={false} hideHorizontalInset hideBottomInset={process.env.EXPO_OS !== 'ios'}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}>
        <View className="flex-row items-center px-4 py-2">
          <BackButton onPress={() => goBackOrReturnTo(undefined, '/bridge')} />
          <View className="flex-1 px-3">
            <Text className="text-[17px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.semiBold }} numberOfLines={1}>
              {data?.customerName || 'Customer'}
            </Text>
            {data ? (
              <Text className="text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                {owner ? 'You are replying' : 'Assistant is replying'}
              </Text>
            ) : null}
          </View>
        </View>

        <ScrollView
          ref={scroller}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={thread.isRefetching} onRefresh={() => void thread.refetch()} />}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}>
          {thread.isLoading ? <ActivityIndicator color={colors.textMuted} className="mt-10" /> : null}
          {thread.isError ? (
            <Text accessibilityRole="alert" className="mt-10 text-center text-zinc-500 dark:text-zinc-400">
              Could not load this conversation.
            </Text>
          ) : null}

          {data?.order ? (
            <View className="mb-3">
              <OrderCard order={data.order} profile={profile} />
            </View>
          ) : null}

          {data?.messages.map((message, index) => {
            const previous = data.messages[index - 1];
            const next = data.messages[index + 1];
            const fromCustomer = message.role === 'user';
            const day = dayLabel(message.createdAt);
            const newDay = !previous || dayLabel(previous.createdAt) !== day;
            const startsGroup = newDay || previous.role !== message.role;
            const endsGroup = !next || next.role !== message.role || dayLabel(next.createdAt) !== day;
            return (
              <View key={message.id}>
                {newDay ? (
                  <Text className="mb-2 mt-3 text-center text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.medium }}>
                    {day}
                  </Text>
                ) : null}
                <View className={`${fromCustomer ? 'items-start' : 'items-end'} ${startsGroup ? 'mt-2' : 'mt-0.5'}`}>
                  <View className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${fromCustomer ? 'bg-zinc-100 dark:bg-zinc-900' : 'bg-zinc-900 dark:bg-zinc-100'}`}>
                    <Text className={`text-[15px] leading-[22px] ${fromCustomer ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-50 dark:text-zinc-900'}`} style={{ fontFamily: FONTS.main.regular }}>
                      {message.content}
                    </Text>
                  </View>
                  {endsGroup ? (
                    <View className="mt-1 flex-row items-center gap-1 px-1">
                      <Text className="text-[11px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                        {clock(message.createdAt)}
                      </Text>
                      {fromCustomer ? null : <Check size={12} color={colors.iconSubtle} />}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}

          {data && data.messages.length === 0 && data.drafts.length === 0 ? (
            <Text className="py-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
              No messages yet.
            </Text>
          ) : null}

          {data?.drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              busy={busy}
              sending={send.isPending && send.variables?.draftId === draft.id}
              onSend={(text) => send.mutate({ draftId: draft.id, text })}
              onDiscard={() => discard.mutate(draft.id)}
            />
          ))}
        </ScrollView>

        {data ? (
          <View className="border-t border-zinc-100 px-4 pb-3 pt-2 dark:border-zinc-900">
            {owner ? (
              <>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                    The assistant is paused while you reply.
                  </Text>
                  <Button variant="ghost" size="sm" disabled={busy} onPress={() => mode.mutate('agent')}>
                    <Text>Hand back</Text>
                  </Button>
                </View>
                <View className="flex-row items-end gap-2">
                  <Textarea
                    value={reply}
                    onChangeText={setReply}
                    placeholder="Message"
                    editable={!busy}
                    numberOfLines={4}
                    className="max-h-28 min-h-10 flex-1 rounded-3xl px-4 py-2"
                  />
                  <Button size="icon" className="rounded-full" accessibilityLabel="Send" disabled={busy || !reply.trim()} onPress={() => say.mutate()}>
                    <ArrowUp size={20} color={colors.primaryForeground} />
                  </Button>
                </View>
              </>
            ) : (
              <View className="flex-row items-center justify-between">
                <Text className="mr-3 flex-1 text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                  The assistant drafts replies for you to approve.
                </Text>
                <Button variant="outline" size="sm" disabled={busy} onPress={() => mode.mutate('owner')}>
                  <Text>Write a reply</Text>
                </Button>
              </View>
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Body>
  );
}

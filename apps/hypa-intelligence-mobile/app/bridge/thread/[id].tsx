import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ArrowUp, Check } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { discardBridgeDraft, replyInBridgeThread, sendBridgeDraft, setBridgeMode } from '@/api/bridge';
import { DraftCard } from '@/components/modules/bridge/draft-card';
import { OrderCard } from '@/components/modules/bridge/order-card';
import Body from '@/components/shared/body';
import { TypingDots } from '@/components/shared/typing-dots';
import { BackButton } from '@/components/shared/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
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
  // The assistant is writing while the customer's last message is fresh, nothing waits for approval, and the thread is not paused.
  const last = data?.messages[data.messages.length - 1];
  const assistantTyping = !!data && data.mode === 'agent' && data.drafts.length === 0 && last?.role === 'user' && Date.now() - new Date(last.createdAt).getTime() < 90_000;
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

          {assistantTyping ? (
            <View className="mt-2 items-end">
              <View className="rounded-2xl bg-zinc-900 px-3.5 py-3 dark:bg-zinc-100">
                <TypingDots color={colors.textSubtle} />
              </View>
            </View>
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
          <View className="px-4">
            {owner ? (
              <>
                <Text className="mb-1.5 px-1 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                  The assistant is paused while you reply.
                </Text>
                {/* The same card as the Chat tab's input bar. */}
                <View style={{ borderRadius: 26, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, padding: 6, marginBottom: 8 }}>
                  <TextInput
                    accessibilityLabel="Message the customer"
                    placeholder="Message"
                    placeholderTextColor={colors.placeholder}
                    value={reply}
                    onChangeText={setReply}
                    multiline
                    maxLength={4000}
                    editable={!busy}
                    style={{ color: colors.inputText, fontFamily: FONTS.main.regular, fontSize: 16, lineHeight: 22, maxHeight: 140, minHeight: 44, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Button variant="ghost" size="sm" disabled={busy} onPress={() => mode.mutate('agent')}>
                      <Text>Hand back</Text>
                    </Button>
                    <View style={{ flex: 1 }} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send"
                      onPress={() => say.mutate()}
                      disabled={busy || !reply.trim()}
                      style={{ width: 40, height: 40, margin: 2, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: reply.trim() && !busy ? colors.primary : colors.border }}>
                      <ArrowUp color={reply.trim() && !busy ? colors.primaryForeground : colors.disabled} size={20} />
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 26, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border, padding: 6, paddingLeft: 18, marginBottom: 8 }}>
                <Text className="mr-3 flex-1 text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                  The assistant drafts replies for you to approve.
                </Text>
                <Button size="sm" className="rounded-full" disabled={busy} onPress={() => mode.mutate('owner')}>
                  <Text>Reply</Text>
                </Button>
              </View>
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Body>
  );
}

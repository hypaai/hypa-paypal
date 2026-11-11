import React from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Settings as SettingsIcon } from 'lucide-react-native';

import type { BridgeThreadSummary } from '@/api/bridge';
import Body from '@/components/shared/body';
import { BackButton } from '@/components/shared/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { FONTS } from '@/constants/fonts';
import { useBridgeNumber, useBridgeThreads } from '@/hooks/use-bridge';
import { useThemeColors } from '@/hooks/use-theme-color';
import { alertMessage, timeAgo } from '@/lib/bridge';
import { goBackOrReturnTo } from '@/lib/navigation';
import { useUser } from '@/lib/user-provider';

const statusOf = (thread: BridgeThreadSummary) =>
  thread.needsOwner ? 'Needs you' : thread.pendingDrafts ? 'Reply waiting' : thread.mode === 'owner' ? 'You are replying' : thread.hasOrder ? 'Order recorded' : '';

function CustomerRow({ thread }: { thread: BridgeThreadSummary }) {
  const colors = useThemeColors();
  const status = statusOf(thread);
  return (
    <Pressable
      className="flex-row items-center border-b border-zinc-100 px-1 py-4 dark:border-zinc-800"
      onPress={() => router.push({ pathname: '/bridge/thread/[id]', params: { id: thread.id } })}>
      <View className="flex-1">
        <Text className="text-[15px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
          {thread.customerName || 'Customer'}
        </Text>
        {status ? (
          <Text className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: thread.needsOwner ? FONTS.main.medium : FONTS.main.regular }}>
            {status}
          </Text>
        ) : null}
      </View>
      <Text className="mr-2 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
        {timeAgo(thread.updatedAt)}
      </Text>
      <ChevronRight color={colors.iconMuted} size={18} />
    </Pressable>
  );
}

export default function BridgeCustomers() {
  const colors = useThemeColors();
  const { user, loading: loadingUser } = useUser();
  const number = useBridgeNumber();
  const threads = useBridgeThreads(!!number.data);
  const alert = alertMessage(number.data?.alert ?? null);

  const body = () => {
    if (loadingUser || number.isLoading) return <ActivityIndicator color={colors.textMuted} />;
    if (!user) return <Text className="text-center text-zinc-500 dark:text-zinc-400">Sign in to use Hypa Bridge.</Text>;
    if (number.isError) return <Text accessibilityRole="alert" className="text-center text-zinc-500 dark:text-zinc-400">Could not load Hypa Bridge. Pull down to try again.</Text>;
    if (!number.data) {
      return (
        <View className="items-center px-4">
          <Text className="mb-2 text-center text-[17px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.semiBold }}>
            Answer your customers on WhatsApp
          </Text>
          <Text className="mb-6 text-center text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
            Hypa replies in your customers' language, takes their orders, and asks you before anything is sent.
          </Text>
          <Button onPress={() => router.push('/bridge/setup')}>
            <Text>Connect your number</Text>
          </Button>
        </View>
      );
    }
    return null;
  };

  const status = body();

  return (
    <Body showBackground={false} enableScroll={false}>
      <View className="flex-1 px-4">
        <View className="flex-row items-center justify-between py-2">
          <BackButton onPress={() => goBackOrReturnTo(undefined, '/settings')} />
          <Text className="text-[17px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.semiBold }}>
            Customers
          </Text>
          <Pressable accessibilityLabel="Hypa Bridge settings" hitSlop={12} onPress={() => router.push('/bridge/setup')}>
            <SettingsIcon color={colors.icon} size={22} />
          </Pressable>
        </View>

        {alert ? (
          <Text accessibilityRole="alert" className="mb-3 rounded-xl border border-zinc-200 p-3 text-[13px] text-zinc-900 dark:border-zinc-800 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
            {alert}
          </Text>
        ) : null}

        {status ? (
          <View className="flex-1 items-center justify-center">{status}</View>
        ) : (
          <FlatList
            data={threads.data ?? []}
            keyExtractor={(thread) => thread.id}
            renderItem={({ item }) => <CustomerRow thread={item} />}
            refreshing={threads.isRefetching}
            onRefresh={() => void threads.refetch()}
            ListEmptyComponent={
              threads.isLoading ? null : (
                <Text className="mt-10 text-center text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                  No customers yet. When someone writes to {number.data?.displayPhone || 'your number'}, they show up here.
                </Text>
              )
            }
          />
        )}
      </View>
    </Body>
  );
}

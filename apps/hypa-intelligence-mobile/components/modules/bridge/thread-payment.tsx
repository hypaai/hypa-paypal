import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { sendBridgePaymentLink } from '@/api/bridge';
import { getCommerceOrder } from '@/api/commerce';
import { PaymentApprovalRow } from '@/components/modules/chat/payment-approval-sheet';
import { Text } from '@/components/ui/text';
import { FONTS } from '@/constants/fonts';
import { useSettings } from '@/context/settings-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { bridgeKeys } from '@/hooks/use-bridge';

const STATUS: Record<string, string> = {
  draft: 'Waiting for your approval. Tap the card above to review and approve it. Nothing goes to the customer until you do.',
  approved: 'Approved. Send the payment link to the customer on WhatsApp.',
  paid: 'Paid. The customer has their receipt on WhatsApp.',
  failed: 'The payment failed.',
  cancelled: 'Cancelled. Nothing was sent to the customer.',
};

/** The payable order from this WhatsApp chat, with the merchant's own approval sheet: only their tap moves it forward. */
export function ThreadPayment({ orderId, threadId, linkSent }: { orderId: string; threadId: string; linkSent: boolean }) {
  const { settings } = useSettings();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const token = settings?.token?.trim() || undefined;
  const order = useQuery({ queryKey: ['bridge', 'payment', orderId], queryFn: () => getCommerceOrder(token!, orderId), enabled: !!token, refetchInterval: 15_000 });
  const send = useMutation({
    mutationFn: () => sendBridgePaymentLink(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bridgeKeys.thread(threadId) }),
  });
  if (!order.data) return null;
  const approved = order.data.status === 'approved';
  return (
    <View className="mb-3">
      <PaymentApprovalRow approval={order.data} token={token} />
      <Text className="mt-1 px-1 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
        {approved && linkSent ? 'Approved. The payment link went to the customer on WhatsApp.' : (STATUS[order.data.status] ?? '')}
      </Text>
      {approved ? (
        <Pressable
          accessibilityRole="button"
          disabled={send.isPending}
          onPress={() => send.mutate()}
          className="mt-2 h-11 items-center justify-center rounded-xl"
          style={({ pressed }) => ({ backgroundColor: colors.primary, opacity: send.isPending ? 0.5 : pressed ? 0.88 : 1 })}>
          {send.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={{ color: colors.primaryForeground, fontFamily: FONTS.main.medium }}>{linkSent ? 'Send the payment link again' : 'Send payment link to customer'}</Text>
          )}
        </Pressable>
      ) : null}
      {send.isError ? (
        <Text className="mt-1 px-1 text-[12px] text-red-600" style={{ fontFamily: FONTS.main.regular }}>
          {send.error instanceof Error ? send.error.message : 'The payment link was not sent.'}
        </Text>
      ) : null}
    </View>
  );
}

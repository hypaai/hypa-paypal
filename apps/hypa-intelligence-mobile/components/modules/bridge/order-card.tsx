import React from 'react';
import { View } from 'react-native';

import type { BridgeOrder, BridgeProfile } from '@/api/bridge';
import { Text } from '@/components/ui/text';
import { FONTS } from '@/constants/fonts';
import { formatMoney, orderTotal } from '@/lib/bridge';

/** The order the assistant has recorded so far: what, how many, when, and what is still missing. */
export function OrderCard({ order, profile }: { order: BridgeOrder; profile?: BridgeProfile }) {
  const total = orderTotal(order, profile);
  const currency = profile?.currency ?? 'NGN';

  return (
    <View className="rounded-2xl bg-zinc-200 p-4 shadow-sm shadow-black/10 dark:bg-zinc-800">
      <Text className="mb-2 text-[13px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.medium }}>
        Order
      </Text>
      {order.items.map((line, index) => {
        const detail = [line.size, line.color].filter(Boolean).join(', ');
        return (
          <View key={`${line.name}-${index}`} className="flex-row justify-between py-1">
            <Text className="flex-1 pr-3 text-[15px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.regular }}>
              {line.qty} × {line.name}
              {detail ? ` (${detail})` : ''}
            </Text>
            {line.unitPrice !== undefined ? (
              <Text className="text-[15px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
                {formatMoney(line.unitPrice * line.qty, currency)}
              </Text>
            ) : null}
          </View>
        );
      })}
      {total !== undefined ? (
        <View className="mt-2 flex-row justify-between border-t border-zinc-300 pt-2 dark:border-zinc-600">
          <Text className="text-[15px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
            Total
          </Text>
          <Text className="text-[15px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
            {formatMoney(total, currency)}
          </Text>
        </View>
      ) : null}
      {order.dueDate ? (
        <Text className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
          Wanted: {order.dueDate}
        </Text>
      ) : null}
      {order.notes ? (
        <Text className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
          {order.notes}
        </Text>
      ) : null}
      {order.missing.length ? (
        <Text className="mt-2 text-[13px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
          Still needed: {order.missing.join(', ')}
        </Text>
      ) : null}
    </View>
  );
}

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, ChevronRight, MessageCircle } from 'lucide-react-native';

import type { BridgeThreadSummary } from '@/api/bridge';
import { Text } from '@/components/ui/text';
import { FONTS } from '@/constants/fonts';
import { useBridgeNumber, useBridgeThreads } from '@/hooks/use-bridge';
import { useThemeColors } from '@/hooks/use-theme-color';
import { timeAgo } from '@/lib/bridge';

const statusOf = (thread: BridgeThreadSummary) =>
  thread.needsOwner ? 'Needs you' : thread.pendingDrafts ? 'Reply waiting' : thread.mode === 'owner' ? 'You are replying' : thread.hasOrder ? 'Order recorded' : '';

/** Pinned at the top of the chat history for a business with WhatsApp connected: tap it to open the customers under it. */
export function PinnedCustomers({ onOpen }: { onOpen: (threadId: string) => void }) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const number = useBridgeNumber();
  const threads = useBridgeThreads(!!number.data);
  if (!number.data) return null;
  const waiting = (threads.data ?? []).filter((thread) => thread.needsOwner || thread.pendingDrafts).length;
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <View style={{ borderBottomWidth: 1, borderColor: colors.border }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18 }}>
        <MessageCircle color={colors.icon} size={19} />
        <Text style={{ flex: 1, color: colors.text, fontFamily: FONTS.main.medium }}>WhatsApp customers · pinned</Text>
        {waiting ? (
          <Text style={{ color: colors.textMuted, fontFamily: FONTS.main.medium, fontSize: 13 }}>{waiting} waiting</Text>
        ) : null}
        <Chevron color={colors.iconMuted} size={18} />
      </Pressable>
      {open
        ? (threads.data ?? []).map((thread) => (
            <Pressable
              key={thread.id}
              onPress={() => onOpen(thread.id)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingLeft: 47, paddingRight: 18 }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.text }}>
                  {thread.customerName || 'Customer'}
                </Text>
                {statusOf(thread) ? (
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: thread.needsOwner ? FONTS.main.medium : FONTS.main.regular }}>
                    {statusOf(thread)}
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{timeAgo(thread.updatedAt)}</Text>
            </Pressable>
          ))
        : null}
      {open && threads.data && !threads.data.length ? (
        <Text style={{ color: colors.textMuted, paddingVertical: 14, paddingLeft: 47, paddingRight: 18 }}>No customers yet.</Text>
      ) : null}
    </View>
  );
}

import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { ArrowUp, Pencil, Trash2 } from 'lucide-react-native';

import type { BridgeDraft } from '@/api/bridge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { FONTS } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/use-theme-color';

/** A reply the assistant wrote and has not sent, shown as an unsent bubble. The owner sends it as is, edits it first, or throws it away. */
export function DraftCard({
  draft,
  busy,
  sending,
  onSend,
  onDiscard,
}: {
  draft: BridgeDraft;
  busy: boolean;
  sending?: boolean;
  onSend: (text?: string) => void;
  onDiscard: () => void;
}) {
  const colors = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft.text);
  const flag = draft.priceWarning
    ? 'This reply mentions an amount that is not on your price list.'
    : draft.needsOwner
      ? draft.reason || 'The assistant is asking you to take this one.'
      : null;

  return (
    <View className="mt-3 items-end">
      <Text className="mb-1 px-1 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.medium }}>
        Suggested reply · not sent yet
      </Text>
      <View className="max-w-[85%] rounded-2xl border border-dashed border-zinc-400 px-3.5 py-2.5 dark:border-zinc-600">
        {flag ? (
          <Text accessibilityRole="alert" className="mb-1.5 text-[13px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
            {flag}
          </Text>
        ) : null}
        {editing ? (
          <Textarea value={text} onChangeText={setText} editable={!busy} autoFocus className="min-w-56" />
        ) : (
          <Text className="text-[15px] leading-[22px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.regular }}>
            {draft.text}
          </Text>
        )}
        {draft.hasAudio ? (
          <Text className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
            Goes with a voice note.
          </Text>
        ) : null}
        {draft.status === 'template_sent' ? (
          <Text className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
            The customer last wrote more than 24 hours ago, so only the approved message went out. This reply goes when they answer.
          </Text>
        ) : null}
      </View>
      <View className="mt-2 w-full flex-row items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onPress={() =>
            Alert.alert('Discard this reply?', 'Nothing will be sent to the customer.', [
              { text: 'Keep', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: onDiscard },
            ])
          }>
          <Trash2 size={16} color={colors.iconMuted} />
          <Text>Discard</Text>
        </Button>
        <View className="flex-row items-center gap-2">
          <Button variant="outline" size="sm" disabled={busy} onPress={() => setEditing((value) => !value)}>
            {editing ? null : <Pencil size={16} color={colors.icon} />}
            <Text>{editing ? 'Cancel' : 'Edit'}</Text>
          </Button>
          <Button size="sm" disabled={busy || (editing && !text.trim())} onPress={() => onSend(editing ? text.trim() : undefined)}>
            {sending ? null : <ArrowUp size={16} color={colors.primaryForeground} />}
            <Text>{sending ? 'Sending…' : 'Send'}</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

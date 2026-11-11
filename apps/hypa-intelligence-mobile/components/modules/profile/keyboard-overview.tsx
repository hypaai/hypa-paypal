import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SetupProgress } from '@/components/modules/home/setup-progress';
import { useKeyboardSettings } from '@/hooks/use-keyboard-settings';
import { useThemeColors } from '@/hooks/use-theme-color';
import { FONTS } from '@/constants/fonts';

export function KeyboardOverview({ displayName }: { displayName: string }) {
  const { settings, refreshSettings } = useKeyboardSettings();
  const colors = useThemeColors();
  useFocusEffect(useCallback(() => { void refreshSettings(); }, [refreshSettings]));
  const stats = settings?.usageStats;
  return (
    <View style={{ gap: 14, paddingVertical: 20 }}>
      <Text style={{ color: colors.text, fontFamily: FONTS.main.medium, fontSize: 22 }}>Hello, {displayName}</Text>
      <Text style={{ color: colors.text, fontFamily: FONTS.main.medium, fontSize: 18 }}>Keyboard</Text>
      <SetupProgress />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {[
          ['Words saved', stats?.wordsSaved ?? 0],
          ['Active streak', stats?.streakDays ?? 0],
          ['Words typed', stats?.wordsTyped ?? 0],
        ].map(([label, value]) => (
          <View key={label} style={{ flexGrow: 1, minWidth: 90, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18 }}>
            <Text selectable style={{ color: colors.text, fontSize: 24, fontFamily: FONTS.main.medium }}>
              {new Intl.NumberFormat('en', { notation: 'compact' }).format(Number(value))}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

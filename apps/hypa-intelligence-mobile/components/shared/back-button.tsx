import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';

import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { useThemeColors } from '@/hooks/use-theme-color';

export const BACK_BUTTON_SIZE = 44;

/** `close` shows an X, for the first page of a sheet, like Chat history. */
export function BackButton({ onPress, close }: { onPress?: () => void; close?: boolean }) {
  const colors = useThemeColors();
  const Icon = close ? X : ArrowLeft;

  return (
    <GlassIconButton
      onPress={onPress}
      size={BACK_BUTTON_SIZE}
      accessibilityLabel={close ? 'Close' : 'Back'}>
      <Icon color={colors.icon} size={24} />
    </GlassIconButton>
  );
}

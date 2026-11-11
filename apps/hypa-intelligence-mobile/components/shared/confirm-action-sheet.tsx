import React from 'react'
import { Modal, Pressable, StyleSheet, Text as RNText, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ConfirmActionSheetProps = {
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  confirmLoading?: boolean
}

export function ConfirmActionSheet({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmLoading = false,
}: ConfirmActionSheetProps) {
  const insets = useSafeAreaInsets()
  const isDark = useColorScheme() === 'dark'

  const colors = {
    card: isDark ? '#09090b' : '#ffffff',
    fg: isDark ? '#f4f4f5' : '#111111',
    muted: isDark ? '#a1a1aa' : '#52525b',
    border: isDark ? '#27272a' : '#e4e4e7',
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.card }] }>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.content}>
            <RNText style={[styles.title, { color: colors.fg }]}>{title}</RNText>
            <RNText style={[styles.message, { color: colors.muted }]}>{message}</RNText>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                disabled={confirmLoading}
                style={({ pressed }) => [
                  styles.outlineButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: confirmLoading ? 0.5 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <RNText style={[styles.outlineButtonText, { color: colors.fg }]}>{cancelLabel}</RNText>
              </Pressable>

              <Pressable
                onPress={() => void onConfirm()}
                disabled={confirmLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: colors.fg,
                    opacity: confirmLoading ? 0.5 : pressed ? 0.88 : 1,
                  },
                ]}
              >
                <RNText style={[styles.primaryButtonText, { color: colors.card }]}> 
                  {confirmLoading ? `${confirmLabel}...` : confirmLabel}
                </RNText>
              </Pressable>
            </View>
          </View>

          <View style={{ height: insets.bottom + 12 }} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    zIndex: 1,
    elevation: 20,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  outlineButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})

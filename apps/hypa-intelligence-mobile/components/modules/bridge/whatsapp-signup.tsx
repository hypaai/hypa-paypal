import React from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/** Meta's WhatsApp login. When Meta redirects to `redirectUri` with a code, the code is handed back and the window closes. */
export function WhatsappSignup({
  url,
  redirectUri,
  onCode,
  onClose,
}: {
  url: string;
  redirectUri: string;
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white dark:bg-black" style={{ paddingTop: insets.top }}>
        <View className="flex-row justify-end px-4 py-2">
          <Button variant="ghost" size="sm" onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
        </View>
        <WebView
          source={{ uri: url }}
          onShouldStartLoadWithRequest={(request) => {
            if (!request.url.startsWith(redirectUri)) return true;
            const code = /[?&]code=([^&#]+)/.exec(request.url)?.[1];
            if (code) onCode(decodeURIComponent(code));
            else onClose();
            return false;
          }}
        />
      </View>
    </Modal>
  );
}

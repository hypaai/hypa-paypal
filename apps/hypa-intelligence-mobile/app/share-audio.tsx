import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { getSettingsJson, setSettingsJson } from 'hypa-keyboard-storage';

import { API_URL } from '@/api';
import { parseKeyboardSettings } from '@/lib/keyboard-settings';
import { ASK_SHARE_AUDIO_KEY, askAudioToFile, shareAudioFromUri } from '@/lib/share-audio';

/**
 * Opened by the keyboard's Ask Hypa "Share": a keyboard can't attach audio to
 * WhatsApp and similar apps, so the app shares the reply's audio instead.
 */
export default function ShareAskAudioScreen() {
  useEffect(() => {
    const run = async () => {
      const raw = getSettingsJson();
      const { token } = parseKeyboardSettings(raw);
      let audio = '';
      try {
        const stored = JSON.parse(raw) as Record<string, unknown>;
        const value = stored[ASK_SHARE_AUDIO_KEY];
        audio = typeof value === 'string' ? value : '';
        // Clear only the hand-off so the audio isn't left in shared settings.
        delete stored[ASK_SHARE_AUDIO_KEY];
        await setSettingsJson(JSON.stringify(stored));
      } catch {
        audio = '';
      }
      if (audio) {
        const uri = await askAudioToFile(audio, API_URL, token).catch(() => null);
        if (uri) await shareAudioFromUri(uri, 'audio/wav').catch(() => false);
      }
      router.replace('/');
    };
    void run();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

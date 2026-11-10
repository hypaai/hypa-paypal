import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { fetch as expoFetch } from "expo/fetch";
import { API_URL } from "@/api";
import { listConversations } from "@/api/conversations";
import { Text } from "@/components/ui/text";
import { FONTS } from "@/constants/fonts";
import { useSettings } from "@/context/settings-context";
import { useThemeColors } from "@/hooks/use-theme-color";
import { isOldCamera } from "@/lib/keyboard-link";

/**
 * Opened by the keyboard's camera button (keyboards can't use the camera). Opens the
 * pinned Keyboard chat with its camera, so the photo lands in that chat's input box.
 * The API lists the Keyboard chat first; without one (or signed out) a new chat opens.
 */
export default function KeyboardChat() {
  const { camera, draft, photo, photos } = useLocalSearchParams<{
    camera?: string;
    draft?: string;
    photo?: string;
    photos?: string;
  }>();
  const { isLoading, settings } = useSettings();
  const colors = useThemeColors();
  const token = settings?.token?.trim();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // An old link the app restored does nothing while it mounts: the user provider follows the link that
  // reopened the app, which may land on top of it. If it is ever the screen in front again, it opens Chat.
  const isOld = Boolean(camera && isOldCamera(camera));
  const focused = useIsFocused();
  const left = useRef(false);
  useEffect(() => {
    if (!focused) {
      left.current = true;
    } else if (left.current && isOld) {
      router.replace("/chat");
    }
  }, [focused, isOld]);

  useEffect(() => {
    if (isLoading || isOld) return;
    let live = true;
    const stamp = camera ?? String(Date.now());
    // The keyboard's Save opens a picture to save; its camera button opens the camera.
    const params = photo
      ? { photo }
      : { camera: stamp, ...(photos ? { photos } : {}), ...(draft ? { draft } : {}) };
    const open = (id?: string) => {
      if (!live) return;
      router.replace({ pathname: "/chat", params: id ? { id, ...params } : { new: stamp, ...params } });
    };
    setFailed(false);
    if (!token) {
      open();
    } else {
      listConversations({ baseUrl: API_URL, token, fetch: expoFetch as typeof fetch }, 1)
        .then((page) => open(page.data.find((chat) => chat.kind === "keyboard")?.id))
        .catch(() => live && setFailed(true));
    }
    return () => {
      live = false;
    };
  }, [attempt, camera, draft, isLoading, isOld, photo, photos, token]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32, backgroundColor: colors.background }}>
      {failed ? (
        <>
          <Text style={{ color: colors.text, fontFamily: FONTS.main.medium, fontSize: 16, textAlign: "center" }}>
            Couldn't open your Keyboard chat.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAttempt((count) => count + 1)}
            style={{ height: 48, paddingHorizontal: 24, borderRadius: 24, justifyContent: "center", backgroundColor: colors.primary }}
          >
            <Text style={{ color: colors.primaryForeground, fontFamily: FONTS.main.medium, fontSize: 16 }}>Try again</Text>
          </Pressable>
        </>
      ) : (
        <ActivityIndicator color={colors.spinner} />
      )}
    </View>
  );
}

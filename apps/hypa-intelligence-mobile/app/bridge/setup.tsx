import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { connectBridgeNumber, connectBridgeWithMeta, updateBridgeNumber } from '@/api/bridge';
import { ProfileForm } from '@/components/modules/bridge/profile-form';
import { WhatsappSignup } from '@/components/modules/bridge/whatsapp-signup';
import Body from '@/components/shared/body';
import { BackButton } from '@/components/shared/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { FONTS } from '@/constants/fonts';
import { bridgeKeys, useBridgeNumber, useBridgeSignup } from '@/hooks/use-bridge';
import { useThemeColors } from '@/hooks/use-theme-color';
import { alertMessage, emptyProfileForm, formFromProfile, profileFromForm, type BridgeProfileForm } from '@/lib/bridge';
import { goBackOrReturnTo } from '@/lib/navigation';
import { useToast } from '@/lib/toast';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View className="mb-4 rounded-2xl bg-zinc-200 p-4 shadow-sm shadow-black/10 dark:bg-zinc-800">
      <Text className="text-[15px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.semiBold }}>
        {title}
      </Text>
      {hint ? (
        <Text className="mb-3 mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
          {hint}
        </Text>
      ) : (
        <View className="mb-3" />
      )}
      {children}
    </View>
  );
}

/** Connect the WhatsApp number once, then keep the business facts the assistant uses up to date. */
export default function BridgeSetup() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const number = useBridgeNumber();
  const connected = number.data ?? null;
  const signup = useBridgeSignup().data;
  const [signingUp, setSigningUp] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [autoReply, setAutoReply] = useState(false);
  const [form, setForm] = useState<BridgeProfileForm>(emptyProfileForm);

  useEffect(() => {
    if (!connected) return;
    setPhoneNumberId(connected.phoneNumberId);
    setAutoReply(connected.autoReply);
    setForm(formFromProfile(connected.profile));
  }, [connected]);

  const finish = async (message: string) => {
    setAccessToken('');
    await queryClient.invalidateQueries({ queryKey: bridgeKeys.number });
    toast.showSuccess(message);
    goBackOrReturnTo(undefined, '/bridge');
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = profileFromForm(form);
      if ('error' in parsed) throw new Error(parsed.error);
      const token = accessToken.trim();
      if (connected && !token) return updateBridgeNumber({ profile: parsed.profile, autoReply });
      if (!/^\d+$/.test(phoneNumberId.trim()) || !token) throw new Error('Add the phone number ID (digits only) and access token from your Meta app.');
      return connectBridgeNumber({ phoneNumberId: phoneNumberId.trim(), accessToken: token, profile: parsed.profile, autoReply });
    },
    onSuccess: () => finish(connected ? 'Saved' : 'WhatsApp connected'),
    onError: (error) => Alert.alert('Could not save', error instanceof Error ? error.message : 'Try again.'),
  });

  const connectWithMeta = useMutation({
    mutationFn: async (code: string) => {
      const parsed = profileFromForm(form);
      if ('error' in parsed) throw new Error(parsed.error);
      return connectBridgeWithMeta({ code, profile: parsed.profile, autoReply });
    },
    onSuccess: () => finish('WhatsApp connected'),
    onError: (error) => Alert.alert('Could not connect WhatsApp', error instanceof Error ? error.message : 'Try again.'),
  });

  /** The business details are checked first, so a code from Meta is never wasted on a form that cannot be saved. */
  const startSignup = () => {
    const parsed = profileFromForm(form);
    if ('error' in parsed) return Alert.alert('Could not connect', parsed.error);
    setSigningUp(true);
  };

  if (number.isLoading) {
    return (
      <Body showBackground={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.textMuted} />
        </View>
      </Body>
    );
  }

  const canSignup = !connected && !!signup?.url;
  const detailsOpen = showDetails || (!connected && !signup?.url);
  const useSignup = canSignup && !detailsOpen;
  const dirty = !connected || !!accessToken.trim() || autoReply !== connected.autoReply || JSON.stringify(form) !== JSON.stringify(formFromProfile(connected.profile));
  const pending = save.isPending || connectWithMeta.isPending;
  const warning = connected ? alertMessage(connected.alert) : null;
  const Chevron = detailsOpen ? ChevronUp : ChevronDown;

  return (
    <Body showBackground={false} enableScroll={false} hideHorizontalInset hideBottomInset={process.env.EXPO_OS !== 'ios'}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}>
        <View className="flex-row items-center justify-between px-4 py-2">
          <BackButton onPress={() => goBackOrReturnTo(undefined, '/bridge')} />
          <Text className="text-[17px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.semiBold }}>
            Hypa Bridge
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Section
            title={connected ? 'WhatsApp connected' : 'Connect WhatsApp'}
            hint={
              connected
                ? connected.displayPhone
                  ? `Customers write to ${connected.displayPhone}.`
                  : 'Your number is connected.'
                : canSignup
                  ? 'Log in to WhatsApp and Hypa sets everything up. Fill in your business below first.'
                  : 'Add the number ID and access token from your WhatsApp app in Meta for Developers.'
            }>
            {warning ? (
              <Text accessibilityRole="alert" className="mb-3 text-[13px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
                {warning}
              </Text>
            ) : null}
            {connected || canSignup ? (
              <Pressable accessibilityRole="button" onPress={() => setShowDetails((value) => !value)} className="flex-row items-center justify-between">
                <Text className="text-[14px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
                  {connected ? 'Connection details' : 'Use a number ID and token instead'}
                </Text>
                <Chevron size={18} color={colors.iconMuted} />
              </Pressable>
            ) : null}
            {detailsOpen ? (
              <View className={connected || canSignup ? 'mt-3' : ''}>
                <Input value={phoneNumberId} onChangeText={setPhoneNumberId} placeholder="Phone number ID" editable={!connected} keyboardType="numeric" className="mb-3" />
                <Input
                  value={accessToken}
                  onChangeText={setAccessToken}
                  placeholder={connected ? 'New access token' : 'Access token'}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text className="mt-2 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                  {connected ? 'Leave the token empty to keep the current one. ' : ''}The token is checked with Meta and stored encrypted.
                </Text>
              </View>
            ) : null}
          </Section>

          <Section title="Replies">
            <View className="flex-row items-center justify-between">
              <View className="mr-4 flex-1">
                <Text className="text-[15px] text-zinc-900 dark:text-zinc-50" style={{ fontFamily: FONTS.main.medium }}>
                  Answer simple questions automatically
                </Text>
                <Text className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONTS.main.regular }}>
                  Orders, hand-offs and unlisted prices always wait for you.
                </Text>
              </View>
              <Switch checked={autoReply} onCheckedChange={setAutoReply} />
            </View>
          </Section>

          <Section title="Your business" hint="The assistant only uses what you write here.">
            <ProfileForm value={form} onChange={setForm} />
          </Section>
        </ScrollView>

        <View className="border-t border-zinc-100 px-4 pb-3 pt-3 dark:border-zinc-900">
          <Button disabled={pending || !dirty} onPress={() => (useSignup ? startSignup() : save.mutate())}>
            <Text>{pending ? (connected ? 'Saving…' : 'Connecting…') : connected ? 'Save changes' : useSignup ? 'Connect WhatsApp' : 'Connect'}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      {signingUp && signup?.url ? (
        <WhatsappSignup
          url={signup.url}
          redirectUri={signup.redirectUri}
          onClose={() => setSigningUp(false)}
          onCode={(code) => {
            setSigningUp(false);
            connectWithMeta.mutate(code);
          }}
        />
      ) : null}
    </Body>
  );
}

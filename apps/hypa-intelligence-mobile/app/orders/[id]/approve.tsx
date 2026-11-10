import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCommerceOrder, type CommerceOrder } from '@/api/commerce';
import { PaymentApprovalSheet } from '@/components/modules/chat/payment-approval-sheet';
import { approvalLabels } from '@hypa/intelligence-core/payment-approval';
import { useSettings } from '@/context/settings-context';
import { useThemeColors } from '@/hooks/use-theme-color';

/**
 * The approval link an outside agent hands the merchant. It opens the same
 * sheet the chat uses, so there is one review surface rather than two.
 */
export default function PaymentApprovalRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { settings } = useSettings();
  const colors = useThemeColors();
  const token = settings?.token?.trim() || undefined;
  const [order, setOrder] = useState<CommerceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!token || !id) { setLoading(false); return () => { active = false; }; }
    void getCommerceOrder(token, id)
      .then((result) => { if (active) setOrder(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not open this approval.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {loading ? <ActivityIndicator color={colors.textMuted} /> : null}
        {error && !loading ? <Text accessibilityRole="alert" style={{ color: colors.text, textAlign: 'center' }}>{error}</Text> : null}
        {!token && !loading ? (
          <Text style={{ color: colors.text, textAlign: 'center' }}>{approvalLabels(null).signIn}</Text>
        ) : null}
      </View>
      {order ? (
        <PaymentApprovalSheet approval={order} token={token} visible onClose={leave} toKeyboard={from === 'keyboard'} />
      ) : null}
    </SafeAreaView>
  );
}

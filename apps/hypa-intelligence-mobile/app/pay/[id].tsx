import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPaymentReceipt, type PaymentReceipt } from '@/api/commerce';
import { formatApprovalAmount } from '@hypa/intelligence-core/payment-approval';
import { receiptLabels } from '@hypa/intelligence-core/payment-receipt';
import { useThemeColors } from '@/hooks/use-theme-color';

const POLL_MS = 3000;
const POLL_LIMIT = 8;

/** Where PayPal's return page hands a payer who started in the app (hypaintelligence://pay/<id>?receipt=<token>). */
export default function PaymentReceiptRoute() {
  const { id, receipt: receiptToken } = useLocalSearchParams<{ id: string; receipt?: string }>();
  const colors = useThemeColors();
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id || !receiptToken) { setFailed(true); return; }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = (attempt: number) => {
      getPaymentReceipt(id, receiptToken, attempt === 0)
        .then((result) => {
          if (!active) return;
          setReceipt(result);
          const settled = result.status !== 'approved' || result.paymentStatus === 'paid' || result.paymentStatus === 'failed';
          if (!settled && attempt < POLL_LIMIT) timer = setTimeout(() => check(attempt + 1), POLL_MS);
        })
        .catch(() => { if (active) setFailed(true); });
    };
    check(0);
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [id, receiptToken]);

  const labels = receiptLabels(receipt?.language);
  const paid = receipt?.paymentStatus === 'paid' || receipt?.status === 'paid';
  const failedPayment = receipt?.paymentStatus === 'failed' || receipt?.status === 'failed';
  const cancelled = receipt?.status === 'cancelled';
  const { title, body } = paid
    ? { title: labels.successTitle, body: labels.successBody }
    : failedPayment
      ? { title: labels.failedTitle, body: labels.failedBody }
      : cancelled
        ? { title: labels.cancelledTitle, body: labels.cancelledBody }
        : receipt
          ? { title: labels.processingTitle, body: labels.processingBody }
          : { title: labels.unconfirmedTitle, body: labels.unconfirmedBody };

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        {!receipt && !failed ? <ActivityIndicator color={colors.textMuted} /> : (
          <>
            {receipt ? (
              <Text style={{ color: colors.text, fontSize: 34, fontWeight: '700' }}>
                {formatApprovalAmount(receipt.amount, receipt.currency, receipt.language)}
              </Text>
            ) : null}
            <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{body}</Text>
            {receipt?.merchant ? <Text style={{ color: colors.textMuted }}>{labels.paidTo}: {receipt.merchant}</Text> : null}
            {receipt?.reference ? <Text style={{ color: colors.textMuted }}>{labels.reference}: {receipt.reference}</Text> : null}
          </>
        )}
        <Pressable accessibilityRole="button" onPress={leave} style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

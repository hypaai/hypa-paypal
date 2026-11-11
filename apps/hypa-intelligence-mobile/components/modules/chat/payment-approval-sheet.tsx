import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PaymentApproval } from '@hypa/intelligence-core/agent-stream';
import {
  approveCommerceOrder,
  cancelCommerceOrder,
  createCommercePaymentLink,
  getCommerceOrder,
  type CommerceOrder,
} from '@/api/commerce';
import { useThemeColors } from '@/hooks/use-theme-color';
import * as Clipboard from 'expo-clipboard';
import { approvalLabels, formatApprovalAmount, lineTotal } from '@hypa/intelligence-core/payment-approval';
import { isPayPalUrl, type PaymentLink } from '@hypa/intelligence-core/payment-link';
import { handPaymentLinkToKeyboard } from '@/lib/keyboard-settings';
import { registerForPush } from '@/lib/push';

type Approval = PaymentApproval & { status?: CommerceOrder['status'] };

/**
 * The merchant's review sheet. Only the merchant's own tap moves an order out
 * of draft, so this shows what is being charged and to whom, and nothing about
 * how the order was produced.
 */
export function PaymentApprovalSheet({
  approval,
  token,
  visible,
  onClose,
  toKeyboard,
}: {
  approval: Approval;
  token?: string;
  visible: boolean;
  onClose: () => void;
  /** Opened from the keyboard: sharing also types the link into the chat the merchant came from. */
  toKeyboard?: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const labels = approvalLabels(approval.merchantLanguage);
  const money = (amount: string, currency: string) =>
    formatApprovalAmount(amount, currency, approval.merchantLanguage);

  const [order, setOrder] = useState<CommerceOrder>({ ...approval, status: approval.status ?? 'draft' });
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  // State updates land a moment late, so a quick second tap is stopped by this instead.
  const busy = useRef(false);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [handedOff, setHandedOff] = useState(false);
  const [polls, setPolls] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!visible || !token) return () => { active = false; };
    setLoading(true);
    setError('');
    void getCommerceOrder(token, approval.orderId)
      .then((current) => { if (active) setOrder(current); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load this order.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [approval.orderId, token, visible]);

  const run = useCallback(async (action: () => Promise<CommerceOrder>) => {
    if (!token || busy.current) return;
    busy.current = true;
    setWorking(true);
    setError('');
    try { setOrder(await action()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The order could not be updated.'); }
    finally { busy.current = false; setWorking(false); }
  }, [token]);

  /** The same order always gets the same checkout back, so it can be sent again. */
  const paymentLink = useCallback(async () => {
    if (link) return link;
    const created = await createCommercePaymentLink(token!, order.orderId);
    if (!isPayPalUrl(created.checkoutUrl)) throw new Error('PayPal returned an invalid checkout link.');
    setLink(created);
    return created;
  }, [link, order.orderId, token]);

  const withLink = useCallback(async (action: (current: PaymentLink) => Promise<void>) => {
    if (!token || busy.current) return;
    busy.current = true;
    setWorking(true);
    setError('');
    try {
      await action(await paymentLink());
      setOrder(await getCommerceOrder(token, order.orderId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare the payment link.');
    } finally { busy.current = false; setWorking(false); }
  }, [order.orderId, paymentLink, token]);

  const shareLink = useCallback(
    () => withLink(async (current) => {
      if (toKeyboard) {
        await handPaymentLinkToKeyboard(current.message);
        setHandedOff(true);
      }
      await Share.share({ message: current.message });
    }),
    [toKeyboard, withLink],
  );

  const copyLink = useCallback(
    () => withLink(async (current) => {
      await Clipboard.setStringAsync(current.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }),
    [withLink],
  );

  const waiting = Boolean(link) && order.status === 'approved';

  useEffect(() => {
    if (!visible || !token || !waiting) return;
    const timer = setTimeout(() => {
      setPolls((count) => count + 1);
      void getCommerceOrder(token, order.orderId).then(setOrder).catch(() => undefined);
    }, polls < 5 ? 3000 : 10000);
    return () => clearTimeout(timer);
  }, [order.orderId, polls, token, visible, waiting]);

  const settled =
    order.status === 'approved' ? labels.approved
    : order.status === 'cancelled' ? labels.cancelled
    : order.status === 'paid' ? labels.paid
    : order.status === 'failed' ? labels.failed
    : null;

  const note =
    error ? error
    : handedOff ? labels.linkReady
    : link ? `${copied ? `${labels.linkCopied} ` : ''}${labels.waitingBody}`
    : order.status === 'draft' ? labels.reviewBody
    : order.status === 'approved' ? labels.approvedBody
    : order.status === 'paid' ? labels.paidBody
    : order.status === 'cancelled' ? labels.cancelledBody
    : order.status === 'failed' ? labels.failedBody
    : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable accessibilityLabel="Close" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.handleRow}><View style={[styles.handle, { backgroundColor: colors.border }]} /></View>

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>{labels.review}</Text>
                <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textMuted }]}>
                  {order.customer.name} · {order.customer.contact}
                </Text>
              </View>
              {settled ? (
                <View style={[styles.badge, { borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.textMuted }]}>{settled}</Text>
                </View>
              ) : null}
            </View>

            {/* One card for the money, so the merchant reads the charge in a single place. */}
            <View style={[styles.card, { borderColor: colors.border }]}>
              {order.items.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.itemRow}>
                  <View style={styles.itemText}>
                    <Text numberOfLines={2} style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.textSubtle }]}>
                      {item.qty} × {money(item.unitPrice, order.currency)}
                    </Text>
                  </View>
                  <Text style={[styles.itemAmount, { color: colors.textMuted }]}>
                    {money(lineTotal(item.qty, item.unitPrice), order.currency)}
                  </Text>
                </View>
              ))}

              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textMuted }]}>{labels.total}</Text>
                <Text style={[styles.totalAmount, { color: colors.text }]}>
                  {money(order.amount, order.currency)}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeText, { color: colors.textSubtle }]}>{labels.fee}</Text>
                <Text style={[styles.feeText, { color: colors.textSubtle }]}>
                  {money(order.fee.amount, order.fee.currency)}
                </Text>
              </View>
            </View>

            {note ? (
              <Text
                accessibilityRole={error ? 'alert' : undefined}
                style={[styles.notice, { color: error ? colors.text : colors.textMuted }]}>
                {note}
              </Text>
            ) : null}

            {!token ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => { onClose(); router.push('/profile'); }}
                style={({ pressed }) => [styles.primaryAction, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}>
                <Text style={[styles.primaryActionText, { color: colors.primaryForeground }]}>Sign in</Text>
              </Pressable>
            ) : loading ? (
              <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: 14 }} />
            ) : order.status === 'draft' ? (
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={working}
                  onPress={() => void run(async () => {
                    const approved = await approveCommerceOrder(token, order.orderId, { amount: order.amount, currency: order.currency });
                    // The merchant is about to wait for a payment, so this is when to ask to be told.
                    void registerForPush(token, { ask: true }).catch(() => undefined);
                    return approved;
                  })}
                  style={({ pressed }) => [
                    styles.primaryAction,
                    { backgroundColor: colors.primary, opacity: working ? 0.5 : pressed ? 0.88 : 1 },
                  ]}>
                  {working
                    ? <ActivityIndicator color={colors.primaryForeground} />
                    : <Text style={[styles.primaryActionText, { color: colors.primaryForeground }]}>{labels.approve}</Text>}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={working}
                  onPress={() => void run(() => cancelCommerceOrder(token, order.orderId))}
                  style={({ pressed }) => [styles.quietAction, { opacity: working ? 0.5 : pressed ? 0.6 : 1 }]}>
                  <Text style={[styles.quietActionText, { color: colors.textMuted }]}>{labels.cancel}</Text>
                </Pressable>
              </View>
            ) : order.status === 'approved' ? (
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={working}
                  onPress={() => void shareLink()}
                  style={({ pressed }) => [
                    styles.primaryAction,
                    { backgroundColor: colors.primary, opacity: working ? 0.5 : pressed ? 0.88 : 1 },
                  ]}>
                  {working
                    ? <ActivityIndicator color={colors.primaryForeground} />
                    : <Text style={[styles.primaryActionText, { color: colors.primaryForeground }]}>{labels.sharePaymentLink}</Text>}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={working}
                  onPress={() => void copyLink()}
                  style={({ pressed }) => [styles.quietAction, { opacity: working ? 0.5 : pressed ? 0.6 : 1 }]}>
                  <Text style={[styles.quietActionText, { color: colors.textMuted }]}>
                    {copied ? labels.linkCopied : labels.copyLink}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8, zIndex: 1, elevation: 20 },
  handleRow: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, marginTop: 3 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: '500' },
  itemMeta: { fontSize: 13, fontVariant: ['tabular-nums'] },
  itemAmount: { fontSize: 15, fontVariant: ['tabular-nums'] },
  cardDivider: { height: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 },
  totalLabel: { fontSize: 14 },
  totalAmount: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: -4 },
  feeText: { fontSize: 12, fontVariant: ['tabular-nums'] },
  notice: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  actions: { gap: 4 },
  primaryAction: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryActionText: { fontSize: 16, fontWeight: '600' },
  quietAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quietActionText: { fontSize: 15, fontWeight: '500' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  summaryTitle: { fontSize: 15, fontWeight: '600' },
  summaryAmount: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

/** Orders already offered for review, so scrolling back does not reopen the sheet. */
const offered = new Set<string>();

/**
 * What the chat thread shows: one line the merchant can tap. A draft order
 * opens the sheet by itself the first time it arrives, since nothing can be
 * charged until the merchant acts on it.
 */
export function PaymentApprovalRow({ approval, token }: { approval: Approval; token?: string }) {
  const colors = useThemeColors();
  const labels = approvalLabels(approval.merchantLanguage);
  const [open, setOpen] = useState(false);

  // A card saved with a chat message carries no status, so the server is asked before the sheet
  // opens by itself: an order that is already approved, paid or cancelled must not pop the sheet
  // up again every time a chat loads.
  useEffect(() => {
    if ((approval.status ?? 'draft') !== 'draft' || !token || offered.has(approval.orderId)) return;
    let active = true;
    void getCommerceOrder(token, approval.orderId)
      .then((current) => {
        if (!active || current.status !== 'draft' || offered.has(approval.orderId)) return;
        offered.add(approval.orderId);
        setOpen(true);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [approval.orderId, approval.status, token]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.review}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.summary,
          { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.9 : 1 },
        ]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>{labels.review}</Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textMuted }]}>{approval.customer.name}</Text>
        </View>
        <Text style={[styles.summaryAmount, { color: colors.text }]}>
          {formatApprovalAmount(approval.amount, approval.currency, approval.merchantLanguage)}
        </Text>
      </Pressable>
      <PaymentApprovalSheet approval={approval} token={token} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

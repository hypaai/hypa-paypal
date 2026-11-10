import paymentConfig from './json/payments.json' with { type: 'json' };

export const payments = paymentConfig;

export function getToolFee(tool: string) {
  const fee = payments[tool as keyof typeof payments];
  if (!fee || typeof fee !== 'object' || !('amount' in fee) || !('currency' in fee)) {
    return undefined;
  }
  return fee;
}

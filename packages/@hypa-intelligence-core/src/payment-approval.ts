type ApprovalLabels = {
  review: string;
  customer: string;
  items: string;
  total: string;
  fee: string;
  approve: string;
  cancel: string;
  approved: string;
  cancelled: string;
  paid: string;
  failed: string;
  sharePaymentLink: string;
  working: string;
  openApp: string;
  signIn: string;
  merchantApproval: string;
  orderSummary: string;
  reviewBody: string;
  approvedBody: string;
  linkCopied: string;
  copyLink: string;
  waitingTitle: string;
  waitingBody: string;
  paidBody: string;
  failedTitle: string;
  failedBody: string;
  cancelledBody: string;
  linkReady: string;
};

const LABELS: Record<string, ApprovalLabels> = {
  en: { review: 'Review order', customer: 'Customer', items: 'Items', total: 'Total', fee: 'Hypa fee', approve: 'Approve order', cancel: 'Cancel order', approved: 'Approved', cancelled: 'Cancelled', paid: 'Paid', failed: 'Payment failed', sharePaymentLink: 'Share payment link', working: 'Please wait…', openApp: 'Open Hypa to approve', signIn: 'Sign in as the merchant to review this order.', merchantApproval: 'Merchant approval', orderSummary: 'Order summary', reviewBody: 'This order needs your approval. Check the details before the customer gets a payment link.', approvedBody: 'This order is approved. Send the payment link to the customer so they can pay.', linkCopied: 'Payment link copied. Send it to the customer.', copyLink: 'Copy payment link', waitingTitle: 'Waiting for payment', waitingBody: 'Waiting for the customer to pay. This updates by itself as soon as PayPal confirms.', paidBody: 'PayPal confirmed this payment.', failedTitle: 'Order unavailable', failedBody: 'This order could not be loaded, or the payment failed.', cancelledBody: 'This order was cancelled. No payment was taken.', linkReady: 'Go back to your chat. The payment link will be in the message box.' },
  fr: { review: 'Vérifier la commande', customer: 'Client', items: 'Articles', total: 'Total', fee: 'Frais Hypa', approve: 'Approuver la commande', cancel: 'Annuler la commande', approved: 'Approuvée', cancelled: 'Annulée', paid: 'Payée', failed: 'Paiement échoué', sharePaymentLink: 'Partager le lien de paiement', working: 'Veuillez patienter…', openApp: 'Ouvrir Hypa pour approuver', signIn: 'Connectez-vous en tant que marchand pour vérifier cette commande.', merchantApproval: 'Approbation du marchand', orderSummary: 'Récapitulatif de la commande', reviewBody: 'Cette commande attend votre approbation. Vérifiez les détails avant que le client reçoive un lien de paiement.', approvedBody: 'Cette commande est approuvée. Envoyez le lien de paiement au client pour qu’il puisse payer.', linkCopied: 'Lien de paiement copié. Envoyez-le au client.', copyLink: 'Copier le lien de paiement', waitingTitle: 'En attente du paiement', waitingBody: 'En attente du paiement du client. Cette page se met à jour dès que PayPal confirme.', paidBody: 'PayPal a confirmé ce paiement.', failedTitle: 'Commande indisponible', failedBody: 'Cette commande n’a pas pu être chargée ou le paiement a échoué.', cancelledBody: 'Cette commande a été annulée. Aucun paiement n’a été prélevé.', linkReady: 'Retournez à votre discussion. Le lien de paiement sera dans la zone de message.' },
  yo: { review: 'Ṣàyẹ̀wò àṣẹ', customer: 'Oníbàárà', items: 'Àwọn ọjà', total: 'Àpapọ̀', fee: 'Owó Hypa', approve: 'Fọwọ́sí àṣẹ', cancel: 'Fagilé àṣẹ', approved: 'A fọwọ́sí', cancelled: 'A fagilé', paid: 'A ti sanwó', failed: 'Ìsanwó kùnà', sharePaymentLink: 'Pín ìjápọ̀ ìsanwó', working: 'Jọ̀ọ́ dúró…', openApp: 'Ṣí Hypa láti fọwọ́sí', signIn: 'Wọlé gẹ́gẹ́ bí oníṣòwò láti ṣàyẹ̀wò àṣẹ yìí.', merchantApproval: 'Ìfọwọ́sí oníṣòwò', orderSummary: 'Àkótán àṣẹ', reviewBody: 'Àṣẹ yìí nílò ìfọwọ́sí rẹ. Ṣàyẹ̀wò àwọn kúlẹ̀kúlẹ̀ kí oníbàárà tó gba ìjápọ̀ ìsanwó.', approvedBody: 'A ti fọwọ́sí àṣẹ yìí. Fi ìjápọ̀ ìsanwó ránṣẹ́ sí oníbàárà kí ó lè sanwó.', linkCopied: 'A ti ṣẹ̀dà ìjápọ̀ ìsanwó. Fi ránṣẹ́ sí oníbàárà.', copyLink: 'Ṣẹ̀dà ìjápọ̀ ìsanwó', waitingTitle: 'À ń dúró de ìsanwó', waitingBody: 'À ń dúró kí oníbàárà sanwó. Èyí yóò yípadà fúnra rẹ̀ ní kété tí PayPal bá fìdí rẹ̀ múlẹ̀.', paidBody: 'PayPal ti fìdí ìsanwó yìí múlẹ̀.', failedTitle: 'Àṣẹ kò sí', failedBody: 'A kò lè ṣí àṣẹ yìí, tàbí ìsanwó kùnà.', cancelledBody: 'A ti fagilé àṣẹ yìí. A kò gba owó kankan.', linkReady: 'Padà sí ìjíròrò rẹ. Ìjápọ̀ ìsanwó yóò wà nínú àpótí ọ̀rọ̀.' },
  ig: { review: 'Lelee iwu akwụkwọ', customer: 'Onye ahịa', items: 'Ngwaahịa', total: 'Ngụkọta', fee: 'Ụgwọ Hypa', approve: 'Kwado iwu', cancel: 'Kagbuo iwu', approved: 'Ekwadoro', cancelled: 'Akagbuola', paid: 'Akwụla ụgwọ', failed: 'Ịkwụ ụgwọ adaghị', sharePaymentLink: 'Kesaa njikọ ịkwụ ụgwọ', working: 'Biko chere…', openApp: 'Mepee Hypa ka ị kwado', signIn: 'Banye dị ka onye ahịa iji nyochaa iwu a.', merchantApproval: 'Nnabata onye ahịa', orderSummary: 'Nchịkọta iwu', reviewBody: 'Iwu a chọrọ nnabata gị. Lelee nkọwa tupu onye ahịa enweta njikọ ịkwụ ụgwọ.', approvedBody: 'A nabatala iwu a. Zigara onye ahịa njikọ ịkwụ ụgwọ ka ọ kwụọ ụgwọ.', linkCopied: 'Edepụtala njikọ ịkwụ ụgwọ. Zigara ya onye ahịa.', copyLink: 'Depụta njikọ ịkwụ ụgwọ', waitingTitle: 'Na-echere ịkwụ ụgwọ', waitingBody: 'A na-eche ka onye ahịa kwụọ ụgwọ. Nke a na-emelite onwe ya ozugbo PayPal kwadoro ya.', paidBody: 'PayPal kwadoro ịkwụ ụgwọ a.', failedTitle: 'Iwu adịghị', failedBody: 'Enweghị ike ibu iwu a, maọbụ ịkwụ ụgwọ dara.', cancelledBody: 'A kagburu iwu a. Anataghị ego ọ bụla.', linkReady: "Laghachi na mkparịta ụka gị. Njikọ ịkwụ ụgwọ ga-adị n'igbe ozi." },
  ha: { review: 'Duba odar', customer: 'Abokin ciniki', items: 'Kayayyaki', total: 'Jimla', fee: 'Kuɗin Hypa', approve: 'Amince da odar', cancel: 'Soke odar', approved: 'An amince', cancelled: 'An soke', paid: 'An biya', failed: 'Biyan kuɗi ya gaza', sharePaymentLink: 'Raba hanyar biyan kuɗi', working: 'A jira…', openApp: 'Buɗe Hypa don amincewa', signIn: 'Shiga a matsayin ɗan kasuwa don duba wannan odar.', merchantApproval: 'Amincewar ɗan kasuwa', orderSummary: 'Takaitaccen oda', reviewBody: 'Wannan odar tana buƙatar amincewarka. Duba cikakken bayani kafin abokin ciniki ya samu hanyar biyan kuɗi.', approvedBody: 'An amince da wannan odar. Aika hanyar biyan kuɗi ga abokin ciniki don ya biya.', linkCopied: 'An kwafi hanyar biyan kuɗi. Aika ta ga abokin ciniki.', copyLink: 'Kwafi hanyar biyan kuɗi', waitingTitle: 'Ana jiran biyan kuɗi', waitingBody: 'Ana jiran abokin ciniki ya biya. Wannan zai sabunta da kansa da zarar PayPal ya tabbatar.', paidBody: 'PayPal ya tabbatar da wannan biyan.', failedTitle: 'Odar ba ta samuwa', failedBody: 'Ba a iya buɗe wannan odar ba, ko kuma biyan ya gaza.', cancelledBody: 'An soke wannan odar. Ba a karɓi kuɗi ba.', linkReady: 'Koma zuwa hirarku. Hanyar biyan kuɗi za ta kasance a akwatin saƙo.' },
  pcm: { review: 'Check the order', customer: 'Customer', items: 'Items', total: 'Total', fee: 'Hypa fee', approve: 'Approve order', cancel: 'Cancel order', approved: 'Approved', cancelled: 'Cancelled', paid: 'Paid', failed: 'Payment failed', sharePaymentLink: 'Share payment link', working: 'Abeg wait…', openApp: 'Open Hypa to approve', signIn: 'Sign in as di merchant make you check dis order.', merchantApproval: 'Merchant approval', orderSummary: 'Order summary', reviewBody: 'Dis order need your approval. Check di details before di customer go get payment link.', approvedBody: 'Dem don approve dis order. Send di payment link give di customer make e pay.', linkCopied: 'We don copy di payment link. Send am give di customer.', copyLink: 'Copy di payment link', waitingTitle: 'We dey wait for payment', waitingBody: 'We dey wait make di customer pay. Dis one go update by itself once PayPal confirm.', paidBody: 'PayPal don confirm dis payment.', failedTitle: 'Order no dey available', failedBody: 'We no fit open dis order, or di payment fail.', cancelledBody: 'Dem don cancel dis order. Dem no collect any money.', linkReady: 'Go back to your chat. Di payment link go dey inside di message box.' },
  es: { review: 'Revisar pedido', customer: 'Cliente', items: 'Artículos', total: 'Total', fee: 'Tarifa de Hypa', approve: 'Aprobar pedido', cancel: 'Cancelar pedido', approved: 'Aprobado', cancelled: 'Cancelado', paid: 'Pagado', failed: 'Pago fallido', sharePaymentLink: 'Compartir enlace de pago', working: 'Espera…', openApp: 'Abrir Hypa para aprobar', signIn: 'Inicia sesión como comerciante para revisar este pedido.', merchantApproval: 'Aprobación del comerciante', orderSummary: 'Resumen del pedido', reviewBody: 'Este pedido necesita tu aprobación. Revisa los detalles antes de que el cliente reciba un enlace de pago.', approvedBody: 'Este pedido está aprobado. Envía el enlace de pago al cliente para que pueda pagar.', linkCopied: 'Enlace de pago copiado. Envíalo al cliente.', copyLink: 'Copiar enlace de pago', waitingTitle: 'Esperando el pago', waitingBody: 'Esperando a que el cliente pague. Esto se actualiza solo en cuanto PayPal lo confirme.', paidBody: 'PayPal confirmó este pago.', failedTitle: 'Pedido no disponible', failedBody: 'No se pudo cargar este pedido o el pago falló.', cancelledBody: 'Este pedido fue cancelado. No se cobró ningún pago.', linkReady: 'Vuelve a tu chat. El enlace de pago estará en el cuadro de mensaje.' },
  pt: { review: 'Revisar pedido', customer: 'Cliente', items: 'Itens', total: 'Total', fee: 'Taxa Hypa', approve: 'Aprovar pedido', cancel: 'Cancelar pedido', approved: 'Aprovado', cancelled: 'Cancelado', paid: 'Pago', failed: 'Pagamento falhou', sharePaymentLink: 'Partilhar ligação de pagamento', working: 'Aguarde…', openApp: 'Abrir Hypa para aprovar', signIn: 'Inicie sessão como comerciante para rever este pedido.', merchantApproval: 'Aprovação do comerciante', orderSummary: 'Resumo do pedido', reviewBody: 'Este pedido precisa da sua aprovação. Verifique os detalhes antes de o cliente receber uma ligação de pagamento.', approvedBody: 'Este pedido está aprovado. Envie a ligação de pagamento ao cliente para que possa pagar.', linkCopied: 'Ligação de pagamento copiada. Envie-a ao cliente.', copyLink: 'Copiar ligação de pagamento', waitingTitle: 'À espera do pagamento', waitingBody: 'À espera do pagamento do cliente. Isto atualiza-se sozinho assim que o PayPal confirmar.', paidBody: 'O PayPal confirmou este pagamento.', failedTitle: 'Pedido indisponível', failedBody: 'Não foi possível carregar este pedido ou o pagamento falhou.', cancelledBody: 'Este pedido foi cancelado. Não foi cobrado nenhum pagamento.', linkReady: 'Volte à sua conversa. A ligação de pagamento estará na caixa de mensagem.' },
};

export const approvalLabels = (language?: string | null): ApprovalLabels =>
  LABELS[(language ?? 'en').trim().toLowerCase().split(/[-_]/, 1)[0]] ?? LABELS.en;

function intlLocale(language?: string | null) {
  const code = (language ?? 'en').trim().toLowerCase().split(/[-_]/, 1)[0];
  const locale = (({ yo: 'yo-NG', ig: 'ig-NG', ha: 'ha-NG', pcm: 'en-NG' } as Record<string, string>)[code] ?? code) || 'en';
  try {
    new Intl.NumberFormat(locale).format(1);
    return locale;
  } catch {
    return 'en';
  }
}

/**
 * React Native's Hermes engine provides Intl.NumberFormat but not
 * formatToParts, so the grouping sizes and separators are read back out of
 * formatted samples instead of asking for the parts directly.
 */
function localeNumberShape(locale: string) {
  const fallback = { localDigits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], groupSeparator: ',', primaryGroupSize: 3, secondaryGroupSize: 3, decimal: '.' };
  try {
    const digits = new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 0 });
    const localDigits = Array.from({ length: 10 }, (_, digit) => digits.format(digit));
    const runs = (text: string) => {
      const groups: string[] = [];
      const separators: string[] = [];
      let group = '';
      let separator = '';
      for (const character of text) {
        if (localDigits.includes(character)) {
          if (separator) { separators.push(separator); separator = ''; }
          group += character;
        } else {
          if (group) { groups.push(group); group = ''; }
          separator += character;
        }
      }
      if (group) groups.push(group);
      if (separator) separators.push(separator);
      return { groups, separators };
    };
    const grouped = runs(new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(1234567890123));
    const primaryGroupSize = grouped.groups.at(-1)?.length ?? 3;
    return {
      localDigits,
      groupSeparator: grouped.separators[0],
      primaryGroupSize,
      secondaryGroupSize: grouped.groups.at(-2)?.length ?? primaryGroupSize,
      decimal: runs(new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(1.1)).separators[0] ?? '.',
    };
  } catch {
    return fallback;
  }
}

/** Formats decimal text without converting money to a floating-point number. */
/**
 * qty × unitPrice as a decimal string. Money never goes through a float, so
 * the line total is scaled to whole units and multiplied as an integer.
 */
export function lineTotal(qty: number, unitPrice: string): string {
  const [whole, fraction = ''] = unitPrice.split('.');
  const scaled = BigInt(`${whole}${fraction}`) * BigInt(Math.round(qty));
  const digits = scaled.toString().padStart(fraction.length + 1, '0');

  return fraction.length
    ? `${digits.slice(0, -fraction.length)}.${digits.slice(-fraction.length)}`
    : digits;
}

export function formatApprovalAmount(amount: string, currency: string, language?: string | null) {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount);
  if (!match || !/^[A-Z]{3}$/.test(currency)) return `${currency} ${amount}`;
  const locale = intlLocale(language);
  let currencyDigits = 2;
  try {
    currencyDigits = new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch { /* Keep two fraction digits for unknown currency/runtime data. */ }
  const fraction = match[2] ?? '';
  const fractionLength = Math.max(currencyDigits, fraction.length);
  const { localDigits, groupSeparator, primaryGroupSize, secondaryGroupSize, decimal } = localeNumberShape(locale);
  const groups: string[] = [];
  let remaining = match[1];
  groups.unshift(remaining.slice(-primaryGroupSize));
  remaining = remaining.slice(0, -primaryGroupSize);
  while (remaining.length) {
    groups.unshift(remaining.slice(-secondaryGroupSize));
    remaining = remaining.slice(0, -secondaryGroupSize);
  }
  const localizeDigits = (value: string) => value.replace(/[0-9]/g, (digit) => localDigits[Number(digit)]);
  const integer = groups.map(localizeDigits).join(groupSeparator ?? '');
  const localizedFraction = localizeDigits(fraction.padEnd(fractionLength, '0'));
  return `${integer}${fractionLength ? `${decimal}${localizedFraction}` : ''} ${currency}`;
}

/**
 * Said by the merchant's own language, so each is short and says one thing. Languages without an
 * entry fall back to English. The Yoruba, Igbo, Hausa and Pidgin lines want a native speaker's check.
 */
const CUSTOMER_PAID: Record<string, string> = {
  en: '{name} has paid {amount}.',
  fr: '{name} a payé {amount}.',
  es: '{name} ha pagado {amount}.',
  pt: '{name} pagou {amount}.',
  yo: '{name} ti san {amount}.',
  ig: '{name} akwụọla {amount}.',
  ha: '{name} ya biya {amount}.',
  pcm: '{name} don pay {amount}.',
};

/** What the merchant is told once a customer's payment has gone through. The amount is never translated as words. */
export function paidMessage(
  language: string | null | undefined,
  customerName: string,
  amount: string,
  currency: string,
): string {
  const code = (language ?? 'en').trim().toLowerCase().split(/[-_]/, 1)[0];

  return (CUSTOMER_PAID[code] ?? CUSTOMER_PAID.en)
    .replace('{name}', () => customerName)
    .replace('{amount}', () => formatApprovalAmount(amount, currency, language));
}

type ReceiptLabels = {
  successTitle: string;
  successBody: string;
  processingTitle: string;
  processingBody: string;
  unconfirmedTitle: string;
  unconfirmedBody: string;
  failedTitle: string;
  failedBody: string;
  cancelledTitle: string;
  cancelledBody: string;
  paidTo: string;
  reference: string;
  checkAgain: string;
};

/**
 * What the customer reads after PayPal, in the customer's own language. They
 * have no Hypa account and no business with the merchant's tools, so this says
 * what happened to their money and nothing else. A payment that is not yet
 * captured never reads as done: the one mistake that costs a customer twice is
 * being told it worked when it has not.
 */
const LABELS: Record<string, ReceiptLabels> = {
  en: { successTitle: 'Payment successful', successBody: 'Your payment is complete. You can close this page.', processingTitle: 'Payment processing', processingBody: 'PayPal is still confirming your payment. Keep this page open for a moment, and do not pay again.', unconfirmedTitle: 'Payment not confirmed yet', unconfirmedBody: 'We could not confirm your payment. Keep the reference below and check again in a moment. Do not pay again.', failedTitle: 'Payment failed', failedBody: 'You have not been charged. Open the payment link again to try once more.', cancelledTitle: 'Payment cancelled', cancelledBody: 'You have not been charged. You can close this page.', paidTo: 'Paid to', reference: 'Reference', checkAgain: 'Check again' },
  fr: { successTitle: 'Paiement réussi', successBody: 'Votre paiement est terminé. Vous pouvez fermer cette page.', processingTitle: 'Paiement en cours', processingBody: 'PayPal confirme encore votre paiement. Gardez cette page ouverte un instant et ne payez pas une seconde fois.', unconfirmedTitle: 'Paiement pas encore confirmé', unconfirmedBody: 'Nous n’avons pas pu confirmer votre paiement. Conservez la référence ci-dessous et réessayez dans un instant. Ne payez pas une seconde fois.', failedTitle: 'Paiement échoué', failedBody: 'Vous n’avez pas été débité. Rouvrez le lien de paiement pour réessayer.', cancelledTitle: 'Paiement annulé', cancelledBody: 'Vous n’avez pas été débité. Vous pouvez fermer cette page.', paidTo: 'Payé à', reference: 'Référence', checkAgain: 'Vérifier à nouveau' },
  yo: { successTitle: 'Ìsanwó yọrí sí rere', successBody: 'Ìsanwó rẹ ti parí. O lè ti ojú-ìwé yìí.', processingTitle: 'Ìsanwó ń lọ lọ́wọ́', processingBody: 'PayPal ṣì ń fìdí ìsanwó rẹ múlẹ̀. Fi ojú-ìwé yìí sílẹ̀ fún ìṣẹ́jú kan, má sì sanwó lẹ́ẹ̀kejì.', unconfirmedTitle: 'A kò tíì fìdí ìsanwó múlẹ̀', unconfirmedBody: 'A kò lè fìdí ìsanwó rẹ múlẹ̀. Pa nọ́mbà ìtọ́kasí tó wà nísàlẹ̀ mọ́, kí o sì ṣàyẹ̀wò lẹ́ẹ̀kan sí i. Má sanwó lẹ́ẹ̀kejì.', failedTitle: 'Ìsanwó kùnà', failedBody: 'A kò gba owó lọ́wọ́ rẹ. Ṣí ìjápọ̀ ìsanwó náà lẹ́ẹ̀kan sí i láti gbìyànjú.', cancelledTitle: 'A fagilé ìsanwó', cancelledBody: 'A kò gba owó lọ́wọ́ rẹ. O lè ti ojú-ìwé yìí.', paidTo: 'Sanwó fún', reference: 'Nọ́mbà ìtọ́kasí', checkAgain: 'Ṣàyẹ̀wò lẹ́ẹ̀kan sí i' },
  ig: { successTitle: 'Ịkwụ ụgwọ gara nke ọma', successBody: 'Ị kwụchaala ụgwọ gị. Ị nwere ike imechi ibe a.', processingTitle: 'A na-ahazi ịkwụ ụgwọ', processingBody: 'PayPal ka na-akwado ịkwụ ụgwọ gị. Hapụ ibe a ka ọ ghere oge nta, akwụkwala ụgwọ ọzọ.', unconfirmedTitle: 'Akwadobeghị ịkwụ ụgwọ', unconfirmedBody: 'Anyị enweghị ike ikwado ịkwụ ụgwọ gị. Debe nọmba nrụtụaka dị n’okpuru ma lelee ọzọ n’oge na-adịghị anya. Akwụkwala ụgwọ ọzọ.', failedTitle: 'Ịkwụ ụgwọ dara', failedBody: 'Anataghị gị ego. Mepee njikọ ịkwụ ụgwọ ahụ ọzọ ka ị nwaa ọzọ.', cancelledTitle: 'A kagburu ịkwụ ụgwọ', cancelledBody: 'Anataghị gị ego. Ị nwere ike imechi ibe a.', paidTo: 'Kwụrụ', reference: 'Nọmba nrụtụaka', checkAgain: 'Lelee ọzọ' },
  ha: { successTitle: 'Biyan kuɗi ya yi nasara', successBody: 'An kammala biyan ka. Za ka iya rufe wannan shafin.', processingTitle: 'Ana aiwatar da biyan kuɗi', processingBody: 'PayPal na cikin tabbatar da biyan ka. Bar wannan shafin a buɗe na ɗan lokaci, kada kuma ka sake biya.', unconfirmedTitle: 'Ba a tabbatar da biyan kuɗi ba tukuna', unconfirmedBody: 'Ba mu iya tabbatar da biyan ka ba. Ajiye lambar tunani da ke ƙasa ka sake dubawa nan ba da jimawa ba. Kada ka sake biya.', failedTitle: 'Biyan kuɗi ya gaza', failedBody: 'Ba a karɓi kuɗi daga gare ka ba. Sake buɗe hanyar biyan kuɗi ka sake gwadawa.', cancelledTitle: 'An soke biyan kuɗi', cancelledBody: 'Ba a karɓi kuɗi daga gare ka ba. Za ka iya rufe wannan shafin.', paidTo: 'An biya wa', reference: 'Lambar tunani', checkAgain: 'Sake dubawa' },
  pcm: { successTitle: 'Payment don enter', successBody: 'Your payment don complete. You fit close dis page.', processingTitle: 'Dem dey process di payment', processingBody: 'PayPal still dey confirm your payment. Leave dis page open small, and no pay again.', unconfirmedTitle: 'We never fit confirm di payment', unconfirmedBody: 'We never fit confirm your payment. Keep di reference wey dey below, make you check again small time. No pay again.', failedTitle: 'Payment fail', failedBody: 'Dem no collect any money from you. Open di payment link again make you try.', cancelledTitle: 'Dem cancel di payment', cancelledBody: 'Dem no collect any money from you. You fit close dis page.', paidTo: 'You pay', reference: 'Reference', checkAgain: 'Check again' },
  es: { successTitle: 'Pago realizado', successBody: 'Tu pago se completó. Puedes cerrar esta página.', processingTitle: 'Procesando el pago', processingBody: 'PayPal aún está confirmando tu pago. Deja esta página abierta un momento y no vuelvas a pagar.', unconfirmedTitle: 'Pago sin confirmar', unconfirmedBody: 'No pudimos confirmar tu pago. Guarda la referencia de abajo y vuelve a comprobarlo en un momento. No vuelvas a pagar.', failedTitle: 'Pago fallido', failedBody: 'No se te ha cobrado. Abre el enlace de pago para intentarlo de nuevo.', cancelledTitle: 'Pago cancelado', cancelledBody: 'No se te ha cobrado. Puedes cerrar esta página.', paidTo: 'Pagado a', reference: 'Referencia', checkAgain: 'Comprobar de nuevo' },
  pt: { successTitle: 'Pagamento concluído', successBody: 'O seu pagamento foi concluído. Pode fechar esta página.', processingTitle: 'A processar o pagamento', processingBody: 'O PayPal ainda está a confirmar o seu pagamento. Deixe esta página aberta por um momento e não pague outra vez.', unconfirmedTitle: 'Pagamento por confirmar', unconfirmedBody: 'Não foi possível confirmar o seu pagamento. Guarde a referência abaixo e verifique novamente dentro de momentos. Não pague outra vez.', failedTitle: 'Pagamento falhou', failedBody: 'Não lhe foi cobrado nada. Abra novamente a ligação de pagamento para tentar outra vez.', cancelledTitle: 'Pagamento cancelado', cancelledBody: 'Não lhe foi cobrado nada. Pode fechar esta página.', paidTo: 'Pago a', reference: 'Referência', checkAgain: 'Verificar novamente' },
};

export const receiptLabels = (language?: string | null): ReceiptLabels =>
  LABELS[(language ?? 'en').trim().toLowerCase().split(/[-_]/, 1)[0]] ?? LABELS.en;

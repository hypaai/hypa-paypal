import { WhatsappPaymentService } from './whatsapp.payment';
import { runHypaTool } from '@hypa/intelligence-core';
import * as client from './whatsapp.client';
import { decryptString } from 'src/utils/encryption.utils';

jest.mock('./whatsapp.client');
jest.mock('src/utils/encryption.utils', () => ({ decryptString: jest.fn(), encryptString: jest.fn() }));
jest.mock('@hypa/intelligence-core', () => ({ HYPA_TOOLS: [{ name: 'paypal' }], runHypaTool: jest.fn() }));
const clientMock = jest.mocked(client);

const LINK = 'https://www.sandbox.paypal.com/checkoutnow?token=T1';
const thread = { customer_wa_id: 'enc', customer_name: 'Ada', last_inbound_at: new Date(), number: { phone_number_id: 'pn-1', userId: 'owner-1' } };

function setup(options: { claim?: number; status?: string; inbound?: Date; language?: string | null } = {}) {
  const link = { order_id: 'order-1', threadId: 'thread-1', thread: { ...thread, last_inbound_at: options.inbound ?? thread.last_inbound_at } };
  const db = {
    whatsapp_order: {
      updateMany: jest.fn().mockResolvedValue({ count: options.claim ?? 1 }),
      update: jest.fn().mockResolvedValue({}),
      findUniqueOrThrow: jest.fn().mockResolvedValue(link),
      findFirst: jest.fn().mockResolvedValue({ order_id: 'order-1' }),
    },
    commerce_order: {
      findUnique: jest.fn().mockResolvedValue({ status: options.status ?? 'approved' }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'order-1', status: options.status ?? 'approved', amount: '95.50', currency: 'USD', customer: { language: options.language === undefined ? 'yo' : options.language } }),
    },
    whatsapp_draft: { create: jest.fn().mockResolvedValue({}) },
  };
  const tools = { forCaller: jest.fn().mockReturnValue({}) };
  const billing = { findOrCreateUserApiKey: jest.fn().mockResolvedValue({ id: 'key-1' }) };
  const events = { on: jest.fn() };
  return { service: new WhatsappPaymentService(db as never, tools as never, billing as never, events as never), db, tools, events };
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(decryptString).mockResolvedValue('2348000000001');
  jest.mocked(runHypaTool).mockResolvedValue({ checkoutUrl: LINK, message: `Fi owo USD 95.50 san:\n${LINK}` } as never);
  clientMock.sendText.mockResolvedValue({} as never);
  clientMock.sendTemplate.mockResolvedValue({} as never);
});

describe('the payment link', () => {
  it('is sent in the customer language with the amount and the link unchanged, once the order is approved', async () => {
    const { service, tools, db } = setup();
    await service.sendLink('order-1');
    expect(tools.forCaller).toHaveBeenCalledWith(expect.objectContaining({ userId: 'owner-1', merchantId: 'owner-1' }));
    expect(runHypaTool).toHaveBeenCalledWith({ name: 'paypal' }, {}, { action: 'send_payment_link', orderId: 'order-1' });
    const [, to, text] = clientMock.sendText.mock.calls[0];
    expect(to).toBe('2348000000001');
    expect(text).toContain('USD 95.50');
    expect(text.endsWith(`
${LINK}`)).toBe(true);
    expect(db.whatsapp_draft.create).toHaveBeenCalledWith({ data: expect.objectContaining({ threadId: 'thread-1', status: 'sent', text }) });
  });

  it('is sent once: a second approval, or an order that did not start on WhatsApp, sends nothing', async () => {
    const { service } = setup({ claim: 0 });
    await service.sendLink('order-1');
    expect(runHypaTool).not.toHaveBeenCalled();
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });

  it('goes out as the approved template after the 24-hour window, in English unless the language is approved', async () => {
    const { service } = setup({ inbound: new Date(Date.now() - 25 * 60 * 60 * 1000) });
    await service.sendLink('order-1');
    expect(clientMock.sendText).not.toHaveBeenCalled();
    expect(clientMock.sendTemplate).toHaveBeenCalledWith('pn-1', '2348000000001', {
      name: 'invoice_ready',
      parameters: ['USD 95.50', LINK],
      language: 'en',
    });
    process.env.WHATSAPP_TEMPLATE_LANGUAGES = 'fr, yo';
    clientMock.sendTemplate.mockClear();
    await setup({ inbound: new Date(Date.now() - 25 * 60 * 60 * 1000) }).service.sendLink('order-1');
    expect(clientMock.sendTemplate.mock.calls[0][2].language).toBe('yo');
    delete process.env.WHATSAPP_TEMPLATE_LANGUAGES;
  });

  it('gives the claim back when sending fails, so the owner can approve again', async () => {
    const { service, db } = setup();
    clientMock.sendText.mockRejectedValueOnce(new Error('Meta is down'));
    await expect(service.sendLink('order-1')).rejects.toThrow('Meta is down');
    expect(db.whatsapp_order.update).toHaveBeenCalledWith({ where: { order_id: 'order-1' }, data: { link_sent_at: null } });
  });

  it('sends nothing for an order that is not approved', async () => {
    const { service } = setup({ status: 'draft' });
    await service.sendLink('order-1');
    expect(runHypaTool).not.toHaveBeenCalled();
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });
});

describe('sending the link again', () => {
  it('lets the owner send an approved order\'s link, whether or not it went before', async () => {
    const { service, db } = setup({ claim: 1 });
    await service.resendLink('owner-1', 'order-1');
    expect(db.whatsapp_order.findFirst).toHaveBeenCalledWith({ where: { order_id: 'order-1', thread: { number: { userId: 'owner-1' } } } });
    expect(db.whatsapp_order.update).toHaveBeenCalledWith({ where: { order_id: 'order-1' }, data: { link_sent_at: null } });
    expect(clientMock.sendText).toHaveBeenCalledTimes(1);
  });

  it('refuses another business\'s order and an order that is not approved', async () => {
    const { service, db } = setup();
    db.whatsapp_order.findFirst.mockResolvedValueOnce(null);
    await expect(service.resendLink('owner-2', 'order-1')).rejects.toThrow('Order not found');
    const draft = setup({ status: 'draft' }).service;
    await expect(draft.resendLink('owner-1', 'order-1')).rejects.toThrow('Only an approved order');
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });

  it('tells the owner why when sending fails', async () => {
    const { service, db } = setup({ claim: 1 });
    jest.mocked(runHypaTool).mockRejectedValueOnce(new Error('PayPal credentials are not configured'));
    await expect(service.resendLink('owner-1', 'order-1')).rejects.toThrow('PayPal credentials are not configured');
  });
});

describe('the receipt', () => {
  it('is sent in the customer language when the order is paid', async () => {
    const { service } = setup({ status: 'paid', language: 'fr' });
    await service.sendReceipt('order-1');
    expect(clientMock.sendText).toHaveBeenCalledWith('pn-1', '2348000000001', 'Paiement réussi: USD 95.50');
  });

  it('is not sent for an order that is not paid', async () => {
    const { service } = setup({ status: 'approved' });
    await service.sendReceipt('order-1');
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });
});

it('listens for approvals and payments', () => {
  const { service, events } = setup();
  service.onModuleInit();
  expect(events.on).toHaveBeenCalledWith('approved', expect.any(Function));
  expect(events.on).toHaveBeenCalledWith('paid', expect.any(Function));
});

import { runHypaTool } from '@hypa/intelligence-core';
import type { AgentEvent } from '../agent/agent.loop';
import errorCodes from '@hypa/config/json/error-codes';
import { Prisma } from 'src/generated/prisma/client';
import { customerHash, requestIdFor, WhatsappService, withinServiceWindow } from './whatsapp.service';
import * as client from './whatsapp.client';
import { type IncomingMessage } from './whatsapp.payload';

jest.mock('src/utils/encryption.utils', () => ({
  encryptString: jest.fn(async (value: string) => `enc:${value}`),
  decryptString: jest.fn(async (value: string) => value.replace(/^enc:/, '')),
}));
jest.mock('./whatsapp.client');
jest.mock('./whatsapp.audio', () => ({ convertAudio: jest.fn(async (bytes: Buffer) => bytes) }));

const clientMock = jest.mocked(client);

const number = {
  id: 'num-1',
  userId: 'owner-1',
  phone_number_id: 'pn-1',
  auto_reply: false,
  alert: null as string | null,
  profile: {
    name: 'Mama Ade Tailors',
    sells: 'Agbada and ankara',
    currency: 'NGN',
    priceList: [{ name: 'Agbada', price: 45000 }, { name: 'Cap', price: 5000 }],
    languages: ['Yoruba', 'English'],
  },
};

const thread = {
  id: 'thread-1',
  numberId: 'num-1',
  chatId: 'chat-1',
  customer_hash: 'hash',
  customer_wa_id: 'enc:2348000000001',
  customer_name: 'Amara',
  mode: 'agent',
  last_inbound_at: new Date(),
  order: null,
};

const text = (id = 'wamid.1'): IncomingMessage => ({
  id,
  phoneNumberId: 'pn-1',
  from: '2348000000001',
  name: 'Amara',
  sentAt: new Date(),
  kind: 'text',
  text: 'Mo fẹ agbada meji',
});

const done = (reply: string): AgentEvent => ({ type: 'done', action: 'show', text: reply, speak: false, usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });

function setup(options: { numberRow?: Partial<typeof number> | null; threadRow?: Partial<typeof thread>; events?: AgentEvent[]; toolCalls?: (tools: any[]) => Promise<void> } = {}) {
  const numberRow = options.numberRow === null ? null : { ...number, ...options.numberRow };
  const threadRow = { ...thread, ...options.threadRow };
  const db = {
    whatsapp_event: { create: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    whatsapp_number: { findUnique: jest.fn().mockResolvedValue(numberRow), update: jest.fn().mockResolvedValue({}) },
    whatsapp_thread: {
      findUnique: jest.fn().mockResolvedValue(threadRow),
      update: jest.fn().mockResolvedValue(threadRow),
      create: jest.fn().mockResolvedValue(threadRow),
      findFirst: jest.fn(),
    },
    whatsapp_draft: {
      create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'draft-1', status: 'pending', audio_key: null, image_keys: [], ...data })),
      update: jest.fn().mockImplementation(async ({ data }) => ({ id: 'draft-1', ...data })),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn(),
    },
    chat: { create: jest.fn().mockResolvedValue({ id: 'chat-1' }) },
    message: { create: jest.fn().mockResolvedValue({}) },
  };
  const agent = {
    open: jest.fn().mockImplementation(async (input) => {
      await options.toolCalls?.(input.extraTools);
      return { finished: Promise.resolve(), events: options.events ?? [done('Mo ti gba, ẹ ṣé.')] };
    }),
  };
  const media = { get: jest.fn().mockResolvedValue(Buffer.from('audio')) };
  const service = new WhatsappService(db as never, agent as never, media as never);
  return { service, db, agent, media };
}

beforeEach(() => {
  jest.clearAllMocks();
  clientMock.sendText.mockResolvedValue({});
  clientMock.sendTemplate.mockResolvedValue({});
  clientMock.sendAudio.mockResolvedValue({});
  clientMock.uploadMedia.mockResolvedValue('uploaded-1');
  clientMock.downloadMedia.mockResolvedValue({ bytes: Buffer.from('ogg-bytes'), mimeType: 'audio/ogg; codecs=opus' });
});

describe('claimNew', () => {
  it('runs a message once: a second delivery of the same id is dropped', async () => {
    const { service, db } = setup();
    db.whatsapp_event.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
    expect((await service.claimNew([text('wamid.1')])).map((message) => message.id)).toEqual(['wamid.1']);
    expect(await service.claimNew([text('wamid.1')])).toEqual([]);
  });

  it('prunes old claims, and gives a claim back so a retry is not dropped as a duplicate', async () => {
    const { service, db } = setup();
    await service.claimNew([text('wamid.1')]);
    expect(db.whatsapp_event.deleteMany).toHaveBeenCalledWith({ where: { created_at: { lt: expect.any(Date) } } });
    await service.release([text('wamid.1')]);
    expect(db.whatsapp_event.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['wamid.1'] } } });
  });

  it('does not hide a real database failure as a duplicate', async () => {
    const { service, db } = setup();
    db.whatsapp_event.create.mockRejectedValueOnce(new Error('connection lost'));
    await expect(service.claimNew([text()])).rejects.toThrow('connection lost');
  });
});

describe('handle: text', () => {
  it('runs the business agent for the owner, in the customer thread, with the price list in its instructions', async () => {
    const { service, agent } = setup();
    await service.handle(text());
    const call = agent.open.mock.calls[0][0];
    expect(call).toMatchObject({
      userId: 'owner-1',
      chatId: 'chat-1',
      provider: 'meta',
      model: 'muse-spark-1.3',
      input: 'Mo fẹ agbada meji',
      requestId: requestIdFor('wamid.1'),
    });
    expect(call.systemInstruction).toContain('Mama Ade Tailors');
    expect(call.systemInstruction).toContain('- Agbada: 45000');
    expect(call.toolNames).not.toContain('paypal');
    expect(call.extraTools.map((tool: { name: string }) => tool.name)).toEqual(['record_order', 'ask_owner']);
  });

  it('leaves the reply as a draft for the owner by default and sends nothing', async () => {
    const { service, db } = setup();
    await service.handle(text());
    expect(db.whatsapp_draft.create).toHaveBeenCalledWith({ data: expect.objectContaining({ threadId: 'thread-1', text: 'Mo ti gba, ẹ ṣé.', needs_owner: false, price_warning: false }) });
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });

  it('ignores a message for a number that is not connected', async () => {
    const { service, agent } = setup({ numberRow: null });
    await service.handle(text());
    expect(agent.open).not.toHaveBeenCalled();
  });
});

describe('handle: voice note and photo', () => {
  it('lets the agent transcribe a voice note, and gives it no tool that runs up the owner wallet on a stranger\'s say-so', async () => {
    const { service, agent } = setup();
    await service.handle(text());
    const { toolNames } = agent.open.mock.calls[0][0];
    expect(toolNames).toContain('speech_to_text');
    expect(toolNames).not.toContain('create_image');
  });

  it('turns a voice note into audio for the agent to transcribe and asks for a voice reply', async () => {
    const { service, agent } = setup();
    await service.handle({ ...text(), kind: 'voice', text: undefined, mediaId: 'media-1' });
    expect(clientMock.downloadMedia).toHaveBeenCalledWith('media-1');
    expect(agent.open.mock.calls[0][0]).toMatchObject({ input: '', audioType: 'base64', preferAudio: true, audio: Buffer.from('ogg-bytes').toString('base64') });
  });

  it('attaches a photo, keeping its caption as the text', async () => {
    clientMock.downloadMedia.mockResolvedValueOnce({ bytes: Buffer.from('jpeg'), mimeType: 'image/jpeg' });
    const { service, agent } = setup();
    await service.handle({ ...text(), kind: 'image', text: 'My order', mediaId: 'media-2' });
    expect(agent.open.mock.calls[0][0]).toMatchObject({ input: 'My order', attachments: [{ data: Buffer.from('jpeg').toString('base64'), mime: 'image/jpeg' }] });
  });

  it('tells the agent to answer a sticker or location politely', async () => {
    const { service, agent } = setup();
    await service.handle({ ...text(), kind: 'unsupported', text: undefined });
    expect(agent.open.mock.calls[0][0].input).toMatch(/sticker, a location or a document/);
  });
});

describe('orders and prices', () => {
  const order = { items: [{ name: 'Agbada', qty: 2, unitPrice: 45000 }], dueDate: 'Saturday', missing: ['sizes'] };

  it('saves the recorded order on the thread and holds the reply for the owner even with auto-reply on', async () => {
    const { service, db } = setup({
      numberRow: { auto_reply: true },
      toolCalls: async (tools) => void (await runHypaTool(tools.find((tool) => tool.name === 'record_order'), {} as never, order)),
    });
    await service.handle(text());
    expect(db.whatsapp_thread.update).toHaveBeenCalledWith({ where: { id: 'thread-1' }, data: { order: expect.objectContaining({ dueDate: 'Saturday' }) } });
    expect(db.whatsapp_draft.create).toHaveBeenCalledWith({ data: expect.objectContaining({ order: expect.objectContaining({ dueDate: 'Saturday' }) }) });
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });

  it('refuses to record a price that is not on the price list, so nothing is saved', async () => {
    const { service, db } = setup({
      toolCalls: async (tools) => {
        await expect(
          runHypaTool(tools.find((tool) => tool.name === 'record_order'), {} as never, { items: [{ name: 'Agbada', qty: 2, unitPrice: 30000 }] }),
        ).rejects.toThrow('45000');
      },
    });
    await service.handle(text());
    expect(db.whatsapp_thread.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: { order: expect.anything() } }));
  });

  it('flags a reply that quotes a price off the list and never auto-sends it', async () => {
    const { service, db } = setup({ numberRow: { auto_reply: true }, events: [done('Agbada is ₦40,000 today')] });
    await service.handle(text());
    expect(db.whatsapp_draft.create).toHaveBeenCalledWith({ data: expect.objectContaining({ price_warning: true }) });
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });

  it('holds a hand-off for the owner and records why', async () => {
    const { service, db } = setup({
      numberRow: { auto_reply: true },
      toolCalls: async (tools) => void (await runHypaTool(tools.find((tool) => tool.name === 'ask_owner'), {} as never, { reason: 'Wants a discount' })),
    });
    await service.handle(text());
    expect(db.whatsapp_draft.create).toHaveBeenCalledWith({ data: expect.objectContaining({ needs_owner: true, reason: 'Wants a discount' }) });
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });
});

describe('auto-reply', () => {
  it('sends a simple answer straight away when the owner turned auto-reply on', async () => {
    const { service } = setup({ numberRow: { auto_reply: true }, events: [done('We open 9am to 6pm. Agbada is ₦45,000.')] });
    await service.handle(text());
    expect(clientMock.sendText).toHaveBeenCalledWith('pn-1', '2348000000001', 'We open 9am to 6pm. Agbada is ₦45,000.');
  });
});

describe('the 24-hour window', () => {
  const old = new Date(Date.now() - 25 * 60 * 60 * 1000);

  it('is open for a day after the customer last wrote', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    expect(withinServiceWindow(new Date('2026-11-08T12:00:01Z'), now)).toBe(true);
    expect(withinServiceWindow(new Date('2026-11-08T11:59:59Z'), now)).toBe(false);
  });

  it('sends only the approved template when an approved draft is outside the window', async () => {
    const { service, db } = setup({ threadRow: { last_inbound_at: old } });
    db.whatsapp_draft.update.mockResolvedValue({ status: 'template_sent' });
    const draft = { id: 'draft-1', threadId: 'thread-1', status: 'pending', text: 'Your quote', audio_key: null, image_keys: [] };
    db.whatsapp_draft.findFirst = jest.fn().mockResolvedValue({ ...draft, thread: { ...thread, last_inbound_at: old, number } });
    await service.send('owner-1', 'draft-1');
    expect(clientMock.sendTemplate).toHaveBeenCalledWith('pn-1', '2348000000001', { name: 'quote_ready', language: 'en' });
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });

  it('sends the owner-edited text, with the voice note, inside the window', async () => {
    const { service, db, media } = setup();
    db.whatsapp_draft.findFirst = jest.fn().mockResolvedValue({
      id: 'draft-1', threadId: 'thread-1', status: 'pending', text: 'Original', audio_key: 'k1', image_keys: [],
      thread: { ...thread, number },
    });
    await service.send('owner-1', 'draft-1', '  Edited by the owner  ');
    expect(clientMock.sendText).toHaveBeenCalledWith('pn-1', '2348000000001', 'Edited by the owner');
    expect(media.get).toHaveBeenCalledWith('k1');
    expect(clientMock.uploadMedia).toHaveBeenCalledWith('pn-1', expect.any(Buffer), 'audio/ogg');
    expect(clientMock.sendAudio).toHaveBeenCalledWith('pn-1', '2348000000001', 'uploaded-1');
  });

  it('will not send a draft that was already handled', async () => {
    const { service, db } = setup();
    db.whatsapp_draft.findFirst = jest.fn().mockResolvedValue({ id: 'draft-1', threadId: 'thread-1', status: 'sent', text: 'x', audio_key: null, image_keys: [], thread: { ...thread, number } });
    await expect(service.send('owner-1', 'draft-1')).rejects.toThrow('already handled');
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });
});

describe('sending once', () => {
  const draft = { id: 'draft-1', threadId: 'thread-1', status: 'pending', text: 'Your quote', audio_key: null, image_keys: [] };
  const found = (db: ReturnType<typeof setup>['db']) => (db.whatsapp_draft.findFirst = jest.fn().mockResolvedValue({ ...draft, thread: { ...thread, number } }));

  it('sends nothing when another tap already took the draft', async () => {
    const { service, db } = setup();
    found(db);
    db.whatsapp_draft.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.send('owner-1', 'draft-1')).rejects.toThrow('already handled');
    expect(clientMock.sendText).not.toHaveBeenCalled();
  });

  it('gives the draft back to the owner when the send fails', async () => {
    const { service, db } = setup();
    found(db);
    clientMock.sendText.mockRejectedValueOnce(new Error('Meta is down'));
    await expect(service.send('owner-1', 'draft-1')).rejects.toThrow('Meta is down');
    expect(db.whatsapp_draft.update).toHaveBeenCalledWith({ where: { id: 'draft-1' }, data: { status: 'pending' } });
  });

  it('leaves an automatic reply that cannot be sent for the owner instead of retrying the job', async () => {
    const { service, db } = setup({ numberRow: { auto_reply: true }, events: [done('We open 9am to 6pm.')] });
    clientMock.sendText.mockRejectedValueOnce(new Error('Meta is down'));
    await expect(service.handle(text())).resolves.toBeUndefined();
    expect(db.whatsapp_draft.create).toHaveBeenCalledTimes(1);
  });

  it('refuses an owner message outside the 24-hour window instead of sending a template without it', async () => {
    const { service, db } = setup();
    db.whatsapp_thread.findFirst = jest.fn().mockResolvedValue({ ...thread, last_inbound_at: new Date(Date.now() - 25 * 60 * 60 * 1000), number });
    await expect(service.reply('owner-1', 'thread-1', 'Hello')).rejects.toThrow('24-hour window');
    expect(db.whatsapp_draft.create).not.toHaveBeenCalled();
  });
});

describe('billing', () => {
  it('holds the reply and alerts the owner when the wallet is low, and the customer sees nothing', async () => {
    const lowBalance: AgentEvent = { type: 'error', code: 'agent_failed', message: errorCodes.INSUFFICIENT_BALANCE.message };
    const { service, db } = setup({ events: [lowBalance] });
    await expect(service.handle(text())).resolves.toBeUndefined();
    expect(db.whatsapp_number.update).toHaveBeenCalledWith({ where: { id: 'num-1' }, data: { alert: 'low_balance' } });
    expect(db.whatsapp_draft.create).not.toHaveBeenCalled();
    expect(clientMock.sendText).not.toHaveBeenCalled();
    expect(clientMock.sendTemplate).not.toHaveBeenCalled();
  });

  it('handles a refusal thrown before the turn starts the same way', async () => {
    const { service, db, agent } = setup();
    agent.open.mockRejectedValueOnce({ response: { code: errorCodes.INSUFFICIENT_BALANCE.code, message: errorCodes.INSUFFICIENT_BALANCE.message } });
    await expect(service.handle(text())).resolves.toBeUndefined();
    expect(db.whatsapp_number.update).toHaveBeenCalledWith({ where: { id: 'num-1' }, data: { alert: 'low_balance' } });
  });

  it('clears the alert once a turn succeeds again', async () => {
    const { service, db } = setup({ numberRow: { alert: 'low_balance' } });
    await service.handle(text());
    expect(db.whatsapp_number.update).toHaveBeenCalledWith({ where: { id: 'num-1' }, data: { alert: null } });
  });

  it('retries on any other failure by throwing, so the queue runs the job again', async () => {
    const { service } = setup({ events: [{ type: 'error', code: 'request_timeout', message: 'Timed out' }] });
    await expect(service.handle(text())).rejects.toThrow('request_timeout');
  });
});

describe('owner takeover', () => {
  it('keeps the customer message in the chat and does not run the agent', async () => {
    const { service, db, agent } = setup({ threadRow: { mode: 'owner' } });
    await service.handle(text());
    expect(agent.open).not.toHaveBeenCalled();
    expect(db.message.create).toHaveBeenCalledWith({ data: { chatId: 'chat-1', role: 'user', content: 'Mo fẹ agbada meji' } });
  });
});

describe('privacy and ids', () => {
  it('hashes the customer number the same way each time, and never as the number itself', () => {
    process.env.ENCRYPTION_KEY = 'test-key';
    expect(customerHash('2348000000001')).toBe(customerHash('2348000000001'));
    expect(customerHash('2348000000001')).not.toContain('2348000000001');
    expect(customerHash('2348000000001')).not.toBe(customerHash('2348000000002'));
  });

  it('refuses to hash without a key, which would leave phone numbers open to guessing', () => {
    const key = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => customerHash('2348000000001')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = key;
  });

  it('gives one message one stable agent request id in UUID form', () => {
    expect(requestIdFor('wamid.1')).toBe(requestIdFor('wamid.1'));
    expect(requestIdFor('wamid.1')).not.toBe(requestIdFor('wamid.2'));
    expect(requestIdFor('wamid.1')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

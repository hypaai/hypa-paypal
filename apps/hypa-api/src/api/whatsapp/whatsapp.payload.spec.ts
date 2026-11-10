import { parseIncomingMessages } from './whatsapp.payload';

const webhook = (value: Record<string, unknown>) => ({
  object: 'whatsapp_business_account',
  entry: [{ id: 'waba', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: 'pn-1' }, ...value } }] }],
});
const contacts = [{ wa_id: '2348000000001', profile: { name: 'Amara' } }];

describe('parseIncomingMessages', () => {
  it('reads a text message with the customer name and send time', () => {
    const [message] = parseIncomingMessages(
      webhook({ contacts, messages: [{ id: 'wamid.1', from: '2348000000001', timestamp: '1700000000', type: 'text', text: { body: 'How much is agbada?' } }] }),
    );
    expect(message).toMatchObject({ id: 'wamid.1', phoneNumberId: 'pn-1', from: '2348000000001', name: 'Amara', kind: 'text', text: 'How much is agbada?' });
    expect(message.sentAt.getTime()).toBe(1_700_000_000_000);
  });

  it('reads a voice note and an audio file the same way', () => {
    const kinds = parseIncomingMessages(
      webhook({
        messages: [
          { id: 'a', from: '1', timestamp: '1', type: 'audio', audio: { id: 'media-a', mime_type: 'audio/ogg; codecs=opus', voice: true } },
          { id: 'b', from: '1', timestamp: '1', type: 'audio', audio: { id: 'media-b', mime_type: 'audio/mpeg' } },
        ],
      }),
    );
    expect(kinds.map((entry) => [entry.kind, entry.mediaId, entry.mimeType])).toEqual([
      ['voice', 'media-a', 'audio/ogg; codecs=opus'],
      ['voice', 'media-b', 'audio/mpeg'],
    ]);
  });

  it('reads a photo with its caption', () => {
    const [message] = parseIncomingMessages(
      webhook({ messages: [{ id: 'p', from: '1', timestamp: '1', type: 'image', image: { id: 'media-p', mime_type: 'image/jpeg', caption: 'My order' } }] }),
    );
    expect(message).toMatchObject({ kind: 'image', mediaId: 'media-p', mimeType: 'image/jpeg', text: 'My order' });
  });

  it('marks stickers, locations and documents as unsupported', () => {
    const kinds = parseIncomingMessages(
      webhook({
        messages: ['sticker', 'location', 'document', 'video', 'contacts'].map((type, index) => ({ id: `m${index}`, from: '1', timestamp: '1', type, [type]: { id: 'x' } })),
      }),
    ).map((entry) => entry.kind);
    expect(kinds).toEqual(['unsupported', 'unsupported', 'unsupported', 'unsupported', 'unsupported']);
  });

  it('ignores delivery receipts and reactions', () => {
    expect(parseIncomingMessages(webhook({ statuses: [{ id: 'wamid.1', status: 'delivered' }] }))).toEqual([]);
    expect(parseIncomingMessages(webhook({ messages: [{ id: 'r', from: '1', timestamp: '1', type: 'reaction', reaction: { emoji: '👍' } }] }))).toEqual([]);
  });

  it('ignores anything that is not a WhatsApp business webhook, without throwing', () => {
    for (const body of [null, 'x', 42, [], {}, { object: 'page' }, { object: 'whatsapp_business_account', entry: 'x' }, webhook({ messages: 'x' })]) {
      expect(parseIncomingMessages(body)).toEqual([]);
    }
    expect(parseIncomingMessages({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages: [{ id: '1' }] } }] }] })).toEqual([]);
  });
});

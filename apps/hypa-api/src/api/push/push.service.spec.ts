import { PushService } from './push.service';

function setup(tokens: string[] = ['ExponentPushToken[a]', 'ExponentPushToken[b]']) {
  const db = {
    push_device: {
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue(tokens.map((token) => ({ token }))),
    },
  };
  return { service: new PushService(db as never), db };
}

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as never;
});

describe('push tokens', () => {
  it('moves a phone to whoever signed in last', async () => {
    const { service, db } = setup();
    await service.register('user-2', 'ExponentPushToken[a]', 'ios');
    expect(db.push_device.upsert).toHaveBeenCalledWith({ where: { token: 'ExponentPushToken[a]' }, create: { userId: 'user-2', token: 'ExponentPushToken[a]', platform: 'ios' }, update: { userId: 'user-2', platform: 'ios' } });
  });

  it('only removes the signed-in user\'s own token', async () => {
    const { service, db } = setup();
    await service.unregister('user-1', 'ExponentPushToken[a]');
    expect(db.push_device.deleteMany).toHaveBeenCalledWith({ where: { token: 'ExponentPushToken[a]', userId: 'user-1' } });
  });
});

describe('notify', () => {
  it('sends one message per phone of the user', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: [{ status: 'ok' }, { status: 'ok' }] }) });
    const { service } = setup();
    await service.notify('user-1', { title: 'Ada', body: 'New order', data: { threadId: 't1' } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://exp.host/--/api/v2/push/send');
    expect(JSON.parse(init.body)).toEqual([
      { to: 'ExponentPushToken[a]', sound: 'default', title: 'Ada', body: 'New order', data: { threadId: 't1' } },
      { to: 'ExponentPushToken[b]', sound: 'default', title: 'Ada', body: 'New order', data: { threadId: 't1' } },
    ]);
  });

  it('sends nothing for a user with no phone', async () => {
    const { service } = setup([]);
    await service.notify('user-1', { title: 'a', body: 'b' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forgets a phone that no longer has the app', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: [{ status: 'ok' }, { status: 'error', details: { error: 'DeviceNotRegistered' } }] }) });
    const { service, db } = setup();
    await service.notify('user-1', { title: 'a', body: 'b' });
    expect(db.push_device.deleteMany).toHaveBeenCalledWith({ where: { token: { in: ['ExponentPushToken[b]'] } } });
  });

  it('never throws, so the work that caused the push goes on', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const { service } = setup();
    await expect(service.notify('user-1', { title: 'a', body: 'b' })).resolves.toBeUndefined();
  });
});

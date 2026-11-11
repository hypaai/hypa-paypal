import { Prisma } from 'src/generated/prisma/client';
import { WhatsappOwnerService } from './whatsapp.owner.service';
import * as client from './whatsapp.client';

jest.mock('./whatsapp.client', () => ({ ...jest.requireActual('./whatsapp.client'), readNumber: jest.fn() }));
const clientMock = jest.mocked(client);

const profile = { name: 'Mama Ade Tailors', sells: 'Agbada', currency: 'NGN', priceList: [{ name: 'Agbada', price: 45000 }], languages: ['English'] };

const allowed = 'owner@hypa.test, owner2@hypa.test';

function setup(options: { own?: object | null; used?: string[] } = {}) {
  const db = {
    user: { findUnique: jest.fn().mockImplementation(async ({ where }) => ({ email: where.id === 'owner-2' ? 'owner2@hypa.test' : where.id === 'stranger' ? 'stranger@x.test' : 'owner@hypa.test' })) },
    whatsapp_number: {
      findFirst: jest.fn().mockResolvedValue(options.own ?? null),
      findMany: jest.fn().mockResolvedValue((options.used ?? []).map((phone_number_id) => ({ phone_number_id }))),
      create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'num-1', alert: null, ...data })),
      update: jest.fn().mockImplementation(async ({ data }) => ({ id: 'num-1', phone_number_id: '1397541643448933', display_phone: '+1 555 123 4567', ...data })),
    },
  };
  return { service: new WhatsappOwnerService(db as never), db };
}

describe('connect', () => {
  beforeEach(() => {
    process.env.WHATSAPP_CONNECT_EMAILS = allowed;
    clientMock.readNumber.mockResolvedValue({ id: 'x', display_phone_number: '+1 555 123 4567' });
  });
  afterEach(() => {
    delete process.env.WHATSAPP_PHONE_NUMBER_IDS;
    delete process.env.WHATSAPP_CONNECT_EMAILS;
  });

  it('gives a number only to a listed account', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933';
    const { service, db } = setup();
    await expect(service.connect('stranger', { profile })).rejects.toThrow('not open to this account');
    delete process.env.WHATSAPP_CONNECT_EMAILS;
    await expect(service.connect('owner-1', { profile })).rejects.toThrow('not open to this account');
    expect(db.whatsapp_number.create).not.toHaveBeenCalled();
  });

  it('gives a new business the first number nobody uses, and keeps no credential', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933, 1500555000600';
    const { service, db } = setup({ used: ['1397541643448933'] });
    const number = await service.connect('owner-1', { profile });
    expect(db.whatsapp_number.create).toHaveBeenCalledWith({
      data: { userId: 'owner-1', phone_number_id: '1500555000600', display_phone: '+1 555 123 4567', profile: expect.objectContaining({ name: 'Mama Ade Tailors' }), auto_reply: false, alert: null },
    });
    expect(number).toMatchObject({ phoneNumberId: '1500555000600', displayPhone: '+1 555 123 4567', autoReply: false });
  });

  it('keeps a business on the number it already has and only updates its details', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933';
    const { service, db } = setup({ own: { id: 'num-1', phone_number_id: '1397541643448933', auto_reply: true } });
    await service.connect('owner-1', { profile });
    expect(db.whatsapp_number.create).not.toHaveBeenCalled();
    expect(db.whatsapp_number.update).toHaveBeenCalledWith({ where: { id: 'num-1' }, data: expect.objectContaining({ auto_reply: true, alert: null }) });
  });

  it('moves a business off a number that is no longer on the list and keeps its threads', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933';
    const { service, db } = setup({ own: { id: 'num-1', phone_number_id: '1415999774934646', auto_reply: true } });
    const number = await service.connect('owner-1', { profile });
    expect(db.whatsapp_number.create).not.toHaveBeenCalled();
    expect(db.whatsapp_number.update).toHaveBeenCalledWith({ where: { id: 'num-1' }, data: expect.objectContaining({ phone_number_id: '1397541643448933', auto_reply: true }) });
    expect(number).toMatchObject({ phoneNumberId: '1397541643448933', displayPhone: '+1 555 123 4567' });
  });

  it('says so when every number is taken', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933';
    const { service } = setup({ used: ['1397541643448933'] });
    await expect(service.connect('owner-2', { profile })).rejects.toThrow('Every WhatsApp number is in use');
  });

  it('says so when the server has no WhatsApp numbers', async () => {
    const { service } = setup();
    await expect(service.connect('owner-1', { profile })).rejects.toThrow('WhatsApp is not set up');
  });

  it('turns a race for the same number into a clear conflict', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933';
    const { service, db } = setup();
    db.whatsapp_number.create.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
    await expect(service.connect('owner-1', { profile })).rejects.toThrow('just taken');
  });

  it('does not connect when Meta refuses the token for the number', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933';
    clientMock.readNumber.mockRejectedValueOnce(new Error('Invalid OAuth access token'));
    const { service, db } = setup();
    await expect(service.connect('owner-1', { profile })).rejects.toThrow('Invalid OAuth access token');
    expect(db.whatsapp_number.create).not.toHaveBeenCalled();
  });

  it('refuses a business profile that is not valid', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_IDS = '1397541643448933';
    const { service, db } = setup();
    await expect(service.connect('owner-1', { profile: { name: '' } })).rejects.toThrow();
    expect(db.whatsapp_number.create).not.toHaveBeenCalled();
  });
});

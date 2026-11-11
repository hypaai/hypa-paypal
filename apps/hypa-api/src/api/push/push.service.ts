import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/libs/db/db.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN = /^(?:Exponent|Expo)PushToken\[[^\]\s]+\]$/;
const PLATFORMS = ['ios', 'android'];

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface PushTicket {
  status?: string;
  details?: { error?: string };
}

/**
 * Sends a notification to every phone a merchant has signed in on, through Expo's push service.
 * A phone registers its Expo token once; a token Expo says no longer exists is forgotten.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly db: DbService) {}

  /** A token belongs to one phone, so signing in as someone else moves it to them. */
  async register(userId: string, token: unknown, platform: unknown) {
    if (typeof token !== 'string' || !EXPO_TOKEN.test(token)) {
      throw new BadRequestException('A valid Expo push token is required');
    }
    if (typeof platform !== 'string' || !PLATFORMS.includes(platform)) {
      throw new BadRequestException('Platform must be ios or android');
    }
    await this.db.push_device.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
    return { registered: true };
  }

  async unregister(userId: string, token: unknown) {
    if (typeof token !== 'string') throw new BadRequestException('A push token is required');
    await this.db.push_device.deleteMany({ where: { userId, token } });
    return { registered: false };
  }

  /** Best effort: a notification that cannot be sent never fails the work that triggered it. */
  async send(userId: string, message: PushMessage) {
    const devices = await this.db.push_device.findMany({ where: { userId } });
    if (devices.length === 0) return;
    const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
    let tickets: PushTicket[] = [];
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(devices.map((device) => ({ to: device.token, sound: 'default', ...message }))),
      });
      if (!response.ok) {
        this.logger.warn(`Expo push service answered ${response.status}`);
        return;
      }
      tickets = ((await response.json()) as { data?: PushTicket[] }).data ?? [];
    } catch (error) {
      this.logger.warn(`Could not reach Expo's push service: ${error instanceof Error ? error.message : 'unknown error'}`);
      return;
    }
    // Tickets come back in the order the messages were sent.
    const gone = devices.filter((_, index) => tickets[index]?.details?.error === 'DeviceNotRegistered');
    if (gone.length) {
      await this.db.push_device.deleteMany({ where: { token: { in: gone.map((device) => device.token) } } });
    }
  }

  /** The WhatsApp bridge calls this. It is the same best-effort send. */
  async notify(userId: string, message: PushMessage) {
    await this.send(userId, message);
  }
}

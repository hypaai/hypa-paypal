import { Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/libs/db/db.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Tells a user's phones something happened. A push that fails is logged and never breaks the work that caused it. */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly db: DbService) {}

  /** A token belongs to one phone, so signing in as someone else moves it. */
  async register(userId: string, token: string) {
    await this.db.push_token.upsert({ where: { token }, create: { token, userId }, update: { userId } });
  }

  async unregister(userId: string, token: string) {
    await this.db.push_token.deleteMany({ where: { token, userId } });
  }

  async notify(userId: string, message: { title: string; body: string; data?: Record<string, string> }): Promise<void> {
    try {
      const tokens = (await this.db.push_token.findMany({ where: { userId }, select: { token: true } })).map((row) => row.token);
      if (!tokens.length) return;
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(tokens.map((to) => ({ to, sound: 'default', ...message }))),
      });
      if (!response.ok) throw new Error(`Expo answered ${response.status}`);
      const { data } = (await response.json()) as { data: { status: string; details?: { error?: string } }[] };
      // A phone that uninstalled the app will never get another push, so its token goes.
      const gone = tokens.filter((_, index) => data[index]?.details?.error === 'DeviceNotRegistered');
      if (gone.length) await this.db.push_token.deleteMany({ where: { token: { in: gone } } });
    } catch (error) {
      this.logger.warn(`A push notification was not sent: ${(error as Error).message}`);
    }
  }
}

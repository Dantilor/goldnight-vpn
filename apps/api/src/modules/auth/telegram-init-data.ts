import crypto from 'node:crypto';
import { z } from 'zod';
import type { ApiEnv } from '@goldnight/config';

const telegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional()
});

export type TelegramUser = z.infer<typeof telegramUserSchema>;

export class TelegramInitDataValidator {
  constructor(private readonly env: ApiEnv) {}

  validate(initData: string): { telegramUser: TelegramUser; authDate: number } {
    if (!this.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram bot token is not configured for initData validation');
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      throw new Error('Telegram initData hash is missing');
    }

    const authDateRaw = params.get('auth_date');
    const userRaw = params.get('user');
    if (!authDateRaw || !userRaw) {
      throw new Error('Telegram initData is missing required fields');
    }

    const authDate = Number(authDateRaw);
    if (!Number.isFinite(authDate)) {
      throw new Error('Telegram auth_date is invalid');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - authDate > this.env.TELEGRAM_INITDATA_TTL_SECONDS) {
      throw new Error('Telegram initData is expired');
    }

    const dataCheckString = Array.from(params.entries())
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.env.TELEGRAM_BOT_TOKEN)
      .digest();

    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const receivedBuffer = Buffer.from(hash, 'hex');
    const valid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!valid) {
      throw new Error('Telegram initData signature mismatch');
    }

    const telegramUser = telegramUserSchema.parse(JSON.parse(userRaw));
    return { telegramUser, authDate };
  }
}

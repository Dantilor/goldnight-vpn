import type { BotEnv } from '@goldnight/config';

export interface BotUserSummary {
  user: {
    id: string;
    telegramUserId: string;
    username?: string | null;
    firstName?: string | null;
    referralCode: string;
  };
  subscription: {
    status: 'active' | 'pending' | 'expired' | 'cancelled';
    planName: string;
    endsAt: string;
  } | null;
  access: {
    status: 'active' | 'expired' | 'revoked';
    provider: string;
    accessType: string;
    expiresAt: string | null;
  } | null;
  referrals: {
    total: number;
    granted: number;
  };
  support: {
    open: number;
  };
}

export class BackendClient {
  constructor(private readonly env: BotEnv) {}

  async getUserSummary(telegramUserId: string): Promise<BotUserSummary | null> {
    const response = await fetch(`${this.env.API_BASE_URL}/bot/users/${telegramUserId}/summary`, {
      method: 'GET',
      headers: {
        'x-bot-key': this.env.BOT_API_KEY
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Backend request failed with status ${response.status}`);
    }

    return (await response.json()) as BotUserSummary;
  }
}

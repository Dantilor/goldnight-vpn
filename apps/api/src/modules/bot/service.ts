import type { DataLayer } from '../../lib/data-layer.js';

export class BotService {
  constructor(private readonly dataLayer: DataLayer) {}

  async getUserByTelegramId(telegramUserId: string) {
    return this.dataLayer.getUserByTelegramId(telegramUserId);
  }

  async getSubscriptionSummary(userId: string) {
    const subscription = await this.dataLayer.getActiveSubscriptionByUserId(userId);

    if (!subscription) {
      return null;
    }

    return {
      status: subscription.status,
      planName: subscription.plan.name,
      endsAt: subscription.endsAt.toISOString()
    };
  }

  async getVpnAccessSummary(userId: string) {
    const access = await this.dataLayer.getLatestActiveVpnAccessByUserId(userId);

    if (!access) {
      return null;
    }

    return {
      status: access.status,
      provider: access.provider,
      accessType: access.accessType,
      expiresAt: access.expiresAt?.toISOString() ?? null
    };
  }

  async getReferralsSummary(userId: string) {
    const total = await this.dataLayer.countReferrals({ userId });
    const granted = await this.dataLayer.countReferrals({ userId, grantedOnly: true });
    return { total, granted };
  }

  async getSupportSummary(userId: string) {
    const open = await this.dataLayer.countOpenSupport({ userId });
    return { open };
  }
}

import type { ApiEnv } from '@goldnight/config';
import { TokenService } from './token-service.js';
import { TelegramInitDataValidator } from './telegram-init-data.js';
import type { DataLayer } from '../../lib/data-layer.js';

export class AuthService {
  private readonly validator: TelegramInitDataValidator;
  private readonly tokenService: TokenService;

  constructor(
    private readonly dataLayer: DataLayer,
    private readonly env: ApiEnv
  ) {
    this.validator = new TelegramInitDataValidator(env);
    this.tokenService = new TokenService(env);
  }

  async authenticateTelegramInitData(input: { initData: string }) {
    const { telegramUser } = this.validator.validate(input.initData);
    const username = telegramUser.username ?? null;
    const firstName = telegramUser.first_name ?? null;
    const lastName = telegramUser.last_name ?? null;

    const user = await this.dataLayer.upsertUserByTelegramId({
      telegramUserId: String(telegramUser.id),
      username,
      firstName,
      lastName,
      referralCode: `ref_${telegramUser.id}`
    });

    const currentSubscription = await this.dataLayer.getActiveSubscriptionByUserId(user.id);

    const token = this.tokenService.sign({
      sub: user.id,
      telegramUserId: user.telegramUserId
    });

    return {
      user: {
        id: user.id,
        telegramUserId: user.telegramUserId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode
      },
      token,
      subscription: currentSubscription
        ? {
            id: currentSubscription.id,
            status: currentSubscription.status,
            endsAt: currentSubscription.endsAt.toISOString(),
            plan: {
              id: currentSubscription.plan.id,
              name: currentSubscription.plan.name,
              durationDays: currentSubscription.plan.durationDays,
              deviceLimit: currentSubscription.plan.deviceLimit
            }
          }
        : null
    };
  }
}

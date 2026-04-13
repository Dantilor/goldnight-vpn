import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';
import { createBotGuard } from './guard.js';
import { botTelegramUserParamsSchema } from './schemas.js';
import { BotService } from './service.js';

export async function registerBotRoutes(app: FastifyInstance, ctx: AppContext) {
  const botGuard = createBotGuard(ctx.env);
  const service = new BotService(ctx.dataLayer);

  app.get('/bot/users/:telegramUserId/summary', { preHandler: [botGuard] }, async (request, reply) => {
    const params = botTelegramUserParamsSchema.parse(request.params);
    const user = await service.getUserByTelegramId(params.telegramUserId);
    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }

    const [subscription, access, referrals, support] = await Promise.all([
      service.getSubscriptionSummary(user.id),
      service.getVpnAccessSummary(user.id),
      service.getReferralsSummary(user.id),
      service.getSupportSummary(user.id)
    ]);

    return {
      user: {
        id: user.id,
        telegramUserId: user.telegramUserId,
        username: user.username,
        firstName: user.firstName,
        referralCode: user.referralCode
      },
      subscription,
      access,
      referrals,
      support
    };
  });
}

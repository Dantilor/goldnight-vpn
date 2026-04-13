import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';
import { patchMeEmailBodySchema, telegramAuthBodySchema } from './schemas.js';
import { AuthService } from './service.js';

export async function registerAuthRoutes(app: FastifyInstance, ctx: AppContext) {
  const authService = new AuthService(ctx.dataLayer, ctx.env);

  app.post('/auth/telegram', async (request, reply) => {
    const body = telegramAuthBodySchema.parse(request.body);
    try {
      const payload = await authService.authenticateTelegramInitData(body);
      return reply.code(200).send(payload);
    } catch (error) {
      request.log.warn({ error }, 'Telegram auth validation failed');
      if (error instanceof Error && error.message.includes('not configured')) {
        return reply.code(503).send({ message: 'Telegram authentication is not configured on server' });
      }
      return reply.code(401).send({ message: 'Telegram authentication failed' });
    }
  });

  app.get('/me', { preHandler: [ctx.requireAuth] }, async (request) => {
    const authUser = request.authUser!;
    return ctx.dataLayer.getUserById(authUser.id);
  });

  app.patch('/me/email', { preHandler: [ctx.requireAuth] }, async (request, reply) => {
    const body = patchMeEmailBodySchema.parse(request.body ?? {});
    const userId = request.authUser!.id;
    const normalized = body.email.trim().toLowerCase();
    try {
      await ctx.dataLayer.updateUserEmail(userId, normalized);
    } catch (err) {
      request.log.error({ err }, 'Failed to update user email');
      return reply.code(500).send({ message: 'Не удалось сохранить email. Попробуйте позже.' });
    }
    const user = await ctx.dataLayer.getUserById(userId);
    return reply.code(200).send({ email: user?.email ?? normalized });
  });
}

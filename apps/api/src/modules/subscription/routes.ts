import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';
import { SubscriptionService } from './service.js';

export async function registerSubscriptionRoutes(app: FastifyInstance, ctx: AppContext) {
  const service = new SubscriptionService(ctx.dataLayer);

  app.get('/me/subscription', { preHandler: [ctx.requireAuth] }, async (request) =>
    service.getCurrent(request.authUser!.id)
  );
}

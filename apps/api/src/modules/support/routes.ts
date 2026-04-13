import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';

export async function registerSupportRoutes(app: FastifyInstance, ctx: AppContext) {
  app.get('/me/support', { preHandler: [ctx.requireAuth] }, async (request) => {
    return ctx.dataLayer.listSupportRequests({ userId: request.authUser!.id });
  });
}

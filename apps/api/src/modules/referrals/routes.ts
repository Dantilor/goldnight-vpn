import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';

export async function registerReferralRoutes(app: FastifyInstance, ctx: AppContext) {
  app.get('/me/referrals', { preHandler: [ctx.requireAuth] }, async (request) => {
    return ctx.dataLayer.listReferralsByInviter({ userId: request.authUser!.id });
  });
}

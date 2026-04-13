import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../app-context.js';
import { registerAdminRoutes } from './admin/routes.js';
import { registerAuthRoutes } from './auth/routes.js';
import { registerBotRoutes } from './bot/routes.js';
import { registerPlansRoutes } from './plans/routes.js';
import { registerSubscriptionRoutes } from './subscription/routes.js';
import { registerVpnRoutes } from './vpn/routes.js';
import { registerReferralRoutes } from './referrals/routes.js';
import { registerSupportRoutes } from './support/routes.js';
import { registerPaymentRoutes } from './payments/routes.js';

export async function registerModules(app: FastifyInstance, ctx: AppContext) {
  app.get('/health', async () => ({ ok: true }));
  app.get('/ready', async (_request, reply) => {
    try {
      const db = await ctx.dataLayer.checkReadiness();
      return {
        ok: true,
        mode: ctx.env.DATA_LAYER,
        checks: {
          config: 'ok',
          dataLayer: db.detail
        }
      };
    } catch (error) {
      app.log.error({ error }, 'Readiness check failed');
      return reply.code(503).send({
        ok: false,
        mode: ctx.env.DATA_LAYER,
        checks: {
          config: 'ok',
          dataLayer: 'failed'
        }
      });
    }
  });

  await registerAdminRoutes(app, ctx);
  await registerAuthRoutes(app, ctx);
  await registerBotRoutes(app, ctx);
  await registerPlansRoutes(app, ctx);
  await registerSubscriptionRoutes(app, ctx);
  await registerVpnRoutes(app, ctx);
  await registerReferralRoutes(app, ctx);
  await registerSupportRoutes(app, ctx);
  await registerPaymentRoutes(app, ctx);
}

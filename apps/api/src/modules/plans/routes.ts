import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';
import { listPlansQuerySchema } from './schemas.js';
import { PlansService } from './service.js';

export async function registerPlansRoutes(app: FastifyInstance, ctx: AppContext) {
  const service = new PlansService(ctx.dataLayer);

  app.get('/plans', async (request) => {
    const query = listPlansQuerySchema.parse(request.query);
    return service.list(query);
  });
}

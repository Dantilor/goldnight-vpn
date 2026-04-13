import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiEnv } from '@goldnight/config';

export function createAdminGuard(env: ApiEnv) {
  return async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
    const adminKey = request.headers['x-admin-key'];
    if (typeof adminKey !== 'string' || adminKey !== env.ADMIN_API_KEY) {
      return reply.code(401).send({ message: 'Admin access denied' });
    }
  };
}
